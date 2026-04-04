import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../utils/constants';

export const getAboutContent = () => axiosInstance.get(ENDPOINTS.MOBILE_ABOUT);
