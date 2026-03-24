import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  Animated,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { getOwners, selectOwner, getMyTenants, removeTenant, hasOwner } from '../api/userApi';
import { getMyPayments, payBill, createBill } from '../api/paymentApi';

// ─── Shared Constants ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Pending: { bg: '#FFF9E6', text: '#F39C12', borderColor: '#FFF0B2' },
  Overdue: { bg: '#FFF0F0', text: COLORS.error, borderColor: '#FFD0D0' },
  Paid: { bg: '#E8FFF0', text: COLORS.success, borderColor: '#C2F0D5' },
};

const GATEWAY_CONFIG = {
  esewa: { name: 'eSewa', color: '#60BB46', icon: 'wallet-outline', textColor: '#FFF' },
  khalti: { name: 'Khalti', color: '#5C2D91', icon: 'card-outline', textColor: '#FFF' },
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;

// ─── Payment Gateway Modal ──────────────────────────────────────────────────────

function PaymentModal({ visible, onClose, payment, onPaymentSuccess }) {
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [processing, setProcessing] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      slideAnim.setValue(400);
      setSelectedGateway(null);
    }
  }, [visible]);

  const handlePay = async () => {
    if (!selectedGateway) {
      Alert.alert('Select Gateway', 'Please select a payment method');
      return;
    }
    setProcessing(true);
    try {
      // API call to record the payment in DB
      await payBill(payment.id);
      
      setProcessing(false);
      onClose();
      Alert.alert(
        'Payment Successful! ✅',
        `${formatNPR(payment?.amount)} paid via ${GATEWAY_CONFIG[selectedGateway].name}`,
        [{ text: 'Done', onPress: () => onPaymentSuccess?.(payment?.id) }]
      );
    } catch (error) {
      setProcessing(false);
      Alert.alert('Payment Failed', 'Something went wrong while processing the payment.');
    }
  };

  if (!payment) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Animated.View style={[modalStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>Pay Now</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={modalStyles.amountCard}>
            <Text style={modalStyles.amountLabel}>{payment.title}</Text>
            <Text style={modalStyles.amountValue}>{formatNPR(payment.amount)}</Text>
            <Text style={modalStyles.amountDue}>Due: {formatDate(payment.dueDate)}</Text>
          </View>
          <Text style={modalStyles.sectionTitle}>Choose Payment Method</Text>
          <View style={modalStyles.gatewayRow}>
            {Object.entries(GATEWAY_CONFIG).map(([key, gw]) => {
              const isSelected = selectedGateway === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[modalStyles.gatewayCard, isSelected && { borderColor: gw.color, backgroundColor: gw.color + '12' }]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedGateway(key)}
                >
                  <View style={[modalStyles.gatewayIcon, { backgroundColor: gw.color }]}>
                    <Ionicons name={gw.icon} size={24} color={gw.textColor} />
                  </View>
                  <Text style={[modalStyles.gatewayName, isSelected && { color: gw.color, fontWeight: '800' }]}>{gw.name}</Text>
                  {isSelected && (
                    <View style={[modalStyles.gatewayCheck, { backgroundColor: gw.color }]}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[modalStyles.payBtn, selectedGateway && { backgroundColor: GATEWAY_CONFIG[selectedGateway].color }, processing && { opacity: 0.7 }]}
            onPress={handlePay}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <><Ionicons name="lock-closed" size={16} color="#FFF" /><Text style={modalStyles.payBtnText}>Pay {formatNPR(payment.amount)}</Text></>
            )}
          </TouchableOpacity>
          <Text style={modalStyles.secureText}>
            <Ionicons name="shield-checkmark" size={11} color={COLORS.success} /> Secured & Encrypted Payment
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── SECURITY VIEW ──────────────────────────────────────────────────────────────

function SecurityView() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
      </View>
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="shield" size={48} color={COLORS.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Not Available</Text>
        <Text style={styles.emptySubtitle}>Payment features are not available for security accounts.</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── TENANT VIEW ────────────────────────────────────────────────────────────────

function TenantView() {
  const [loading, setLoading] = useState(true);
  const [ownerConfigured, setOwnerConfigured] = useState(false);
  const [ownersList, setOwnersList] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedTab, setSelectedTab] = useState('All');
  const [payModal, setPayModal] = useState({ visible: false, payment: null });
  const tabs = ['All', 'Pending', 'Paid'];

  const fetchData = useCallback(async () => {
    try {
      const res = await hasOwner();
      if (res.data.hasOwner) {
        setOwnerConfigured(true);
        const payRes = await getMyPayments();
        setPayments(payRes.data);
      } else {
        const ownerRes = await getOwners();
        setOwnersList(ownerRes.data);
      }
    } catch (err) {
      console.warn('Error fetching tenant data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectOwner = async (ownerId) => {
    try {
      setLoading(true);
      await selectOwner(ownerId);
      Alert.alert('Success', 'Owner linked successfully!');
      fetchData(); // reload
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Failed to select owner');
    }
  };

  const filtered = selectedTab === 'All'
    ? payments
    : payments.filter((p) => p.status === selectedTab || (selectedTab === 'Pending' && p.status === 'Overdue'));

  const pendingTotal = payments
    .filter((p) => p.status === 'Pending' || p.status === 'Overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const paidTotal = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Choose Owner Screen
  if (!ownerConfigured) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Your Owner</Text>
        </View>
        <Text style={{ padding: SPACING.lg, fontSize: FONTS.sizes.md, color: COLORS.textSecondary }}>
          Please select the property owner you are renting from to enable the payment dashboard.
        </Text>
        <FlatList
          data={ownersList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.payCard} onPress={() => handleSelectOwner(item.id)}>
              <View style={[styles.payIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="home" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.payInfo}>
                <Text style={styles.payTitle}>{item.name}</Text>
                <Text style={styles.payDue}>{item.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', opacity: 0.5, marginTop: 20 }}>No owners found.</Text>}
        />
      </SafeAreaView>
    );
  }

  // Dashboard Screen
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Dashboard</Text>
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatNPR(pendingTotal)}</Text>
          <Text style={styles.summaryLabel}>Total Due</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#A8FFD0' }]}>{formatNPR(paidTotal)}</Text>
          <Text style={styles.summaryLabel}>Total Paid</Text>
        </View>
      </View>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, selectedTab === tab && styles.tabActive]} onPress={() => setSelectedTab(tab)}>
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
          const canPay = item.status !== 'Paid';
          return (
            <View style={styles.payCard}>
              <View style={[styles.payIconWrap, { backgroundColor: cfg.bg }]}>
                <Ionicons name={item.icon || 'receipt-outline'} size={22} color={cfg.text} />
              </View>
              <View style={styles.payInfo}>
                <Text style={styles.payTitle}>{item.title}</Text>
                <Text style={styles.payDue}>{item.payeeName ? `Pay to: ${item.payeeName} • ` : ''}Due: {formatDate(item.dueDate)}</Text>
              </View>
              <View style={styles.payRight}>
                <Text style={styles.payAmount}>{formatNPR(item.amount)}</Text>
                {canPay ? (
                  <TouchableOpacity style={[styles.payNowBtn, item.status === 'Overdue' && { backgroundColor: COLORS.error }]} onPress={() => setPayModal({ visible: true, payment: item })}>
                    <Text style={styles.payNowText}>Pay Now</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.borderColor }]}><Text style={[styles.statusText, { color: cfg.text }]}>{item.status}</Text></View>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            <Text style={styles.emptyListText}>All good! No bills generated yet.</Text>
          </View>
        }
      />
      <PaymentModal
        visible={payModal.visible}
        payment={payModal.payment}
        onClose={() => setPayModal({ visible: false, payment: null })}
        onPaymentSuccess={() => fetchData()}
      />
    </SafeAreaView>
  );
}

// ─── OWNER VIEW ─────────────────────────────────────────────────────────────────

function OwnerView() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('tenants');
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [createBillModal, setCreateBillModal] = useState({ visible: false, tenantId: null, tenantName: '' });

  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState('RENT');
  
  const sections = [
    { key: 'reports', label: 'Overview', icon: 'pie-chart-outline' },
    { key: 'tenants', label: 'My Tenants', icon: 'people-outline' },
    { key: 'collections', label: 'Collections', icon: 'cash-outline' },
  ];

  const fetchData = useCallback(async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        getMyTenants(),
        getMyPayments()
      ]);
      setTenants(tRes.data);
      setPayments(pRes.data);
    } catch (err) {
      console.warn("Owner fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemoveTenant = async (id, name) => {
    Alert.alert('Remove Tenant', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await removeTenant(id);
            fetchData();
          } catch(e) { Alert.alert('Error', 'Failed to remove tenant'); }
      }}
    ]);
  };

  const handleCreateBill = async () => {
    if(!billTitle || !billAmount) return Alert.alert('Validation Error', 'Please enter title and amount');
    try {
      setLoading(true);
      await createBill({
        title: billTitle,
        amount: parseFloat(billAmount),
        category: billCategory,
        payerId: createBillModal.tenantId
      });
      setCreateBillModal({visible: false});
      setBillTitle('');
      setBillAmount('');
      fetchData();
      Alert.alert('Success', 'Bill generated sent to tenant!');
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Failed to create bill');
    }
  };

  if (loading && tenants.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const totalCollected = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Owner Tools</Text>
      </View>

      <View style={styles.tabsRow}>
        {sections.map((sec) => (
          <TouchableOpacity key={sec.key} style={[styles.tab, activeSection === sec.key && styles.tabActive]} onPress={() => setActiveSection(sec.key)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name={sec.icon} size={14} color={activeSection === sec.key ? '#FFF' : COLORS.textMuted} />
              <Text style={[styles.tabText, activeSection === sec.key && styles.tabTextActive]}>{sec.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview Section */}
      {activeSection === 'reports' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
           <View style={ownerStyles.summaryCard}>
              <Text style={ownerStyles.summaryTitle}>Revenue Overview</Text>
              <View style={ownerStyles.summaryRow}>
                <View style={ownerStyles.summaryDot}>
                  <View style={[ownerStyles.dot, { backgroundColor: COLORS.success }]} />
                  <Text style={ownerStyles.summaryRowLabel}>Total Collected</Text>
                </View>
                <Text style={ownerStyles.summaryRowValue}>{formatNPR(totalCollected)}</Text>
              </View>
              <View style={ownerStyles.summaryRow}>
                <View style={ownerStyles.summaryDot}>
                  <View style={[ownerStyles.dot, { backgroundColor: COLORS.warning }]} />
                  <Text style={ownerStyles.summaryRowLabel}>Pending Generation</Text>
                </View>
                <Text style={ownerStyles.summaryRowValue}>{formatNPR(totalPending)}</Text>
              </View>
           </View>
        </ScrollView>
      )}

      {/* Tenants Section */}
      {activeSection === 'tenants' && (
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.payCard}>
              <View style={[styles.payIconWrap, { backgroundColor: '#E8FFF0' }]}>
                <Ionicons name="person" size={22} color={COLORS.success} />
              </View>
              <View style={styles.payInfo}>
                <Text style={styles.payTitle}>{item.name}</Text>
                <Text style={styles.payDue}>{item.email}</Text>
              </View>
              <View style={{flexDirection: 'row', gap: 8}}>
                <TouchableOpacity onPress={() => setCreateBillModal({visible: true, tenantId: item.id, tenantName: item.name})} style={{backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm}}>
                  <Text style={{color: '#FFF', fontSize: 11, fontWeight: '700'}}>Bill</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveTenant(item.id, item.name)} style={{backgroundColor: COLORS.error, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm}}>
                  <Text style={{color: '#FFF', fontSize: 11, fontWeight: '700'}}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{textAlign: 'center', color: COLORS.textMuted, marginTop: 40}}>No tenants selected you as their owner.</Text>}
        />
      )}

      {/* Collections Section */}
      {activeSection === 'collections' && (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
            return (
              <View style={styles.payCard}>
                <View style={[styles.payIconWrap, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={item.icon || 'cash-outline'} size={22} color={cfg.text} />
                </View>
                <View style={styles.payInfo}>
                  <Text style={styles.payTitle}>{item.title}  <Text style={{fontSize: 10, opacity: 0.5}}>- {item.payerName}</Text></Text>
                  <Text style={styles.payDue}>Due: {formatDate(item.dueDate)}</Text>
                </View>
                <View style={styles.payRight}>
                  <Text style={styles.payAmount}>{formatNPR(item.amount)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.borderColor }]}><Text style={[styles.statusText, { color: cfg.text }]}>{item.status}</Text></View>
                </View>
              </View>
            )
          }}
          ListEmptyComponent={<Text style={{textAlign: 'center', color: COLORS.textMuted, marginTop: 40}}>No bills generated yet.</Text>}
        />
      )}

      {/* Bill Generation Modal */}
      <Modal visible={createBillModal.visible} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.headerTitle}>Generate Bill</Text>
              <TouchableOpacity onPress={() => setCreateBillModal({visible: false})} style={modalStyles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={{marginBottom: 10, color: COLORS.textMuted}}>Recipient: <Text style={{fontWeight: '700', color: COLORS.textPrimary}}>{createBillModal.tenantName}</Text></Text>
            
            <TextInput style={ownerStyles.input} placeholder="Title (e.g., May Rent)" value={billTitle} onChangeText={setBillTitle} />
            <TextInput style={ownerStyles.input} placeholder="Amount (NPR)" keyboardType="numeric" value={billAmount} onChangeText={setBillAmount} />

            <View style={ownerStyles.infoNote}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={ownerStyles.infoNoteText}>
                Owners can generate rent bills here. Community charges are managed from admin billing setup.
              </Text>
            </View>

            <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
              {['RENT'].map(cat => (
                <TouchableOpacity key={cat} onPress={() => setBillCategory(cat)} style={[ownerStyles.catBtn, billCategory === cat && ownerStyles.catBtnActive]}>
                  <Text style={[ownerStyles.catBtnText, billCategory === cat && {color: '#FFF'}]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={modalStyles.payBtn} onPress={handleCreateBill} disabled={loading}>
              <Text style={modalStyles.payBtnText}>{loading ? 'Sending...' : 'Send Bill to Tenant'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────────

export default function PaymentsScreen() {
  const { user } = useAuth();
  if (user?.userType === 'SECURITY') return <SecurityView />;
  if (user?.userType === 'OWNER') return <OwnerView />;
  return <TenantView />;
}

// ─── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.feedBg },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    ...SHADOWS.header,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#FFF', flex: 1 },
  summaryCard: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl, paddingBottom: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#FFF' },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  tabsRow: {
    flexDirection: 'row', backgroundColor: COLORS.bgCard,
    marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
    borderRadius: RADIUS.xl, padding: 4, ...SHADOWS.card,
  },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.lg },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#FFF' },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  payCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.card,
  },
  payIconWrap: {
    width: 46, height: 46, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  payInfo: { flex: 1 },
  payTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  payDue: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  payRight: { alignItems: 'flex-end' },
  payAmount: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  payNowBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  payNowText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.pill, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.bgInput, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptySubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyList: { alignItems: 'center', paddingVertical: SPACING.xxxl * 2 },
  emptyListText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: SPACING.md },
});

const ownerStyles = StyleSheet.create({
  summaryCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.xl, ...SHADOWS.card },
  summaryTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  summaryDot: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  summaryRowLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  summaryRowValue: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.bgInputBorder, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, fontSize: FONTS.sizes.md },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoNoteText: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    lineHeight: 18,
  },
  catBtn: { flex: 1, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.bgInputBorder, borderRadius: RADIUS.md, alignItems: 'center' },
  catBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catBtnText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary }
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.xxl, paddingBottom: SPACING.xxxl + 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bgInput, alignItems: 'center', justifyContent: 'center' },
  amountCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xl },
  amountLabel: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.7)', marginBottom: SPACING.xs },
  amountValue: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  amountDue: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.6)', marginTop: SPACING.xs },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  gatewayRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  gatewayCard: { flex: 1, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.bgInputBorder, padding: SPACING.lg, alignItems: 'center', position: 'relative' },
  gatewayIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  gatewayName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  gatewayCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  payBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, ...SHADOWS.button },
  payBtnText: { color: '#FFF', fontSize: FONTS.sizes.md, fontWeight: '800' },
  secureText: { textAlign: 'center', fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: SPACING.md },
});
