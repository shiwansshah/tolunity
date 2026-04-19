import axios from 'axios';
import { appConfig } from '../config/appConfig';
import { clearStoredAuth, isTokenExpired } from './authToken';

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    config.headers = config.headers ?? {};

    if (token) {
      if (isTokenExpired(token)) {
        clearStoredAuth();

        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }

        return Promise.reject(new Error('Session expired. Please login again.'));
      }

      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      if (window.location.pathname !== '/login') {
        clearStoredAuth();
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
