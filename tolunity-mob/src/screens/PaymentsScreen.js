import React, { useState } from 'react';
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

const MOCK_PAYMENTS = [
  { id: '1', title: 'Monthly Maintenance', amount: 'NPR 2,500', dueDate: 'Mar 31, 2026', status: 'Pending', icon: 'home-outline' },
  { id: '2', title: 'Water Bill', amount: 'NPR 450', dueDate: 'Mar 15, 2026', status: 'Overdue', icon: 'water-outline' },
  { id: '3', title: 'Security Fee', amount: 'NPR 1,000', dueDate: 'Feb 28, 2026', status: 'Paid', icon: 'shield-checkmark-outline' },
  { id: '4', title: 'Parking Fee', amount: 'NPR 500', dueDate: 'Feb 28, 2026', status: 'Paid', icon: 'car-outline' },
];

const STATUS_CONFIG = {
  Pending: { bg: '#FFF9E6', text: '#F39C12', borderColor: '#FFF0B2' },
  Overdue: { bg: '#FFF0F0', text: COLORS.error, borderColor: '#FFD0D0' },
  Paid: { bg: '#E8FFF0', text: COLORS.success, borderColor: '#C2F0D5' },
};

export default function PaymentsScreen() {
  const [selectedTab, setSelectedTab] = useState('All');
  const tabs = ['All', 'Pending', 'Paid'];

  const filtered = selectedTab === 'All'
    ? MOCK_PAYMENTS
    : MOCK_PAYMENTS.filter((p) => p.status === selectedTab);

  const totalPending = MOCK_PAYMENTS
    .filter((p) => p.status === 'Pending' || p.status === 'Overdue')
    .length;

  const renderPayment = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
    return (
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={item.icon} size={22} color={cfg.text} />
        </View>
        <View style={styles.info}>
          <Text style={styles.payTitle}>{item.title}</Text>
          <Text style={styles.payDue}>Due: {item.dueDate}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{item.amount}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.borderColor }]}>
            <Text style={[styles.statusText, { color: cfg.text }]}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payments</Text>
          {totalPending > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalPending}</Text>
            </View>
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>NPR 2,950</Text>
            <Text style={styles.summaryLabel}>Total Pending</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>NPR 1,500</Text>
            <Text style={styles.summaryLabel}>Paid This Month</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPayment}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.feedBg },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    ...SHADOWS.header,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#FFF', flex: 1 },
  badge: {
    backgroundColor: COLORS.accent, width: 24, height: 24,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
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
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.card,
  },
  iconWrap: {
    width: 46, height: 46, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  info: { flex: 1 },
  payTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  payDue: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  statusBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.pill, borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
});
