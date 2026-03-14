import axios from 'axios';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../utils/constants';
import { getToken } from '../utils/storage';
import { globalEvent } from '../utils/EventEmitter';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT Bearer token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - normalize errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status } = error.response;
      const isPostLoginOrRegister = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      const isLogout = error.config.url.includes('/auth/logout');

      if ((status === 401 || status === 403) && !isPostLoginOrRegister && !isLogout) {
        // Token has expired, user not found, or invalid session
        Alert.alert(
          'Session Expired',
          'Your session has ended or your account status has changed. Please sign in again to continue.',
          [{ text: 'OK', onPress: () => globalEvent.emit('AUTH_LOGOUT') }]
        );
        
        // Prevent logout event from firing multiple times if multiple requests fail
        // The Alert above will trigger it on "OK"
      }
      
      // Suppress logging for 401/403 on logout or login (expected failures handled in UI)
      const isExpectedError = (status === 401 || status === 403) && (isLogout || isPostLoginOrRegister);
      
      if (!isExpectedError) {
        console.error(`[API Error] ${status} ${error.config.url}`, error.response.data);
      }
    } else if (error.request) {
      // No response received
      console.error('[Network Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;