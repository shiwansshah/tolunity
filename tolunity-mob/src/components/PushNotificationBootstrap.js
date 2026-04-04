import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useAlerts } from '../context/AlertContext';
import { registerPushToken } from '../api/userApi';
import { EXPO_PROJECT_ID } from '../utils/constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D4ED8',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const permissionResponse = await Notifications.requestPermissionsAsync();
    finalStatus = permissionResponse.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const configuredProjectId = EXPO_PROJECT_ID?.trim();
  const projectId =
    Constants.easConfig?.projectId
    ?? Constants.expoConfig?.extra?.eas?.projectId
    ?? (configuredProjectId ? configuredProjectId : undefined);
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return tokenResponse.data;
}

export default function PushNotificationBootstrap() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { refreshNotifications } = useNotifications();
  const { refreshAlerts } = useAlerts();
  const registeredKeyRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const syncPushToken = async () => {
      if (!isAuthenticated || !user?.id) {
        registeredKeyRef.current = null;
        return;
      }

      try {
        const expoPushToken = await registerForPushNotificationsAsync();
        if (!isMounted || !expoPushToken) {
          return;
        }

        const registrationKey = `${user.id}:${expoPushToken}`;
        if (registeredKeyRef.current === registrationKey) {
          return;
        }

        await registerPushToken(expoPushToken);
        registeredKeyRef.current = registrationKey;
      } catch (error) {
        console.error('Failed to register push notifications', error?.message || error);
      }
    };

    syncPushToken();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const refreshAll = async () => {
      await Promise.all([
        refreshNotifications({ silent: true }),
        refreshAlerts({ silent: true }),
      ]);
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      refreshAll();
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      refreshAll();

      if (String(data.type || '').toUpperCase() === 'ALERT' || data.alertId) {
        router.push('/(tabs)/alerts');
        return;
      }

      router.push('/(tabs)/notifications');
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [refreshAlerts, refreshNotifications, router]);

  return null;
}
