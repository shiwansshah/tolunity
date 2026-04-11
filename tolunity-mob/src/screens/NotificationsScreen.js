import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import SurfaceCard from '../components/SurfaceCard';
import { useNotifications } from '../context/NotificationContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../styles/theme';

const TYPE_META = {
  LIKE: { label: 'Like', icon: 'heart-outline', color: COLORS.likePink },
  COMMENT: { label: 'Comment', icon: 'chatbubble-outline', color: COLORS.primary },
  PAYMENT: { label: 'Payment', icon: 'card-outline', color: COLORS.success },
  RENT: { label: 'Rent', icon: 'home-outline', color: COLORS.info },
  ALERT: { label: 'Alert', icon: 'alert-circle-outline', color: COLORS.error },
  DONATION: { label: 'Donation', icon: 'card-outline', color: COLORS.likePink },
  COMPLAINT: { label: 'Complaint', icon: 'flag-outline', color: COLORS.warning },
  FEE: { label: 'Fee', icon: 'receipt-outline', color: COLORS.primary },
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

  const renderNotification = ({ item }) => {
    const meta = TYPE_META[item.type] || { label: item.type || 'Notification', icon: 'notifications-outline', color: COLORS.primary };

    return (
      <SurfaceCard style={[styles.card, !item.isRead && styles.cardUnread]}>
        <TouchableOpacity style={styles.pressable} onPress={() => markAsRead(item.id)} activeOpacity={0.85}>
          <View style={[styles.iconWrap, { backgroundColor: COLORS.surfaceSoft }]}>
            <Ionicons name={meta.icon} size={18} color={meta.color} />
          </View>
          <View style={styles.info}>
            <View style={styles.topRow}>
              <Text style={styles.type}>{meta.label}</Text>
              <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
          </View>
        </TouchableOpacity>
      </SurfaceCard>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        right={unreadCount > 0 ? (
          <TouchableOpacity style={styles.headerAction} onPress={markAllAsRead}>
            <Text style={styles.headerActionText}>Mark all</Text>
          </TouchableOpacity>
        ) : null}
      />

      {loading && notifications.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderNotification}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => refreshNotifications()}
          ListEmptyComponent={(
            <EmptyState
              title="No notifications"
              description="Routine activity, payment, complaint, and community updates will appear here."
              icon={<Ionicons name="notifications-off-outline" size={32} color={COLORS.textMuted} />}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  headerAction: {
    minWidth: 72,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.whiteOverlay,
  },
  headerActionText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: FONTS.weights.bold,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.xs,
  },
  cardUnread: {
    borderColor: COLORS.primary,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  type: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: FONTS.weights.bold,
  },
  time: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.semibold,
  },
  message: {
    marginTop: 4,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
