import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useNotifications } from '../../src/context/NotificationContext';
import FeedScreen from '../../src/screens/FeedScreen';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../src/styles/theme';

export default function HomeTab() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* App Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          {/* Logo + Subtitle */}
          <View style={styles.headerLeft}>
            <Text style={styles.headerLogo}>TolUnity</Text>
            <Text style={styles.headerSubtitle}>Community Feed</Text>
          </View>

          {/* Right actions */}
          <View style={styles.headerRight}>
            {/* Notifications */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push('/(tabs)/notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications" size={22} color="#FFF" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Flag / Reports */}
            <TouchableOpacity
              style={[styles.iconBtn, { marginLeft: SPACING.sm }]}
              onPress={() => router.push('/(tabs)/complaints')}
              activeOpacity={0.8}
            >
              <Ionicons name="flag" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Feed Content */}
      <View style={styles.feedContainer}>
        <FeedScreen />
      </View>

      {/* Floating Create Post Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-post')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.feedBg,
  },
  headerSafe: {
    backgroundColor: COLORS.primary,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.header,
  },
  headerLeft: {
    flex: 1,
  },
  headerLogo: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  feedContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.button,
  },
});
