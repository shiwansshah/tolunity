import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertContext } from './AlertContext';
import { useAuth } from './AuthContext';
import {
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
} from '../api/alertApi';

const POLL_INTERVAL_MS = 5000;

export default function AlertProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchInFlightRef = useRef(false);

  const refreshAlerts = useCallback(async (options = {}) => {
    const { silent = false } = options;

    if (!isAuthenticated || !user?.id) {
      setAlerts([]);
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
      const response = await getAlerts();
      const rows = Array.isArray(response.data) ? response.data : [];
      setAlerts(rows);
      return rows;
    } catch (error) {
      if (!silent) {
        console.error('Failed to refresh alerts', error);
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
      setAlerts([]);
      setLoading(false);
      return undefined;
    }

    refreshAlerts();
    const intervalId = setInterval(() => {
      refreshAlerts({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshAlerts, user?.id]);

  const markAsRead = useCallback(async (alertId) => {
    if (!alertId) {
      return;
    }

    try {
      await markAlertAsRead(alertId);
      await refreshAlerts({ silent: true });
    } catch (error) {
      console.error('Failed to mark alert as read', error);
    }
  }, [refreshAlerts]);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAlertsAsRead();
      await refreshAlerts({ silent: true });
    } catch (error) {
      console.error('Failed to mark all alerts as read', error);
    }
  }, [refreshAlerts]);

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.isRead).length,
    [alerts]
  );

  const value = useMemo(() => ({
    alerts,
    unreadCount,
    loading,
    refreshAlerts,
    markAsRead,
    markAllAsRead,
  }), [alerts, loading, markAllAsRead, markAsRead, refreshAlerts, unreadCount]);

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
}
