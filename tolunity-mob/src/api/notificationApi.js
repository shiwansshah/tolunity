import axiosInstance from './axiosInstance';

export const getNotifications = (userId) => axiosInstance.get(`/notifications/${userId}`);
export const markNotificationAsRead = (userId, notificationId) => axiosInstance.put(`/notifications/${userId}/${notificationId}/read`);
export const markAllNotificationsAsRead = (userId) => axiosInstance.put(`/notifications/${userId}/read-all`);
