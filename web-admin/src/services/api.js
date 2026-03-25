import axios from 'axios';
import { appConfig } from '../config/appConfig';

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
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
