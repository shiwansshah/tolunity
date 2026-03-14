import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';

// Mock visitor data - replace with real API
const MOCK_VISITORS = [
  { id: '1', name: 'Ram Prasad', purpose: 'Delivery', time: '10:30 AM', date: 'Today', status: 'In', avatar: 'R' },
  { id: '2', name: 'Sita Kumari', purpose: 'Guest Visit', time: '09:15 AM', date: 'Today', status: 'Out', avatar: 'S' },
  { id: '3', name: 'Hari Bahadur', purpose: 'Maintenance', time: '11:00 AM', date: 'Yesterday', status: 'Out', avatar: 'H' },
  { id: '4', name: 'Maya Devi', purpose: 'Guest Visit', time: '02:30 PM', date: 'Yesterday', status: 'Out', avatar: 'M' },
];

export default function VisitorsScreen() {
  const renderVisitor = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarText}>{item.avatar}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.visitorName}>{item.name}</Text>
        <Text style={styles.purpose}>{item.purpose}</Text>
        <Text style={styles.time}>{item.date} • {item.time}</Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'In' ? styles.statusIn : styles.statusOut]}>
        <Text style={[styles.statusText, item.status === 'In' ? styles.statusInText : styles.statusOutText]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Visitors</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Ionicons name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={MOCK_VISITORS}
          keyExtractor={(item) => item.id}
          renderItem={renderVisitor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>Recent Visitors</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No visitors recorded</Text>
            </View>
          }
        />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.feedBg },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.header,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#FFF' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  sectionLabel: {
    fontSize: FONTS.sizes.xs, fontWeight: '600',
    color: COLORS.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: SPACING.md,
  },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginBottom: SPACING.md, ...SHADOWS.card,
  },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: FONTS.sizes.lg },
  info: { flex: 1 },
  visitorName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  purpose: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  time: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  statusIn: { backgroundColor: '#E8FFF0' },
  statusOut: { backgroundColor: '#F5F5F5' },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  statusInText: { color: COLORS.success },
  statusOutText: { color: COLORS.textMuted },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxxl * 2 },
  emptyText: { marginTop: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
});
