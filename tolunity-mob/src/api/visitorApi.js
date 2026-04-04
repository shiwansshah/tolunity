import axiosInstance from './axiosInstance';

export const getMyVisitors = () => axiosInstance.get('/visitors/my');
export const createVisitor = (payload) => axiosInstance.post('/visitors', payload);
export const verifyVisitorQr = (payload) => axiosInstance.post('/visitors/verify', payload);
