import axiosInstance from './axiosInstance';

export const getMyPayments = () => axiosInstance.get('/payments/my-payments');
export const payBill = (paymentId) => axiosInstance.post(`/payments/pay/${paymentId}`);
export const createBill = (data) => axiosInstance.post('/payments/create-bill', data);
