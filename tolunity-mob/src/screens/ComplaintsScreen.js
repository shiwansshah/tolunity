import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

const MOCK_COMPLAINTS = [
  {
    id: '1', title: 'Stray Dogs Issue',
    description: 'Multiple stray dogs near block C causing safety concerns for children.',
    category: 'Safety', status: 'In Progress', date: 'Mar 12, 2026', priority: 'High',
  },
  {
    id: '2', title: 'Garbage Collection Delay',
    description: 'Garbage has not been collected for 3 days near unit 12.',
    category: 'Sanitation', status: 'Open', date: 'Mar 10, 2026', priority: 'Medium',
  },
  {
    id: '3', title: 'Street Light Repair',
    description: 'The street light at the main gate has been broken for 2 weeks.',
    category: 'Infrastructure', status: 'Resolved', date: 'Mar 5, 2026', priority: 'Low',
  },
];

const STATUS_CONFIG = {
  Open: { bg: '#FFF9E6', text: '#F39C12', icon: 'time-outline' },
  'In Progress': { bg: '#EEF6FF', text: COLORS.primary, icon: 'refresh-outline' },
  Resolved: { bg: '#E8FFF0', text: COLORS.success, icon: 'checkmark-circle-outline' },
};

const PRIORITY_COLORS = {
  High: COLORS.error,
  Medium: COLORS.warning,
  Low: COLORS.success,
};

export default function ComplaintsScreen() {
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Sanitation');
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Sanitation', 'Safety', 'Infrastructure', 'Noise', 'Other'];

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation', 'Please fill in all fields');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const newComplaint = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        category,
        status: 'Open',
        date: 'Today',
        priority: 'Medium',
      };
      setComplaints((prev) => [newComplaint, ...prev]);
      setTitle('');
      setDescription('');
      setCategory('Sanitation');
      setModalVisible(false);
      setSubmitting(false);
      Alert.alert('Submitted! ✅', 'Your complaint has been registered.');
    }, 1000);
  };

  const renderComplaint = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Open;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.categoryTag, { backgroundColor: '#EEF2FF' }]}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
              <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>
                {item.priority}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={13} color={cfg.text} />
            <Text style={[styles.statusText, { color: cfg.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complaints</Text>
        </View>

        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id}
          renderItem={renderComplaint}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flag-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No complaints yet</Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="warning" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* New Complaint Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>File a Complaint</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Brief complaint title"
                  placeholderTextColor={COLORS.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryPicker}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, category === cat && styles.catChipActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the issue in detail…"
                  placeholderTextColor={COLORS.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send-outline" size={18} color="#FFF" />
                  <Text style={styles.submitBtnText}>
                    {submitting ? 'Submitting…' : 'Submit Complaint'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.feedBg },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, ...SHADOWS.header,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#FFF' },
  listContent: { padding: SPACING.lg, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  cardTopLeft: { flex: 1 },
  cardTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  categoryTag: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.pill },
  categoryText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.primary },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.pill, marginLeft: SPACING.sm,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  description: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.sm },
  date: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  fab: {
    position: 'absolute', right: SPACING.xl, bottom: SPACING.xl,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: COLORS.fabRed,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.button,
  },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxxl * 2 },
  emptyText: { marginTop: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.textSecondary },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.bgCard, borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl, padding: SPACING.xxl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.bgInput, borderWidth: 1.5, borderColor: COLORS.bgInputBorder,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md, color: COLORS.textPrimary, marginBottom: SPACING.lg,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  catChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill, backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.bgInputBorder,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  catChipTextActive: { color: '#FFF' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    ...SHADOWS.button, marginTop: SPACING.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: FONTS.sizes.md, fontWeight: '700' },
});
