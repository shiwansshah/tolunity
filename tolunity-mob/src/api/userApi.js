import axiosInstance from './axiosInstance';

export const getOwners = () => axiosInstance.get('/user/owners');
export const getMyProfile = () => axiosInstance.get('/user/profile');
export const selectOwner = (ownerId) => axiosInstance.post('/user/select-owner', { ownerId });
export const getMyTenants = () => axiosInstance.get('/user/my-tenants');
export const removeTenant = (tenantId) => axiosInstance.post(`/user/remove-tenant/${tenantId}`);
export const hasOwner = () => axiosInstance.get('/user/has-owner');
export const registerPushToken = (expoPushToken) => axiosInstance.post('/user/profile/push-token', { expoPushToken });
export const clearPushToken = () => axiosInstance.delete('/user/profile/push-token');
