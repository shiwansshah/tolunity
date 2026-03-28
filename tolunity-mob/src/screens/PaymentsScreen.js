import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useNotifications } from '../context/NotificationContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { API_BASE_URL } from '../utils/constants';
import { getOwners, selectOwner, getMyTenants, removeTenant, hasOwner } from '../api/userApi';
import { getMyPayments, getGatewayConfig, initiatePayment, verifyPayment, createBill, initiateCharityDonation, verifyCharityDonation } from '../api/paymentApi';
import { getApiErrorMessage } from '../api/apiError';

const APP_PAYMENT_URL = 'tolunitymob://payments';
const COMMUNITY = ['MAINTENANCE', 'GARBAGE'];
const METHOD_CONFIG = {
  ESEWA: { label: 'Pay with eSewa', icon: 'phone-portrait-outline', style: 'success' },
  KHALTI: { label: 'Pay with Khalti', icon: 'card-outline', style: 'success' },
};

const formatNPR = (amount) => `NPR ${(amount || 0).toLocaleString('en-IN')}`;
const isPending = (status) => status === 'Pending' || status === 'Overdue';
const isCommunity = (payment) => COMMUNITY.includes((payment?.category || '').toUpperCase());
const sumAmounts = (payments) => payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
const formatDate = (dateString) => (dateString ? new Date(dateString).toLocaleDateString() : 'N/A');
const formatLongDate = (dateString) => (
  dateString
    ? new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'No due date'
);
const formatCategory = (category) => {
  const normalized = (category || '').toUpperCase();
  if (normalized === 'MAINTENANCE') return 'Maintenance Fund';
  if (normalized === 'GARBAGE') return 'Garbage Fee';
  if (normalized === 'RENT') return 'Rent';
  return category || 'Payment';
};
const getStatusStyle = (status) => {
  if (status === 'Paid') return styles.statusPaid;
  if (status === 'Overdue') return styles.statusOverdue;
  return styles.statusPending;
};
const buildEsewaCallbackUrl = (paymentId, outcome) => {
  const appRedirectUrl = `${APP_PAYMENT_URL}/esewa-${outcome}?paymentId=${paymentId}`;
  return `${API_BASE_URL}/payments/pay/${paymentId}/esewa-callback?redirectUrl=${encodeURIComponent(appRedirectUrl)}&outcome=${encodeURIComponent(outcome)}`;
};
const buildCharityEsewaCallbackUrl = (sessionId, outcome) => {
  const appRedirectUrl = `${APP_PAYMENT_URL}/charity-esewa-${outcome}?sessionId=${sessionId}`;
  return `${API_BASE_URL}/payments/charity/${sessionId}/esewa-callback?redirectUrl=${encodeURIComponent(appRedirectUrl)}&outcome=${encodeURIComponent(outcome)}`;
};
const getEarliestDuePayment = (payments) => [...payments]
  .filter((payment) => payment?.dueDate)
  .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))[0] || null;

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function DueHeroCard({
  amount,
  dueDate,
  title = 'Total Due This Month',
  emptyText = 'No pending dues right now.',
  supportingText,
}) {
  const hasDue = amount > 0;

  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroLabel}>{title}</Text>
      <Text style={styles.heroAmount}>{formatNPR(amount)}</Text>
      <Text style={styles.heroMeta}>{hasDue ? `Next due: ${formatLongDate(dueDate)}` : emptyText}</Text>
      {supportingText ? <Text style={styles.heroHint}>{supportingText}</Text> : null}
    </View>
  );
}

function SummaryStrip({ items }) {
  return (
    <View style={styles.summaryStrip}>
      {items.map((item) => (
        <View key={item.label} style={styles.summaryTile}>
          <Text style={styles.summaryTileLabel}>{item.label}</Text>
          <Text style={styles.summaryTileValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function BreakdownCard({ title, payments, selectedPaymentId, onSelectPayment, emptyText }) {
  const total = sumAmounts(payments);

  return (
    <Card>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="receipt-outline" size={18} color={COLORS.accent} />
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
      {payments.length ? payments.map((item, index) => {
        const selected = item.id === selectedPaymentId;
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.breakdownRow,
              selected && styles.breakdownRowSelected,
              index === payments.length - 1 && styles.breakdownRowLast,
            ]}
            onPress={() => onSelectPayment?.(item.id)}
          >
            <View style={styles.breakdownTextWrap}>
              <Text style={styles.breakdownTitle}>{item.title || formatCategory(item.category)}</Text>
              <Text style={styles.breakdownMeta}>{`Due ${formatDate(item.dueDate)}`}</Text>
            </View>
            <Text style={styles.breakdownAmount}>{formatNPR(item.amount)}</Text>
          </TouchableOpacity>
        );
      }) : <Text style={styles.meta}>{emptyText}</Text>}
      <View style={styles.breakdownDivider} />
      <View style={styles.breakdownFooter}>
        <Text style={styles.breakdownFooterLabel}>Total Amount</Text>
        <Text style={styles.breakdownFooterAmount}>{formatNPR(total)}</Text>
      </View>
    </Card>
  );
}

function PaymentMethodButton({ gateway, loading, active, disabled, onPress }) {
  const config = METHOD_CONFIG[gateway];
  const successStyle = config.style === 'success';

  return (
    <TouchableOpacity
      style={[
        styles.methodButton,
        successStyle ? styles.methodButtonSuccess : styles.methodButtonOutline,
        disabled && styles.methodButtonDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      {loading && active ? (
        <ActivityIndicator color={successStyle ? '#FFF' : COLORS.primary} />
      ) : (
        <>
          <Ionicons name={config.icon} size={18} color={successStyle ? '#FFF' : COLORS.textPrimary} />
          <Text style={[styles.methodButtonText, successStyle ? styles.methodButtonTextSuccess : styles.methodButtonTextOutline]}>
            {config.label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function CheckoutCard({ selectedPayment, gatewayConfig, loading, processingGateway, session, onPay, onVerify }) {
  const hasEsewa = gatewayConfig?.esewaEnabled !== false;
  const hasKhalti = Boolean(gatewayConfig?.khaltiEnabled);

  return (
    <Card>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="card-outline" size={18} color={COLORS.info} />
        <Text style={styles.sectionHeaderText}>Select Payment Method</Text>
      </View>
      {selectedPayment ? (
        <View style={styles.selectedBillBox}>
          <Text style={styles.selectedBillLabel}>Selected Bill</Text>
          <Text style={styles.selectedBillTitle}>{selectedPayment.title}</Text>
          <Text style={styles.selectedBillMeta}>{`${formatCategory(selectedPayment.category)} | ${formatNPR(selectedPayment.amount)}`}</Text>
        </View>
      ) : (
        <View style={styles.selectedBillBox}>
          <Text style={styles.meta}>Select a pending bill to enable the payment methods.</Text>
        </View>
      )}
      {hasEsewa && (
        <PaymentMethodButton gateway="ESEWA" loading={loading} active={processingGateway === 'ESEWA'} disabled={!selectedPayment || loading} onPress={() => onPay('ESEWA')} />
      )}
      {hasKhalti && (
        <PaymentMethodButton gateway="KHALTI" loading={loading} active={processingGateway === 'KHALTI'} disabled={!selectedPayment || loading} onPress={() => onPay('KHALTI')} />
      )}
      <Text style={styles.gatewayHint}>
        {hasKhalti ? 'Use eSewa or Khalti to complete the selected bill.' : 'Use eSewa to complete the selected bill.'}
      </Text>
      {session && (
        <View style={styles.sessionBox}>
          <Text style={styles.sessionTitle}>Checkout in progress</Text>
          <Text style={styles.sessionMeta}>{`${session.title} | ${formatNPR(session.amount)}`}</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onVerify} disabled={loading}>
            <Text style={styles.secondaryBtnText}>Verify payment</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

function PaymentCard({ item, selected, onSelect, actionLabel = 'Select Bill', showAction = true, extra }) {
  const selectable = showAction && isPending(item.status);

  return (
    <Card style={[styles.paymentCard, selected && styles.paymentCardSelected]}>
      <View style={styles.paymentIconWrap}>
        <Ionicons name={item.icon || 'cash-outline'} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.paymentBody}>
        <View style={styles.paymentMain}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{formatCategory(item.category)}</Text>
          <Text style={styles.meta}>{extra || `Due ${formatDate(item.dueDate)}`}</Text>
        </View>
        <View style={styles.paymentSide}>
          <Text style={styles.amount}>{formatNPR(item.amount)}</Text>
          {selectable ? (
            <TouchableOpacity style={[styles.selectBtn, selected && styles.selectBtnActive]} onPress={() => onSelect?.(item.id)}>
              <Text style={[styles.selectBtnText, selected && styles.selectBtnTextActive]}>{selected ? 'Selected' : actionLabel}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

function TenantReportCard({ entry }) {
  return (
    <Card>
      <View style={styles.reportHeader}>
        <View>
          <Text style={styles.title}>{entry.name}</Text>
          <Text style={styles.meta}>{`${entry.paidBills} paid bill${entry.paidBills === 1 ? '' : 's'} | ${entry.pendingBills} pending`}</Text>
        </View>
        <Text style={styles.reportTotal}>{formatNPR(entry.totalPaid)}</Text>
      </View>
      <View style={styles.reportRow}><Text style={styles.meta}>Paid to date</Text><Text style={styles.reportValue}>{formatNPR(entry.totalPaid)}</Text></View>
      <View style={styles.reportRow}><Text style={styles.meta}>Outstanding</Text><Text style={styles.reportValue}>{formatNPR(entry.totalPending)}</Text></View>
      <View style={styles.reportRow}><Text style={styles.meta}>Next due</Text><Text style={styles.reportValue}>{entry.nextDueDate ? formatDate(entry.nextDueDate) : 'No pending rent'}</Text></View>
    </Card>
  );
}

function CharityContributionCard({ description = 'Support the community charity fund with a direct contribution.', gatewayConfig }) {
  const { refreshNotifications } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState(null);
  const [localGatewayConfig, setLocalGatewayConfig] = useState(gatewayConfig || { esewaEnabled: true, khaltiEnabled: false });
  const sessionRef = useRef(null);
  sessionRef.current = session;

  useEffect(() => {
    setLocalGatewayConfig((current) => ({
      ...current,
      ...(gatewayConfig || {}),
    }));
  }, [gatewayConfig]);

  useEffect(() => {
    if (gatewayConfig) return undefined;

    let mounted = true;
    getGatewayConfig()
      .then((response) => {
        if (!mounted) return;
        setLocalGatewayConfig({
          esewaEnabled: Boolean(response.data?.esewaEnabled),
          khaltiEnabled: Boolean(response.data?.khaltiEnabled),
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [gatewayConfig]);

  const verifyCurrent = useCallback(async () => {
    if (!sessionRef.current) return;

    setSaving(true);
    try {
      const current = sessionRef.current;
      const response = await verifyCharityDonation(current.sessionId, {
        gateway: 'ESEWA',
        transactionUuid: current.transactionUuid,
        totalAmount: current.amount,
      });

      if (response.data?.verified) {
        setAmount('');
        setMessage('');
        setSession(null);
        setVisible(false);
        await refreshNotifications({ silent: true });
        Alert.alert('Donation Confirmed', 'Your charity donation was verified successfully.');
      } else {
        Alert.alert('Verification Pending', `Current gateway status: ${response.data?.status || 'Unknown'}`);
      }
    } catch (error) {
      Alert.alert('Verification Failed', getApiErrorMessage(error, 'Unable to verify charity donation.'));
    } finally {
      setSaving(false);
    }
  }, []);

  const handleIncomingUrl = useCallback((url) => {
    if (!url || !url.startsWith(APP_PAYMENT_URL)) return;
    if (url.includes('/charity-esewa-')) verifyCurrent();
  }, [verifyCurrent]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url);
    }).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
    return () => sub.remove();
  }, [handleIncomingUrl]);

  const donate = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return Alert.alert('Invalid Amount', 'Enter a valid donation amount.');
    if (localGatewayConfig?.esewaEnabled === false) {
      return Alert.alert('eSewa Unavailable', 'The eSewa gateway is not configured right now.');
    }

    setSaving(true);
    try {
      const response = await initiateCharityDonation({
        gateway: 'ESEWA',
        amount: value,
        message,
      });

      const sessionId = response.data?.sessionId;
      const transactionUuid = response.data?.transactionUuid;
      if (!sessionId || !transactionUuid) {
        throw new Error('Unable to prepare charity donation checkout.');
      }

      const successUrl = buildCharityEsewaCallbackUrl(sessionId, 'success');
      const failureUrl = buildCharityEsewaCallbackUrl(sessionId, 'failure');

      setSession({
        sessionId,
        transactionUuid,
        amount: value,
      });

      const bridgeUrl = `${API_BASE_URL}/payments/charity/${sessionId}/esewa-redirect?transactionUuid=${encodeURIComponent(transactionUuid)}&successUrl=${encodeURIComponent(successUrl)}&failureUrl=${encodeURIComponent(failureUrl)}`;
      await Linking.openURL(bridgeUrl);
    } catch (error) {
      Alert.alert('Donation Failed', getApiErrorMessage(error, 'Unable to start charity donation.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card style={styles.charityCard}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="heart-outline" size={18} color="#C2416C" />
          <Text style={styles.sectionHeaderText}>Charity Fund</Text>
        </View>
        <Text style={styles.meta}>{description}</Text>
        <View style={styles.charityHighlights}>
          <View style={styles.charityHighlightPill}>
            <Text style={styles.charityHighlightLabel}>Purpose</Text>
            <Text style={styles.charityHighlightValue}>Community support</Text>
          </View>
          <View style={styles.charityHighlightPill}>
            <Text style={styles.charityHighlightLabel}>Entry</Text>
            <Text style={styles.charityHighlightValue}>Quick donation</Text>
          </View>
        </View>
        <Text style={styles.gatewayHint}>
          Donate through eSewa so the contribution is verified before it enters the charity ledger.
        </Text>
        <TouchableOpacity style={styles.charityBtn} onPress={() => setVisible(true)}>
          <Ionicons name="heart" size={16} color="#FFF" />
          <Text style={styles.charityBtnText}>Donate with eSewa</Text>
        </TouchableOpacity>
      </Card>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Make a Charity Donation</Text>
            <Text style={styles.meta}>Your contribution will be verified through eSewa and then recorded in the community charity fund ledger.</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Donation amount" placeholderTextColor={COLORS.textMuted} />
            <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} placeholder="Message or note (optional)" placeholderTextColor={COLORS.textMuted} multiline />
            {session ? (
              <View style={styles.sessionBox}>
                <Text style={styles.sessionTitle}>Donation checkout in progress</Text>
                <Text style={styles.sessionMeta}>{`${formatNPR(session.amount)} | eSewa`}</Text>
                <TouchableOpacity style={styles.secondaryBtn} onPress={verifyCurrent} disabled={saving}>
                  <Text style={styles.secondaryBtnText}>Verify donation</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.secondaryModalBtn} onPress={() => setVisible(false)} disabled={saving}>
                <Text style={styles.secondaryModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryModalBtn} onPress={donate} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Continue to eSewa</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function usePaymentGateway(onPaid) {
  const { refreshNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [processingGateway, setProcessingGateway] = useState(null);
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  sessionRef.current = session;

  const verifyCurrent = useCallback(async () => {
    if (!sessionRef.current) return;
    setLoading(true);
    setProcessingGateway('VERIFY');
    try {
      const current = sessionRef.current;
      const payload = current.gateway === 'KHALTI'
        ? { gateway: 'KHALTI', pidx: current.pidx }
        : { gateway: 'ESEWA', transactionUuid: current.transactionUuid, totalAmount: current.amount };
      const response = await verifyPayment(current.paymentId, payload);
      if (response.data?.verified) {
        await refreshNotifications({ silent: true });
        Alert.alert('Payment Confirmed', 'Your payment was verified successfully.');
        setSession(null);
        onPaid?.();
      } else {
        Alert.alert('Verification Pending', `Current gateway status: ${response.data?.status || 'Unknown'}`);
      }
    } catch (error) {
      Alert.alert('Verification Failed', getApiErrorMessage(error, 'Unable to verify payment.'));
    } finally {
      setLoading(false);
      setProcessingGateway(null);
    }
  }, [onPaid, refreshNotifications]);

  const handleIncomingUrl = useCallback((url) => {
    if (!url || !url.startsWith(APP_PAYMENT_URL)) return;
    if (url.includes('/khalti') || url.includes('/esewa-')) verifyCurrent();
  }, [verifyCurrent]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url);
    }).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
    return () => sub.remove();
  }, [handleIncomingUrl]);

  const startGateway = useCallback(async (payment, gateway) => {
    if (!payment) return Alert.alert('Select a Bill', 'Choose a pending bill before selecting a payment method.');
    if (!isPending(payment.status)) return Alert.alert('Payment Unavailable', 'This bill is already settled.');
    setLoading(true);
    setProcessingGateway(gateway);
    try {
      const successUrl = buildEsewaCallbackUrl(payment.id, 'success');
      const failureUrl = buildEsewaCallbackUrl(payment.id, 'failure');
      const response = await initiatePayment(payment.id, {
        gateway,
        returnUrl: `${APP_PAYMENT_URL}/${gateway.toLowerCase()}`,
        successUrl,
        failureUrl,
        websiteUrl: 'https://tolunity.local',
      });
      if (gateway === 'KHALTI') {
        setSession({ paymentId: payment.id, title: payment.title, amount: payment.amount, gateway, pidx: response.data?.pidx });
        await Linking.openURL(response.data?.paymentUrl);
      } else {
        setSession({ paymentId: payment.id, title: payment.title, amount: payment.amount, gateway, transactionUuid: response.data?.transactionUuid });
        const bridgeUrl = `${API_BASE_URL}/payments/pay/${payment.id}/esewa-redirect?transactionUuid=${encodeURIComponent(response.data?.transactionUuid)}&successUrl=${encodeURIComponent(successUrl)}&failureUrl=${encodeURIComponent(failureUrl)}`;
        await Linking.openURL(bridgeUrl);
      }
    } catch (error) {
      Alert.alert('Gateway Error', getApiErrorMessage(error, 'Unable to start payment gateway.'));
    } finally {
      setLoading(false);
      setProcessingGateway(null);
    }
  }, []);

  return { loading, processingGateway, session, verifyCurrent, startGateway };
}

function SecurityPayments() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>Security Payment Access</Text>
        <Text style={styles.meta}>Security accounts do not handle resident billing. Charity donation remains the only payment action available in this workspace.</Text>
      </Card>
      <CharityContributionCard description="Security accounts can still contribute directly to the community charity fund from here." />
    </ScrollView>
  );
}

function TenantPayments() {
  const { refreshNotifications } = useNotifications();
  const [loadingPage, setLoadingPage] = useState(true);
  const [ownerLinked, setOwnerLinked] = useState(false);
  const [owners, setOwners] = useState([]);
  const [payments, setPayments] = useState([]);
  const [gatewayConfig, setGatewayConfig] = useState({ esewaEnabled: true, khaltiEnabled: false });
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const load = useCallback(async () => {
    setLoadingPage(true);
    try {
      const [ownerStatus, paymentRes, gatewayRes] = await Promise.all([hasOwner(), getMyPayments(), getGatewayConfig()]);
      const linked = Boolean(ownerStatus.data?.hasOwner);
      setOwnerLinked(linked);
      setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);
      setGatewayConfig({
        esewaEnabled: Boolean(gatewayRes.data?.esewaEnabled),
        khaltiEnabled: Boolean(gatewayRes.data?.khaltiEnabled),
      });
      if (!linked) {
        const ownerRes = await getOwners();
        setOwners(Array.isArray(ownerRes.data) ? ownerRes.data : []);
      } else {
        setOwners([]);
      }
    } catch (error) {
      Alert.alert('Load Failed', getApiErrorMessage(error, 'Unable to load payments.'));
    } finally {
      setLoadingPage(false);
    }
  }, []);

  const { loading, processingGateway, session, verifyCurrent, startGateway } = usePaymentGateway(load);

  useEffect(() => { load(); }, [load]);

  const communityPayments = useMemo(() => payments.filter(isCommunity), [payments]);
  const pendingCommunityPayments = useMemo(() => communityPayments.filter((payment) => isPending(payment.status)), [communityPayments]);
  const rentPayments = useMemo(() => payments.filter((payment) => !isCommunity(payment)), [payments]);
  const pendingRentPayments = useMemo(() => rentPayments.filter((payment) => isPending(payment.status)), [rentPayments]);
  const communityDue = sumAmounts(pendingCommunityPayments);
  const rentDue = sumAmounts(pendingRentPayments);
  const totalDue = communityDue + rentDue;
  const nextPendingDue = getEarliestDuePayment([...pendingCommunityPayments, ...pendingRentPayments]);

  useEffect(() => {
    const pendingIds = payments.filter((payment) => isPending(payment.status)).map((payment) => payment.id);
    if (!pendingIds.length) {
      setSelectedPaymentId(null);
      return;
    }
    setSelectedPaymentId((current) => (current && pendingIds.includes(current) ? current : pendingIds[0]));
  }, [payments]);

  if (loadingPage) return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId) || null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <DueHeroCard
        amount={totalDue}
        dueDate={nextPendingDue?.dueDate}
        title="Total Amount Due"
        emptyText="No pending bills right now."
        supportingText={ownerLinked
          ? 'Includes maintenance, garbage, and rent bills that are still pending.'
          : 'Maintenance and garbage are included. Link your owner to bring rent bills into the app as well.'}
      />
      <SummaryStrip
        items={[
          { label: 'Community Fees', value: formatNPR(communityDue) },
          { label: 'Rent Due', value: formatNPR(rentDue) },
          { label: 'Pending Bills', value: `${pendingCommunityPayments.length + pendingRentPayments.length}` },
        ]}
      />
      <BreakdownCard title="Community Charges" payments={pendingCommunityPayments} selectedPaymentId={selectedPaymentId} onSelectPayment={setSelectedPaymentId} emptyText="No pending community charges right now." />

      {!ownerLinked && (
        <Card>
          <Text style={styles.sectionTitle}>Link Your Owner</Text>
          <Text style={styles.meta}>Link your property owner only if you want rent bills to appear inside the app as well.</Text>
          {owners.map((owner) => (
            <TouchableOpacity key={owner.id} style={styles.linkRow} onPress={async () => {
              await selectOwner(owner.id);
              await refreshNotifications({ silent: true });
              load();
            }}>
              <Text style={styles.title}>{owner.name}</Text>
              <Text style={styles.meta}>{owner.email}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Rent Bills</Text>
        <Text style={styles.meta}>Pending rent is now included in the total due above. Select a rent bill below if you want to pay it through the same checkout section.</Text>
      </Card>
      {ownerLinked ? (
        rentPayments.length ? rentPayments.map((item) => (
          <PaymentCard
            key={item.id}
            item={item}
            selected={item.id === selectedPaymentId}
            onSelect={setSelectedPaymentId}
            actionLabel="Select to pay"
            extra={`${item.payeeName ? `Pay to ${item.payeeName} | ` : ''}Due ${formatDate(item.dueDate)}`}
          />
        )) : <Card><Text style={styles.meta}>No rent bills available.</Text></Card>
      ) : <Card><Text style={styles.meta}>Link an owner first to receive rent bills.</Text></Card>}

      <CheckoutCard selectedPayment={selectedPayment} gatewayConfig={gatewayConfig} loading={loading} processingGateway={processingGateway} session={session} onPay={(gateway) => startGateway(selectedPayment, gateway)} onVerify={verifyCurrent} />
      <CharityContributionCard gatewayConfig={gatewayConfig} description="Want to contribute beyond your bills? Add a charity donation without leaving the payments workspace." />
    </ScrollView>
  );
}

function OwnerPayments() {
  const { refreshNotifications } = useNotifications();
  const [loadingPage, setLoadingPage] = useState(true);
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [gatewayConfig, setGatewayConfig] = useState({ esewaEnabled: true, khaltiEnabled: false });
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [billTenant, setBillTenant] = useState(null);
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');

  const load = useCallback(async () => {
    setLoadingPage(true);
    try {
      const [paymentRes, tenantRes, gatewayRes] = await Promise.all([getMyPayments(), getMyTenants(), getGatewayConfig()]);
      setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);
      setTenants(Array.isArray(tenantRes.data) ? tenantRes.data : []);
      setGatewayConfig({
        esewaEnabled: Boolean(gatewayRes.data?.esewaEnabled),
        khaltiEnabled: Boolean(gatewayRes.data?.khaltiEnabled),
      });
    } catch (error) {
      Alert.alert('Load Failed', getApiErrorMessage(error, 'Unable to load owner payments.'));
    } finally {
      setLoadingPage(false);
    }
  }, []);

  const { loading, processingGateway, session, verifyCurrent, startGateway } = usePaymentGateway(load);

  useEffect(() => { load(); }, [load]);

  const communityPayments = useMemo(() => payments.filter(isCommunity), [payments]);
  const pendingCommunityPayments = useMemo(() => communityPayments.filter((payment) => isPending(payment.status)), [communityPayments]);
  const rentPayments = useMemo(() => payments.filter((payment) => (payment.category || '').toUpperCase() === 'RENT'), [payments]);
  const pendingRentPayments = useMemo(() => rentPayments.filter((payment) => isPending(payment.status)), [rentPayments]);
  const communityDue = sumAmounts(pendingCommunityPayments);
  const nextCommunityDue = getEarliestDuePayment(pendingCommunityPayments);

  useEffect(() => {
    const pendingIds = pendingCommunityPayments.map((payment) => payment.id);
    if (!pendingIds.length) {
      setSelectedPaymentId(null);
      return;
    }
    setSelectedPaymentId((current) => (current && pendingIds.includes(current) ? current : pendingIds[0]));
  }, [pendingCommunityPayments]);

  const tenantReport = useMemo(() => {
    const reportMap = new Map();
    rentPayments.forEach((payment) => {
      const key = payment.payerId || payment.payerName || payment.id;
      if (!reportMap.has(key)) {
        reportMap.set(key, { key, name: payment.payerName || 'Tenant', totalPaid: 0, totalPending: 0, paidBills: 0, pendingBills: 0, nextDueDate: null });
      }
      const entry = reportMap.get(key);
      if (payment.status === 'Paid') {
        entry.totalPaid += payment.amount || 0;
        entry.paidBills += 1;
      } else {
        entry.totalPending += payment.amount || 0;
        entry.pendingBills += 1;
        if (!entry.nextDueDate || new Date(payment.dueDate) < new Date(entry.nextDueDate)) entry.nextDueDate = payment.dueDate;
      }
    });
    return [...reportMap.values()].sort((left, right) => right.totalPaid - left.totalPaid);
  }, [rentPayments]);

  if (loadingPage) return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const selectedPayment = communityPayments.find((payment) => payment.id === selectedPaymentId) || null;
  const totalRentCollected = sumAmounts(rentPayments.filter((payment) => payment.status === 'Paid'));
  const totalRentPending = sumAmounts(pendingRentPayments);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <DueHeroCard
        amount={communityDue}
        dueDate={nextCommunityDue?.dueDate}
        title="Community Fees Due"
        emptyText="No pending community dues right now."
        supportingText="Your own maintenance and garbage dues stay separate from the rent you collect from tenants."
      />
      <SummaryStrip
        items={[
          { label: 'Community Due', value: formatNPR(communityDue) },
          { label: 'Rent Collected', value: formatNPR(totalRentCollected) },
          { label: 'Rent Outstanding', value: formatNPR(totalRentPending) },
        ]}
      />
      <BreakdownCard title="Community Charges" payments={pendingCommunityPayments} selectedPaymentId={selectedPaymentId} onSelectPayment={setSelectedPaymentId} emptyText="No pending community charges right now." />
      <CheckoutCard selectedPayment={selectedPayment} gatewayConfig={gatewayConfig} loading={loading} processingGateway={processingGateway} session={session} onPay={(gateway) => startGateway(selectedPayment, gateway)} onVerify={verifyCurrent} />

      <Card style={styles.reportSummaryCard}>
        <Text style={styles.sectionTitle}>Tenant Rent Report</Text>
        <Text style={styles.meta}>Track how much rent has been collected from tenants and what is still outstanding.</Text>
        <View style={styles.reportSummaryRow}>
          <View style={styles.reportSummaryPill}><Text style={styles.reportSummaryLabel}>Collected</Text><Text style={styles.reportSummaryValue}>{formatNPR(totalRentCollected)}</Text></View>
          <View style={styles.reportSummaryPill}><Text style={styles.reportSummaryLabel}>Outstanding</Text><Text style={styles.reportSummaryValue}>{formatNPR(totalRentPending)}</Text></View>
        </View>
      </Card>
      {tenantReport.length ? tenantReport.map((entry) => <TenantReportCard key={entry.key} entry={entry} />) : <Card><Text style={styles.meta}>No tenant rent records available yet.</Text></Card>}

      <Card>
        <Text style={styles.sectionTitle}>Tenant Billing</Text>
        <Text style={styles.meta}>Create rent bills and manage linked tenants from this section.</Text>
      </Card>
      {tenants.length ? tenants.map((tenant) => (
        <Card key={tenant.id} style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.title}>{tenant.name}</Text>
            <Text style={styles.meta}>{tenant.email}</Text>
          </View>
          <View style={styles.actionCol}>
            <TouchableOpacity style={styles.payBtn} onPress={() => setBillTenant(tenant)}><Text style={styles.payBtnText}>Bill</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: COLORS.error }]} onPress={async () => { await removeTenant(tenant.id); load(); }}><Text style={styles.payBtnText}>Remove</Text></TouchableOpacity>
          </View>
        </Card>
      )) : <Card><Text style={styles.meta}>No linked tenants available.</Text></Card>}

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
                setBillTenant(null);
                setBillTitle('');
                setBillAmount('');
                await refreshNotifications({ silent: true });
                load();
              } catch (error) {
                Alert.alert('Bill Failed', getApiErrorMessage(error, 'Unable to create rent bill.'));
              }
            }}>
              <Text style={styles.primaryBtnText}>Send Bill</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <CharityContributionCard gatewayConfig={gatewayConfig} description="You can also contribute to the community charity fund from the same payment area." />
    </ScrollView>
  );
}

export default function PaymentsScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={styles.header}>
        <Text style={styles.brandTitle}>TolUnity</Text>
        <Text style={styles.headerTitle}>Payments</Text>
      </View>
      {user?.userType === 'SECURITY' ? <SecurityPayments /> : user?.userType === 'OWNER' ? <OwnerPayments /> : <TenantPayments />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FB' },
  header: { backgroundColor: '#173E96', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xl, ...SHADOWS.header },
  brandTitle: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: '900' },
  headerTitle: { color: 'rgba(255,255,255,0.88)', fontSize: FONTS.sizes.sm, fontWeight: '700', marginTop: 2 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F6FB' },
  heroCard: { backgroundColor: '#2148A0', borderRadius: 24, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xxl, marginBottom: SPACING.lg, ...SHADOWS.card },
  heroLabel: { color: 'rgba(255,255,255,0.86)', fontSize: FONTS.sizes.md, fontWeight: '700' },
  heroAmount: { color: '#FFF', fontSize: 30, fontWeight: '900', marginTop: SPACING.md },
  heroMeta: { color: 'rgba(255,255,255,0.82)', marginTop: SPACING.md, fontWeight: '600' },
  heroHint: { color: 'rgba(255,255,255,0.76)', marginTop: SPACING.sm, lineHeight: 19 },
  summaryStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
  summaryTile: { flexGrow: 1, flexBasis: '30%', backgroundColor: '#FFF', borderRadius: 18, padding: SPACING.md, borderWidth: 1, borderColor: '#DFE7F4', ...SHADOWS.card },
  summaryTileLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryTileValue: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: '900', marginTop: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#E1E8F3', ...SHADOWS.card },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  sectionHeaderText: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  meta: { color: COLORS.textMuted, lineHeight: 18 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#E4EAF5', borderRadius: RADIUS.md },
  breakdownRowLast: { borderBottomWidth: 0 },
  breakdownRowSelected: { backgroundColor: '#F5F8FF', paddingHorizontal: SPACING.sm },
  breakdownTextWrap: { flex: 1, paddingRight: SPACING.md },
  breakdownTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  breakdownMeta: { color: COLORS.textMuted, marginTop: 2 },
  breakdownAmount: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary },
  breakdownDivider: { height: 2, backgroundColor: '#E4EAF5', marginTop: SPACING.md, marginBottom: SPACING.md },
  breakdownFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  breakdownFooterLabel: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary },
  breakdownFooterAmount: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: '#3657CC' },
  selectedBillBox: { backgroundColor: '#F7FAFF', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#DEE7F7' },
  selectedBillLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedBillTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '800', marginTop: 4 },
  selectedBillMeta: { color: COLORS.textSecondary, marginTop: 2 },
  methodButton: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  methodButtonSuccess: { backgroundColor: '#19BC84' },
  methodButtonOutline: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#CAD4E6' },
  methodButtonDisabled: { opacity: 0.6 },
  methodButtonText: { fontWeight: '800', fontSize: FONTS.sizes.md },
  methodButtonTextSuccess: { color: '#FFF' },
  methodButtonTextOutline: { color: COLORS.textPrimary },
  gatewayHint: { color: COLORS.textMuted, lineHeight: 18 },
  sessionBox: { marginTop: SPACING.md, backgroundColor: '#F5F8FF', borderRadius: RADIUS.lg, padding: SPACING.md },
  sessionTitle: { color: COLORS.textPrimary, fontWeight: '800' },
  sessionMeta: { color: COLORS.textMuted, marginTop: 4 },
  paymentCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  paymentCardSelected: { borderWidth: 1.5, borderColor: '#B9CBFF' },
  paymentIconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#F3F7FF', alignItems: 'center', justifyContent: 'center' },
  paymentBody: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  paymentMain: { flex: 1 },
  paymentSide: { alignItems: 'flex-end', minWidth: 102 },
  title: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary },
  amount: { fontWeight: '900', color: COLORS.textPrimary, marginBottom: 8 },
  selectBtn: { borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#B7C6E2', paddingHorizontal: SPACING.md, paddingVertical: 6 },
  selectBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  selectBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.xs },
  selectBtnTextActive: { color: '#FFF' },
  statusBadge: { borderRadius: RADIUS.pill, paddingHorizontal: SPACING.md, paddingVertical: 6 },
  statusPending: { backgroundColor: '#FFF4D8' },
  statusOverdue: { backgroundColor: '#FDE7E4' },
  statusPaid: { backgroundColor: '#E6F7EE' },
  statusText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.xs },
  reportSummaryCard: { backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#DCE6F7' },
  reportSummaryRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  reportSummaryPill: { flex: 1, backgroundColor: '#FFF', borderRadius: RADIUS.lg, padding: SPACING.md },
  reportSummaryLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  reportSummaryValue: { color: COLORS.textPrimary, fontWeight: '900', fontSize: FONTS.sizes.lg, marginTop: 6 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  reportTotal: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.lg },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  reportValue: { color: COLORS.textPrimary, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1 },
  actionCol: { gap: SPACING.sm },
  payBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingHorizontal: SPACING.md, paddingVertical: 6 },
  payBtnText: { color: '#FFF', fontWeight: '800', fontSize: FONTS.sizes.xs },
  linkRow: { borderTopWidth: 1, borderTopColor: COLORS.cardBorder, paddingTop: SPACING.md, marginTop: SPACING.md },
  charityCard: { backgroundColor: '#FFF7FA', borderColor: '#F3D5DF' },
  charityHighlights: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.lg },
  charityHighlightPill: { flexGrow: 1, flexBasis: '40%', backgroundColor: '#FFF', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#F0D7E1' },
  charityHighlightLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  charityHighlightValue: { color: '#A3345D', fontWeight: '800', marginTop: 6 },
  charityBtn: { backgroundColor: '#C2416C', borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: SPACING.sm },
  charityBtnText: { color: '#FFF', fontWeight: '800' },
  input: { backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.bgInputBorder, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, color: COLORS.textPrimary },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: '800' },
  modalActionRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  primaryModalBtn: { flex: 1, backgroundColor: '#C2416C', borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  secondaryModalBtn: { flex: 1, borderWidth: 1, borderColor: '#D8C1CB', borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  secondaryModalBtnText: { color: COLORS.textPrimary, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  secondaryBtnText: { color: COLORS.primary, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', padding: SPACING.xxl, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
});
