import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../styles/theme';
import { useNotifications } from '../context/NotificationContext';

const TYPE_META = {
  LIKE: { label: 'Like', icon: 'heart', color: COLORS.likePink },
  COMMENT: { label: 'Comment', icon: 'chatbubble', color: COLORS.primary },
  PAYMENT: { label: 'Payment', icon: 'card', color: COLORS.success },
  RENT: { label: 'Rent', icon: 'home', color: COLORS.info },
  ALERT: { label: 'Alert', icon: 'alert-circle', color: COLORS.error },
  DONATION: { label: 'Donation', icon: 'heart-circle', color: '#C2416C' },
  COMPLAINT: { label: 'Complaint', icon: 'flag', color: COLORS.warning },
  FEE: { label: 'Fee', icon: 'receipt', color: COLORS.primary },
};

const formatRelativeTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
};

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, item.isRead ? styles.cardRead : styles.cardUnread]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.85}
    >
      {!item.isRead && <View style={styles.unreadDot} />}
      <View style={[styles.iconWrap, { backgroundColor: `${(TYPE_META[item.type]?.color || COLORS.primary)}20` }]}>
        <Ionicons name={TYPE_META[item.type]?.icon || 'notifications'} size={22} color={TYPE_META[item.type]?.color || COLORS.primary} />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.typeTag, item.isRead && styles.typeTagRead]}>{TYPE_META[item.type]?.label || item.type || 'Notification'}</Text>
          <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
        <Text style={[styles.title, item.isRead && styles.titleRead]}>{item.title}</Text>
        <Text style={[styles.message, item.isRead && styles.messageRead]} numberOfLines={3}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Routine activity, payment, complaint, and community updates</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => refreshNotifications()}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          }
        />
      )}
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
  headerSubtitle: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2, maxWidth: 220 },
  unreadLabel: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  markAllBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  markAllText: { color: '#FFF', fontSize: FONTS.sizes.xs, fontWeight: '600' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
    position: 'relative',
  },
  cardRead: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  unreadDot: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  typeTag: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.primary },
  typeTagRead: { color: COLORS.textMuted },
  time: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  title: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  titleRead: { color: COLORS.textSecondary },
  message: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  messageRead: { color: COLORS.textMuted },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxxl * 2 },
  emptyText: { marginTop: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
});
