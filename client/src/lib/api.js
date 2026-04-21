import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL;

console.log('LoveChat API URL:', configuredApiUrl || 'not configured');

const api = axios.create({
  baseURL: configuredApiUrl,
  timeout: 12000,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  if (!configuredApiUrl) {
    return Promise.reject(new Error('API URL is not configured. Set VITE_API_URL in client/.env'));
  }
  const token = localStorage.getItem('lovechat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;