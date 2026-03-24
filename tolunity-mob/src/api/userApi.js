import axiosInstance from './axiosInstance';

export const getOwners = () => axiosInstance.get('/user/owners');
export const selectOwner = (ownerId) => axiosInstance.post('/user/select-owner', { ownerId });
export const getMyTenants = () => axiosInstance.get('/user/my-tenants');
export const removeTenant = (tenantId) => axiosInstance.post(`/user/remove-tenant/${tenantId}`);
export const hasOwner = () => axiosInstance.get('/user/has-owner');
