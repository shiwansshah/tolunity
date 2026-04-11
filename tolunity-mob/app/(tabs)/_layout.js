import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '../../src/context/AlertContext';
import { useNotifications } from '../../src/context/NotificationContext';
import { COLORS, FONTS, RADIUS } from '../../src/styles/theme';

function TabBarIcon({ name, focused, badgeCount = 0 }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Ionicons
        name={focused ? name : `${name}-outline`}
        size={20}
        color={focused ? COLORS.tabBarActive : COLORS.tabBarInactive}
      />
      {badgeCount > 0 ? <View style={styles.badge} /> : null}
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
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: ({ focused }) => <TabBarIcon name="people" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ focused }) => <TabBarIcon name="card" focused={focused} />,
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
          tabBarIcon: ({ focused }) => <TabBarIcon name="flag" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name="person" focused={focused} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="create" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.tabBarBg,
  },
  tabLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semibold,
    marginBottom: 4,
  },
  iconWrap: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  iconWrapFocused: {
    backgroundColor: COLORS.surfaceSoft,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
});
