import axios from 'axios';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../utils/constants';
import { getToken } from '../utils/storage';
import { globalEvent } from '../utils/EventEmitter';
import { getApiErrorMessage } from './apiError';

let authFailureHandled = false;

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
  (response) => {
    authFailureHandled = false;
    return response;
  },
  async (error) => {
    const requestUrl = error.config?.url || '';
    const status = error.response?.status;
    const isLoginOrRegister = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    const isLogout = requestUrl.includes('/auth/logout');

    if (error.response) {
      if ((status === 401 || status === 403) && !isLoginOrRegister && !isLogout) {
        if (!authFailureHandled) {
          authFailureHandled = true;
          Alert.alert(
            'Session Expired',
            'Your session has ended or your account status has changed. Please sign in again to continue.',
            [
              {
                text: 'OK',
                onPress: () => {
                  authFailureHandled = false;
                  globalEvent.emit('AUTH_LOGOUT');
                },
              },
            ]
          );
        }

        error.userMessage = 'Your session has expired. Please sign in again.';
        return Promise.reject(error);
      }
      
      const isExpectedError = (status === 401 || status === 403) && (isLogout || isLoginOrRegister);
      
      if (!isExpectedError) {
        console.error(`[API Error] ${status} ${requestUrl}`, error.response.data);
      }
    } else if (error.request) {
      console.error('[Network Error]', error.message);
    }

    error.userMessage = getApiErrorMessage(error, 'Request failed');
    return Promise.reject(error);
  }
);

export default axiosInstance;
