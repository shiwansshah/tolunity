import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';
import { createVisitor, getMyVisitors, verifyVisitorQr } from '../api/visitorApi';
import { getApiErrorMessage } from '../api/apiError';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import Button from '../components/Button';
import InputField from '../components/InputField';

const defaultDate = () => {
  const current = new Date();
  current.setMinutes(current.getMinutes() + 30);
  current.setSeconds(0, 0);
  return current;
};

const defaultValidUntil = (start) => {
  const target = new Date(start);
  target.setHours(target.getHours() + 4);
  return target;
};

const formatDateTime = (value) => {
  if (!value) return 'Not set';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const lifecycleMeta = (visitor) => {
  if (visitor?.visitStatus === 'VISITED') {
    return {
      label: 'Visited',
      tone: styles.badgeSuccess,
      textTone: styles.badgeSuccessText,
      subtitle: visitor?.visitedAt ? `Checked in ${formatDateTime(visitor.visitedAt)}` : 'Visitor was verified at the gate.',
    };
  }

  if (visitor?.lifecycleStatus === 'EXPIRED') {
    return {
      label: 'Expired',
      tone: styles.badgeDanger,
      textTone: styles.badgeDangerText,
      subtitle: 'QR validity has ended without a check-in.',
    };
  }

  if (visitor?.lifecycleStatus === 'UPCOMING') {
    return {
      label: 'Upcoming',
      tone: styles.badgeInfo,
      textTone: styles.badgeInfoText,
      subtitle: 'Visitor pass is scheduled but not active yet.',
    };
  }

  return {
    label: 'Pending',
    tone: styles.badgeWarning,
    textTone: styles.badgeWarningText,
    subtitle: 'Waiting for security to verify this QR.',
  };
};

function DateTimeField({ label, value, onPress, icon = 'calendar-outline' }) {
  return (
    <TouchableOpacity style={styles.dateFieldWrap} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.dateFieldLabel}>{label}</Text>
      <View style={styles.dateField}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
        <Text style={styles.dateFieldValue}>{formatDateTime(value)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionCard({ title, subtitle, icon, children, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color={COLORS.primary} />
        </View>
        <View style={styles.sectionTextWrap}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function VisitorCard({ visitor, onShowQr }) {
  const meta = lifecycleMeta(visitor);

  return (
    <View style={styles.visitorCard}>
      <View style={styles.visitorCardTop}>
        <View style={styles.visitorIdentity}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{(visitor.visitorName || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.visitorInfo}>
            <Text style={styles.visitorName}>{visitor.visitorName}</Text>
            <Text style={styles.visitorMeta}>{visitor.visitorContact}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, meta.tone]}>
          <Text style={[styles.statusText, meta.textTone]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Visit Time</Text>
          <Text style={styles.detailValue}>{formatDateTime(visitor.expectedVisitAt)}</Text>
        </View>
        <View style={styles.detailBlock}>
          <Text style={styles.detailLabel}>Valid Window</Text>
          <Text style={styles.detailValue}>{`${formatDateTime(visitor.validFrom)} to ${formatDateTime(visitor.validUntil)}`}</Text>
        </View>
      </View>

      <Text style={styles.visitorHint}>{meta.subtitle}</Text>

      <TouchableOpacity style={styles.inlineAction} onPress={() => onShowQr(visitor)}>
        <Ionicons name="qr-code-outline" size={16} color={COLORS.primary} />
        <Text style={styles.inlineActionText}>Open QR</Text>
      </TouchableOpacity>
    </View>
  );
}

function QrPreviewModal({ visible, visitor, onClose }) {
  if (!visitor) return null;

  const meta = lifecycleMeta(visitor);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Visitor QR</Text>
              <Text style={styles.modalSubtitle}>Take a screenshot and share it with the expected visitor.</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.qrSheet}>
            <QRCode value={visitor.qrData} size={220} />
          </View>

          <View style={styles.qrMetaCard}>
            <Text style={styles.qrVisitorName}>{visitor.visitorName}</Text>
            <Text style={styles.qrVisitorMeta}>{visitor.visitorContact}</Text>
            <Text style={styles.qrVisitorMeta}>{`Visit ${formatDateTime(visitor.expectedVisitAt)}`}</Text>
            <View style={[styles.statusBadge, meta.tone, styles.qrBadge]}>
              <Text style={[styles.statusText, meta.textTone]}>{meta.label}</Text>
            </View>
          </View>

          <Button title="Close" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function CreatorVisitorsWorkspace() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeVisitor, setActiveVisitor] = useState(null);
  const [picker, setPicker] = useState({ field: null, mode: 'date', visible: false });
  const [form, setForm] = useState(() => {
    const expectedVisitAt = defaultDate();
    const validFrom = new Date(expectedVisitAt);
    validFrom.setMinutes(validFrom.getMinutes() - 30);
    return {
      visitorName: '',
      visitorContact: '',
      expectedVisitAt,
      validFrom,
      validUntil: defaultValidUntil(expectedVisitAt),
    };
  });

  const loadVisitors = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const response = await getMyVisitors();
      const rows = Array.isArray(response.data) ? response.data : [];
      setVisitors(rows);
    } catch (error) {
      Alert.alert('Load Failed', getApiErrorMessage(error, 'Unable to load visitor passes.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisitors(true);
  }, [loadVisitors]);

  const updateDateField = useCallback((field, nextValue) => {
    setForm((current) => {
      const updated = { ...current, [field]: nextValue };

      if (field === 'expectedVisitAt') {
        if (updated.validFrom > nextValue) {
          const validFrom = new Date(nextValue);
          validFrom.setMinutes(validFrom.getMinutes() - 30);
          updated.validFrom = validFrom;
        }
        if (updated.validUntil < nextValue) {
          updated.validUntil = defaultValidUntil(nextValue);
        }
      }

      if (field === 'validFrom' && updated.validUntil < nextValue) {
        updated.validUntil = defaultValidUntil(nextValue);
      }

      return updated;
    });
  }, []);

  const openPicker = useCallback((field) => {
    setPicker({ field, mode: 'date', visible: true });
  }, []);

  const handlePickerChange = useCallback((event, selectedDate) => {
    if (event?.type === 'dismissed') {
      setPicker({ field: null, mode: 'date', visible: false });
      return;
    }

    if (!picker.field || !selectedDate) return;

    const currentValue = form[picker.field] || new Date();
    const merged = new Date(currentValue);

    if (picker.mode === 'date') {
      merged.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      updateDateField(picker.field, merged);
      setPicker((current) => ({ ...current, mode: 'time', visible: true }));
      return;
    }

    merged.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    updateDateField(picker.field, merged);
    setPicker({ field: null, mode: 'date', visible: false });
  }, [form, picker.field, picker.mode, updateDateField]);

  const canSubmit = useMemo(() => (
    form.visitorName.trim()
    && form.visitorContact.trim()
    && form.validUntil >= form.validFrom
    && form.expectedVisitAt >= form.validFrom
    && form.expectedVisitAt <= form.validUntil
  ), [form]);

  const submit = async () => {
    if (!canSubmit) {
      Alert.alert('Incomplete Details', 'Enter the visitor details and keep the visit time inside the QR validity window.');
      return;
    }

    setSaving(true);
    try {
      const response = await createVisitor({
        visitorName: form.visitorName.trim(),
        visitorContact: form.visitorContact.trim(),
        expectedVisitAt: form.expectedVisitAt.toISOString(),
        validFrom: form.validFrom.toISOString(),
        validUntil: form.validUntil.toISOString(),
      });

      const created = response.data;
      setVisitors((current) => [created, ...current]);
      setActiveVisitor(created);

      const resetVisit = defaultDate();
      const resetFrom = new Date(resetVisit);
      resetFrom.setMinutes(resetFrom.getMinutes() - 30);
      setForm({
        visitorName: '',
        visitorContact: '',
        expectedVisitAt: resetVisit,
        validFrom: resetFrom,
        validUntil: defaultValidUntil(resetVisit),
      });
    } catch (error) {
      Alert.alert('Creation Failed', getApiErrorMessage(error, 'Unable to generate visitor QR.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard
          title="Create Visitor QR"
          subtitle="Enter the visitor details, generate the QR instantly, then share it with the guest."
          icon="qr-code-outline"
        >
          <InputField
            label="Visitor Name"
            placeholder="Enter visitor name"
            value={form.visitorName}
            onChangeText={(value) => setForm((current) => ({ ...current, visitorName: value }))}
            iconName="person-outline"
            autoCapitalize="words"
          />
          <InputField
            label="Visitor Contact"
            placeholder="Phone number or contact detail"
            value={form.visitorContact}
            onChangeText={(value) => setForm((current) => ({ ...current, visitorContact: value }))}
            iconName="call-outline"
            keyboardType="phone-pad"
          />

          <DateTimeField label="Expected Visit Time" value={form.expectedVisitAt} onPress={() => openPicker('expectedVisitAt')} />
          <DateTimeField label="QR Valid From" value={form.validFrom} onPress={() => openPicker('validFrom')} />
          <DateTimeField label="QR Valid Until" value={form.validUntil} onPress={() => openPicker('validUntil')} />

          <Text style={styles.formHint}>
            Security will only accept the QR within the selected validity period. Use the generated card for a screenshot share.
          </Text>

          <Button title="Generate Visitor QR" iconName="sparkles-outline" onPress={submit} loading={saving} />
        </SectionCard>

        <SectionCard
          title="Visitor List"
          subtitle="Static menu for your created visitor passes and the current visit status."
          icon="people-outline"
        >
          {visitors.length ? visitors.map((visitor) => (
            <VisitorCard key={visitor.id} visitor={visitor} onShowQr={setActiveVisitor} />
          )) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={42} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No visitor QR created yet</Text>
              <Text style={styles.emptyCopy}>Your generated visitor passes will appear here with their check-in status.</Text>
            </View>
          )}

          <Button title="Refresh Visitor List" variant="outline" iconName="refresh-outline" onPress={() => loadVisitors(false)} />
        </SectionCard>
      </ScrollView>

      {picker.visible ? (
        <DateTimePicker
          value={form[picker.field] || new Date()}
          mode={picker.mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
        />
      ) : null}

      <QrPreviewModal visible={!!activeVisitor} visitor={activeVisitor} onClose={() => setActiveVisitor(null)} />
    </>
  );
}

function SecurityVisitorsWorkspace() {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualQr, setManualQr] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [scanEnabled, setScanEnabled] = useState(true);

  const verify = useCallback(async (qrData) => {
    const normalized = (qrData || '').trim();
    if (!normalized) {
      Alert.alert('Missing QR', 'Scan the visitor QR or paste the QR data for manual verification.');
      return;
    }

    setVerifying(true);
    setResult(null);
    setScanEnabled(false);

    try {
      const response = await verifyVisitorQr({ qrData: normalized });
      setResult(response.data);
      setManualQr(normalized);
    } catch (error) {
      Alert.alert('Verification Failed', getApiErrorMessage(error, 'Unable to verify visitor QR.'));
      setScanEnabled(true);
    } finally {
      setVerifying(false);
    }
  }, []);

  const handleScanned = useCallback(({ data }) => {
    if (!scanEnabled || verifying) return;
    verify(data);
  }, [scanEnabled, verifying, verify]);

  const visitor = result?.visitor;
  const isApproved = Boolean(result?.verified);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionCard
        title="Security Scan Desk"
        subtitle="Scan the visitor QR to verify entry, or reject the pass immediately if validation fails."
        icon="scan-outline"
      >
        {!permission?.granted ? (
          <View style={styles.permissionCard}>
            <Ionicons name="camera-outline" size={42} color={COLORS.primary} />
            <Text style={styles.permissionTitle}>Camera access required</Text>
            <Text style={styles.permissionCopy}>Allow camera permission so security can scan visitor QR passes directly from this screen.</Text>
            <Button title="Allow Camera" onPress={requestPermission} />
          </View>
        ) : (
          <View style={styles.cameraCard}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleScanned}
            />
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.cameraHint}>Center the visitor QR inside the frame.</Text>
            </View>
          </View>
        )}

        <View style={styles.manualBlock}>
          <Text style={styles.manualTitle}>Manual verification</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="Paste QR data here if camera scan is not available"
            placeholderTextColor={COLORS.textMuted}
            value={manualQr}
            onChangeText={setManualQr}
            multiline
          />
          <View style={styles.inlineButtons}>
            <Button title="Verify QR" onPress={() => verify(manualQr)} loading={verifying} iconName="shield-checkmark-outline" style={styles.inlineButtonFlex} />
            <Button title="Scan Again" variant="outline" onPress={() => { setResult(null); setScanEnabled(true); setManualQr(''); }} iconName="refresh-outline" style={styles.inlineButtonFlex} />
          </View>
        </View>
      </SectionCard>

      {result ? (
        <SectionCard
          title={isApproved ? 'Visitor Approved' : 'Visitor Rejected'}
          subtitle={result.message}
          icon={isApproved ? 'checkmark-circle-outline' : 'close-circle-outline'}
          style={isApproved ? styles.verificationSuccessCard : styles.verificationErrorCard}
        >
          <View style={[styles.verificationHero, isApproved ? styles.verificationHeroSuccess : styles.verificationHeroError]}>
            <Ionicons name={isApproved ? 'shield-checkmark' : 'shield-outline'} size={26} color="#FFF" />
            <Text style={styles.verificationHeroTitle}>{isApproved ? 'Valid visitor pass' : 'Validation failed'}</Text>
            <Text style={styles.verificationHeroCopy}>{result.message}</Text>
          </View>

          {visitor ? (
            <View style={styles.verificationBody}>
              <View style={styles.verificationRow}>
                <Text style={styles.verificationLabel}>Visitor</Text>
                <Text style={styles.verificationValue}>{visitor.visitorName}</Text>
              </View>
              <View style={styles.verificationRow}>
                <Text style={styles.verificationLabel}>Contact</Text>
                <Text style={styles.verificationValue}>{visitor.visitorContact}</Text>
              </View>
              <View style={styles.verificationRow}>
                <Text style={styles.verificationLabel}>Created By</Text>
                <Text style={styles.verificationValue}>{visitor.createdByName}</Text>
              </View>
              <View style={styles.verificationRow}>
                <Text style={styles.verificationLabel}>Visit Time</Text>
                <Text style={styles.verificationValue}>{formatDateTime(visitor.expectedVisitAt)}</Text>
              </View>
              <View style={styles.verificationRow}>
                <Text style={styles.verificationLabel}>Validity</Text>
                <Text style={styles.verificationValue}>{`${formatDateTime(visitor.validFrom)} to ${formatDateTime(visitor.validUntil)}`}</Text>
              </View>
            </View>
          ) : null}
        </SectionCard>
      ) : null}
    </ScrollView>
  );
}

export default function VisitorsScreen() {
  const { user } = useAuth();
  const isSecurity = user?.userType === 'SECURITY';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={styles.header}>
        <Text style={styles.brandTitle}>TolUnity</Text>
        <Text style={styles.headerTitle}>{isSecurity ? 'Security Visitors' : 'Visitors'}</Text>
      </View>
      {isSecurity ? <SecurityVisitorsWorkspace /> : <CreatorVisitorsWorkspace />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FB' },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    ...SHADOWS.header,
  },
  brandTitle: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: '900' },
  headerTitle: { color: 'rgba(255,255,255,0.88)', fontSize: FONTS.sizes.sm, fontWeight: '700', marginTop: 2 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E0E7F2',
    ...SHADOWS.card,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.lg },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sectionTextWrap: { flex: 1 },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary },
  sectionSubtitle: { color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },
  dateFieldWrap: { marginBottom: SPACING.md },
  dateFieldLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  dateField: {
    minHeight: 54,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.bgInputBorder,
    backgroundColor: COLORS.bgInput,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateFieldValue: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  formHint: { color: COLORS.textMuted, marginBottom: SPACING.lg, lineHeight: 18 },
  visitorCard: {
    borderWidth: 1,
    borderColor: '#E4EAF5',
    borderRadius: 18,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: '#FBFCFF',
  },
  visitorCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACING.md },
  visitorIdentity: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DDE6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.md },
  visitorInfo: { flex: 1 },
  visitorName: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.md },
  visitorMeta: { color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.pill },
  statusText: { fontWeight: '800', fontSize: FONTS.sizes.xs, textTransform: 'uppercase' },
  badgeSuccess: { backgroundColor: '#E6F7EE' },
  badgeSuccessText: { color: '#177A44' },
  badgeWarning: { backgroundColor: '#FFF3D8' },
  badgeWarningText: { color: '#9A6400' },
  badgeDanger: { backgroundColor: '#FDE7E4' },
  badgeDangerText: { color: '#B43A2A' },
  badgeInfo: { backgroundColor: '#E9F4FF' },
  badgeInfoText: { color: '#1F6FBA' },
  detailsGrid: { marginTop: SPACING.md, gap: SPACING.sm },
  detailBlock: { backgroundColor: '#FFF', borderRadius: 14, padding: SPACING.md, borderWidth: 1, borderColor: '#EDF1F8' },
  detailLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { color: COLORS.textPrimary, marginTop: 4, lineHeight: 19, fontWeight: '700' },
  visitorHint: { color: COLORS.textSecondary, marginTop: SPACING.md, lineHeight: 18 },
  inlineAction: { marginTop: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, alignSelf: 'flex-start' },
  inlineActionText: { color: COLORS.primary, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  emptyTitle: { marginTop: SPACING.md, color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.md },
  emptyCopy: { marginTop: SPACING.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(9,18,37,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFF',
    padding: SPACING.xl,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    gap: SPACING.lg,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  modalTitle: { color: COLORS.textPrimary, fontWeight: '900', fontSize: FONTS.sizes.xl },
  modalSubtitle: { color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF3FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSheet: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: SPACING.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6EBF5',
  },
  qrMetaCard: { borderRadius: 18, backgroundColor: '#F7F9FE', padding: SPACING.lg, borderWidth: 1, borderColor: '#E4EAF5' },
  qrVisitorName: { color: COLORS.textPrimary, fontWeight: '900', fontSize: FONTS.sizes.lg },
  qrVisitorMeta: { color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },
  qrBadge: { marginTop: SPACING.md, alignSelf: 'flex-start' },
  permissionCard: { alignItems: 'center', paddingVertical: SPACING.lg },
  permissionTitle: { marginTop: SPACING.md, fontWeight: '900', color: COLORS.textPrimary, fontSize: FONTS.sizes.lg },
  permissionCopy: { marginTop: SPACING.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: SPACING.lg },
  cameraCard: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#081224',
    marginBottom: SPACING.lg,
  },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,12,24,0.26)',
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FFF',
    backgroundColor: 'transparent',
  },
  cameraHint: { color: '#FFF', fontWeight: '700', marginTop: SPACING.lg },
  manualBlock: { borderTopWidth: 1, borderTopColor: '#E7ECF4', paddingTop: SPACING.lg },
  manualTitle: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.md, marginBottom: SPACING.sm },
  manualInput: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D8E0EC',
    backgroundColor: '#F8FAFD',
    padding: SPACING.md,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  inlineButtons: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  inlineButtonFlex: { flex: 1 },
  verificationSuccessCard: { borderColor: '#D6EFE1', backgroundColor: '#FCFFFD' },
  verificationErrorCard: { borderColor: '#F4D5CF', backgroundColor: '#FFFDFC' },
  verificationHero: { borderRadius: 20, padding: SPACING.lg },
  verificationHeroSuccess: { backgroundColor: '#1C8A5A' },
  verificationHeroError: { backgroundColor: '#C24D3E' },
  verificationHeroTitle: { color: '#FFF', fontWeight: '900', fontSize: FONTS.sizes.lg, marginTop: SPACING.sm },
  verificationHeroCopy: { color: 'rgba(255,255,255,0.88)', marginTop: 4, lineHeight: 18 },
  verificationBody: { marginTop: SPACING.lg, gap: SPACING.md },
  verificationRow: { borderWidth: 1, borderColor: '#E8EDF5', borderRadius: 16, padding: SPACING.md, backgroundColor: '#FFF' },
  verificationLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'uppercase' },
  verificationValue: { color: COLORS.textPrimary, fontWeight: '800', marginTop: 4, lineHeight: 19 },
});
