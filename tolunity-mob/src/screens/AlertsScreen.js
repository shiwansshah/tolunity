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

const MOCK_ALERTS = [
  {
    id: '1', type: 'Emergency',
    title: 'Water Supply Disruption',
    message: 'Water supply will be disrupted from 6 AM to 2 PM on March 16.',
    time: '2 hours ago', read: false, icon: 'water', color: COLORS.error,
  },
  {
    id: '2', type: 'Notice',
    title: 'Community Meeting',
    message: 'Monthly community meeting scheduled for Saturday at 5 PM at the community hall.',
    time: '5 hours ago', read: false, icon: 'people', color: COLORS.primary,
  },
  {
    id: '3', type: 'Reminder',
    title: 'Maintenance Due',
    message: 'Monthly maintenance fee due by March 31. Please pay on time to avoid penalties.',
    time: 'Yesterday', read: true, icon: 'calendar', color: COLORS.warning,
  },
  {
    id: '4', type: 'Info',
    title: 'New Community Rules',
    message: 'New noise restrictions are in place after 10 PM. Please cooperate.',
    time: '2 days ago', read: true, icon: 'information-circle', color: COLORS.info,
  },
];

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const unreadCount = alerts.filter((a) => !a.read).length;

  const markAllRead = () => setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  const markRead = (id) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));

  const renderAlert = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => markRead(item.id)}
      activeOpacity={0.85}
    >
      {!item.read && <View style={styles.unreadDot} />}
      <View style={[styles.iconWrap, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.typeTag}>{item.type}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Alerts</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlert}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No alerts</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    ...SHADOWS.header,
  },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#FFF' },
  unreadLabel: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  markAllBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  markAllText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: '600' },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.card,
    position: 'relative',
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  unreadDot: {
    position: 'absolute', top: SPACING.md, right: SPACING.md,
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  typeTag: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.primary },
  time: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  message: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxxl * 2 },
  emptyText: { marginTop: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
});
