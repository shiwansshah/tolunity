import axiosInstance from './axiosInstance';

export const getAlerts = () => axiosInstance.get('/alerts');
export const createAlert = (payload) => axiosInstance.post('/alerts', payload);
export const markAlertAsRead = (alertId) => axiosInstance.put(`/alerts/${alertId}/read`);
export const markAllAlertsAsRead = () => axiosInstance.put('/alerts/read-all');
