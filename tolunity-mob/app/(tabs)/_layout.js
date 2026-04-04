import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '../../src/context/AlertContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../src/styles/theme';

function TabBarIcon({ name, focused, badgeCount = 0 }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Ionicons
        name={focused ? name : `${name}-outline`}
        size={22}
        color={focused ? COLORS.primary : COLORS.tabBarInactive}
      />
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Ionicons name="ellipse" size={8} color="#E53935" />
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { unreadCount: alertUnreadCount } = useAlerts();
  const { unreadCount: notificationUnreadCount } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.tabBarInactive,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="people" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="card" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="alert-circle" focused={focused} badgeCount={alertUnreadCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Notifications',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="notifications" focused={focused} badgeCount={notificationUnreadCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'Complaints',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="flag" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="person" focused={focused} />
          ),
        }}
      />

      {/* Hidden routes (not tabs) */}
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="create"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    height: 68,
    paddingBottom: 10,
    paddingTop: 8,
    ...SHADOWS.card,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 30,
    borderRadius: 11,
  },
  iconWrapFocused: {
    backgroundColor: '#ECF1F7',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
