import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { API_BASE_URL } from '../utils/constants';
import { getOwners, selectOwner, getMyTenants, removeTenant, hasOwner } from '../api/userApi';
import { getMyPayments, initiatePayment, verifyPayment, createBill, donateToCharity } from '../api/paymentApi';
import { getApiErrorMessage } from '../api/apiError';

const GATEWAYS = { ESEWA: { label: 'eSewa' }, KHALTI: { label: 'Khalti' } };
const COMMUNITY = ['MAINTENANCE', 'GARBAGE'];
const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;
const isPending = (status) => status === 'Pending' || status === 'Overdue';
const isCommunity = (payment) => COMMUNITY.includes((payment?.category || '').toUpperCase());
const formatDate = (dateString) => (dateString ? new Date(dateString).toLocaleDateString() : 'N/A');

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function PaymentCard({ item, onPay, extra }) {
  return (
    <Card style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>{item.category}</Text>
        <Text style={styles.meta}>{extra || `Due ${formatDate(item.dueDate)}`}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatNPR(item.amount)}</Text>
        {onPay && isPending(item.status) ? (
          <TouchableOpacity style={styles.payBtn} onPress={() => onPay(item)}>
            <Text style={styles.payBtnText}>Pay</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.status}>{item.status}</Text>
        )}
      </View>
    </Card>
  );
}

function GatewayModal({ visible, payment, onClose, onPaid }) {
  const [gateway, setGateway] = useState('ESEWA');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  sessionRef.current = session;

  const verifyCurrent = useCallback(async () => {
    if (!payment || !sessionRef.current) return;
    setLoading(true);
    try {
      const payload = sessionRef.current.gateway === 'KHALTI'
        ? { gateway: 'KHALTI', pidx: sessionRef.current.pidx }
        : { gateway: 'ESEWA', transactionUuid: sessionRef.current.transactionUuid, totalAmount: payment.amount };
      const response = await verifyPayment(payment.id, payload);
      if (response.data?.verified) {
        Alert.alert('Payment Verified', 'The payment was confirmed successfully.');
        setSession(null);
        onClose();
        onPaid?.();
      } else {
        Alert.alert('Verification Pending', `Gateway status: ${response.data?.status || 'Unknown'}`);
      }
    } catch (error) {
      Alert.alert('Verification Failed', getApiErrorMessage(error, 'Unable to verify payment.'));
    } finally {
      setLoading(false);
    }
  }, [payment, onClose, onPaid]);

  useEffect(() => {
    if (!visible) return undefined;
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('khalti') || url.includes('esewa')) verifyCurrent();
    });
    return () => sub.remove();
  }, [visible, verifyCurrent]);

  const start = async () => {
    if (!payment) return;
    setLoading(true);
    try {
      const response = await initiatePayment(payment.id, {
        gateway,
        returnUrl: `tolunitymob://payments/${gateway.toLowerCase()}`,
        successUrl: 'tolunitymob://payments/esewa-success',
        failureUrl: 'tolunitymob://payments/esewa-failure',
        websiteUrl: 'https://tolunity.local',
      });
      if (gateway === 'KHALTI') {
        setSession({ gateway, pidx: response.data?.pidx });
        await Linking.openURL(response.data?.paymentUrl);
      } else {
        setSession({ gateway, transactionUuid: response.data?.transactionUuid });
        const bridgeUrl = `${API_BASE_URL}/payments/pay/${payment.id}/esewa-redirect?transactionUuid=${encodeURIComponent(response.data?.transactionUuid)}&successUrl=${encodeURIComponent('tolunitymob://payments/esewa-success')}&failureUrl=${encodeURIComponent('tolunitymob://payments/esewa-failure')}`;
        await Linking.openURL(bridgeUrl);
      }
    } catch (error) {
      Alert.alert('Gateway Error', getApiErrorMessage(error, 'Unable to start payment gateway.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{payment?.title || 'Payment'}</Text>
          <Text style={styles.modalAmount}>{payment ? formatNPR(payment.amount) : ''}</Text>
          <View style={styles.gatewayRow}>
            {Object.entries(GATEWAYS).map(([key, value]) => (
              <TouchableOpacity key={key} style={[styles.gatewayChip, gateway === key && styles.gatewayChipActive]} onPress={() => setGateway(key)}>
                <Text style={[styles.gatewayChipText, gateway === key && styles.gatewayChipTextActive]}>{value.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={start} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Open Gateway</Text>}
          </TouchableOpacity>
          {session && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={verifyCurrent} disabled={loading}>
              <Text style={styles.secondaryBtnText}>Verify After Returning</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.textBtn} onPress={onClose}>
            <Text style={styles.textBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SecurityPayments() {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const donate = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return Alert.alert('Invalid Amount', 'Enter a valid donation amount.');
    setSaving(true);
    try {
      await donateToCharity({ amount: value, message });
      setAmount('');
      setMessage('');
      Alert.alert('Donation Added', 'Charity donation was recorded.');
    } catch (error) {
      Alert.alert('Donation Failed', getApiErrorMessage(error, 'Unable to donate.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>Security Payment Access</Text>
        <Text style={styles.meta}>Security accounts keep all app features except regular payment modules. Charity donation is the only payment action here.</Text>
      </Card>
      <Card>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Donation amount" placeholderTextColor={COLORS.textMuted} />
        <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} placeholder="Message (optional)" placeholderTextColor={COLORS.textMuted} multiline />
        <TouchableOpacity style={styles.primaryBtn} onPress={donate} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Donate to Charity</Text>}
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

function TenantPayments() {
  const [loading, setLoading] = useState(true);
  const [ownerLinked, setOwnerLinked] = useState(false);
  const [owners, setOwners] = useState([]);
  const [payments, setPayments] = useState([]);
  const [modalPayment, setModalPayment] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ownerStatus, paymentRes] = await Promise.all([hasOwner(), getMyPayments()]);
      const linked = Boolean(ownerStatus.data?.hasOwner);
      setOwnerLinked(linked);
      setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);
      if (!linked) {
        const ownerRes = await getOwners();
        setOwners(Array.isArray(ownerRes.data) ? ownerRes.data : []);
      } else {
        setOwners([]);
      }
    } catch (error) {
      Alert.alert('Load Failed', getApiErrorMessage(error, 'Unable to load payments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const communityPayments = payments.filter(isCommunity);
  const rentPayments = payments.filter((payment) => !isCommunity(payment));
  const due = payments.filter((payment) => isPending(payment.status)).reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const paid = payments.filter((payment) => payment.status === 'Paid').reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={styles.summary}><Text style={styles.summaryText}>Due {formatNPR(due)}</Text><Text style={styles.summaryText}>Paid {formatNPR(paid)}</Text></Card>
      {!ownerLinked && (
        <Card>
          <Text style={styles.sectionTitle}>Owner Link</Text>
          <Text style={styles.meta}>Rent remains between owner and tenant only. Link your owner here if you want rent bills inside the app.</Text>
          {owners.map((owner) => (
            <TouchableOpacity key={owner.id} style={styles.linkRow} onPress={async () => { await selectOwner(owner.id); load(); }}>
              <Text style={styles.title}>{owner.name}</Text>
              <Text style={styles.meta}>{owner.email}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}
      <Card><Text style={styles.sectionTitle}>Community Fees</Text><Text style={styles.meta}>Admin-managed payments now include only maintenance and garbage collection.</Text></Card>
      {communityPayments.length ? communityPayments.map((item) => <PaymentCard key={item.id} item={item} onPay={setModalPayment} />) : <Card><Text style={styles.meta}>No community fees available.</Text></Card>}
      <Card><Text style={styles.sectionTitle}>Rent Bills</Text><Text style={styles.meta}>Rent billing is shown only for linked owner-tenant relationships and is excluded from admin reporting.</Text></Card>
      {ownerLinked ? (
        rentPayments.length ? rentPayments.map((item) => <PaymentCard key={item.id} item={item} onPay={setModalPayment} extra={`${item.payeeName ? `Pay to ${item.payeeName} • ` : ''}Due ${formatDate(item.dueDate)}`} />) : <Card><Text style={styles.meta}>No rent bills available.</Text></Card>
      ) : <Card><Text style={styles.meta}>Link an owner first to receive rent bills.</Text></Card>}
      <GatewayModal visible={!!modalPayment} payment={modalPayment} onClose={() => setModalPayment(null)} onPaid={load} />
    </ScrollView>
  );
}

function OwnerPayments() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [modalPayment, setModalPayment] = useState(null);
  const [billTenant, setBillTenant] = useState(null);
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentRes, tenantRes] = await Promise.all([getMyPayments(), getMyTenants()]);
      setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);
      setTenants(Array.isArray(tenantRes.data) ? tenantRes.data : []);
    } catch (error) {
      Alert.alert('Load Failed', getApiErrorMessage(error, 'Unable to load owner payments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const communityPayments = payments.filter(isCommunity);
  const rentPayments = payments.filter((payment) => (payment.category || '').toUpperCase() === 'RENT');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card><Text style={styles.sectionTitle}>Community Fees</Text><Text style={styles.meta}>Owners still pay maintenance and garbage dues here with the new gateway flow.</Text></Card>
      {communityPayments.length ? communityPayments.map((item) => <PaymentCard key={item.id} item={item} onPay={setModalPayment} />) : <Card><Text style={styles.meta}>No community fees available.</Text></Card>}
      <Card><Text style={styles.sectionTitle}>Tenants</Text><Text style={styles.meta}>Rent remains an owner-tenant matter and does not count toward admin revenue.</Text></Card>
      {tenants.length ? tenants.map((tenant) => (
        <Card key={tenant.id} style={styles.row}>
          <View style={styles.left}><Text style={styles.title}>{tenant.name}</Text><Text style={styles.meta}>{tenant.email}</Text></View>
          <View style={styles.actionCol}>
            <TouchableOpacity style={styles.payBtn} onPress={() => setBillTenant(tenant)}><Text style={styles.payBtnText}>Bill</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: COLORS.error }]} onPress={async () => { await removeTenant(tenant.id); load(); }}><Text style={styles.payBtnText}>Remove</Text></TouchableOpacity>
          </View>
        </Card>
      )) : <Card><Text style={styles.meta}>No linked tenants available.</Text></Card>}
      <Card><Text style={styles.sectionTitle}>Rent Collections</Text></Card>
      {rentPayments.length ? rentPayments.map((item) => <PaymentCard key={item.id} item={item} extra={`${item.payerName ? `Tenant ${item.payerName} • ` : ''}Due ${formatDate(item.dueDate)}`} />) : <Card><Text style={styles.meta}>No rent bills available.</Text></Card>}
      <GatewayModal visible={!!modalPayment} payment={modalPayment} onClose={() => setModalPayment(null)} onPaid={load} />
      <Modal visible={!!billTenant} transparent animationType="slide" onRequestClose={() => setBillTenant(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create Rent Bill</Text>
            <Text style={styles.meta}>Tenant: {billTenant?.name}</Text>
            <TextInput style={styles.input} value={billTitle} onChangeText={setBillTitle} placeholder="April Rent" placeholderTextColor={COLORS.textMuted} />
            <TextInput style={styles.input} value={billAmount} onChangeText={setBillAmount} keyboardType="numeric" placeholder="12000" placeholderTextColor={COLORS.textMuted} />
            <TouchableOpacity style={styles.primaryBtn} onPress={async () => {
              try {
                await createBill({ title: billTitle, amount: parseFloat(billAmount), payerId: billTenant.id, category: 'RENT' });
                setBillTenant(null); setBillTitle(''); setBillAmount(''); load();
              } catch (error) {
                Alert.alert('Bill Failed', getApiErrorMessage(error, 'Unable to create rent bill.'));
              }
            }}>
              <Text style={styles.primaryBtnText}>Send Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default function PaymentsScreen() {
  const { user } = useAuth();
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={styles.header}><Text style={styles.headerTitle}>Payments</Text></View>
      {user?.userType === 'SECURITY' ? <SecurityPayments /> : user?.userType === 'OWNER' ? <OwnerPayments /> : <TenantPayments />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.feedBg },
  header: { backgroundColor: COLORS.primary, padding: SPACING.lg, ...SHADOWS.header },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xl, fontWeight: '800' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.feedBg },
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.card },
  summary: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between' },
  summaryText: { color: '#FFF', fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1 },
  right: { alignItems: 'flex-end', marginLeft: SPACING.md },
  actionCol: { gap: SPACING.sm },
  title: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  meta: { color: COLORS.textMuted, lineHeight: 18 },
  amount: { fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  status: { color: COLORS.textMuted, fontWeight: '700' },
  payBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingHorizontal: SPACING.md, paddingVertical: 6 },
  payBtnText: { color: '#FFF', fontWeight: '800', fontSize: FONTS.sizes.xs },
  linkRow: { borderTopWidth: 1, borderTopColor: COLORS.cardBorder, paddingTop: SPACING.md, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.bgInputBorder, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, color: COLORS.textPrimary },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: '800' },
  secondaryBtn: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  secondaryBtnText: { color: COLORS.primary, fontWeight: '800' },
  textBtn: { marginTop: SPACING.md, alignItems: 'center' },
  textBtnText: { color: COLORS.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', padding: SPACING.xxl, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  modalAmount: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.lg },
  gatewayRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  gatewayChip: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.bgInput, alignItems: 'center' },
  gatewayChipActive: { backgroundColor: COLORS.primary },
  gatewayChipText: { color: COLORS.primary, fontWeight: '700' },
  gatewayChipTextActive: { color: '#FFF' },
});
