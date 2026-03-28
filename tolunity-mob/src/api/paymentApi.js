import axiosInstance from './axiosInstance';

export const getMyPayments = () => axiosInstance.get('/payments/my-payments');
export const getGatewayConfig = () => axiosInstance.get('/payments/gateway-config');
export const payBill = (paymentId) => axiosInstance.post(`/payments/pay/${paymentId}`);
export const initiatePayment = (paymentId, data) => axiosInstance.post(`/payments/pay/${paymentId}/initiate`, data);
export const verifyPayment = (paymentId, data) => axiosInstance.post(`/payments/pay/${paymentId}/verify`, data);
export const createBill = (data) => axiosInstance.post('/payments/create-bill', data);
export const donateToCharity = (data) => axiosInstance.post('/payments/donate', data);
export const initiateCharityDonation = (data) => axiosInstance.post('/payments/charity/initiate', data);
export const verifyCharityDonation = (sessionId, data) => axiosInstance.post(`/payments/charity/${sessionId}/verify`, data);
