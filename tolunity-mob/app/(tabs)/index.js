import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../../src/screens/FeedScreen';
import { useAuth } from '../../src/context/AuthContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/styles/theme';

export default function HomeTab() {
  const { isAuthenticated, isLoading } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>TolUnity</Text>
          <Text style={styles.subtitle}>Community feed</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.textLight} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/complaints')}
            activeOpacity={0.8}
          >
            <Ionicons name="flag-outline" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.feed}>
        <FeedScreen />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-post')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  headerCopy: {
    flex: 1,
  },
  brand: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.heavy,
    color: COLORS.textLight,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONTS.sizes.xs,
    color: COLORS.whiteMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.whiteOverlay,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: FONTS.weights.bold,
  },
  feed: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
});
