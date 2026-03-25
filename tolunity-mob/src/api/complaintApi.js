import axiosInstance from './axiosInstance';

export const getComplaints = () => axiosInstance.get('/complaints');
export const createComplaint = (data) => axiosInstance.post('/complaints', data);
export const toggleComplaintUpvote = (complaintId) => axiosInstance.post(`/complaints/${complaintId}/upvote`);
