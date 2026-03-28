import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NotificationContext } from './NotificationContext';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notificationApi';

const POLL_INTERVAL_MS = 5000;

export default function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchInFlightRef = useRef(false);

  const refreshNotifications = useCallback(async (options = {}) => {
    const { silent = false } = options;

    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return [];
    }

    if (fetchInFlightRef.current) {
      return [];
    }

    fetchInFlightRef.current = true;
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await getNotifications(user.id);
      const rows = Array.isArray(response.data) ? response.data : [];
      setNotifications(rows);
      return rows;
    } catch (error) {
      if (!silent) {
        console.error('Failed to refresh notifications', error);
      }
      return [];
    } finally {
      fetchInFlightRef.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      setLoading(false);
      return undefined;
    }

    refreshNotifications();
    const intervalId = setInterval(() => {
      refreshNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshNotifications, user?.id]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.id || !notificationId) {
      return;
    }

    try {
      await markNotificationAsRead(user.id, notificationId);
      await refreshNotifications({ silent: true });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  }, [refreshNotifications, user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      await markAllNotificationsAsRead(user.id);
      await refreshNotifications({ silent: true });
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  }, [refreshNotifications, user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  }), [loading, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
