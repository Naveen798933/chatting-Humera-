import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL;
const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const defaultApiUrl = isLocalHost
  ? 'http://localhost:5000/api'
  : `${window.location.origin}/api`;

const api = axios.create({
  baseURL: configuredApiUrl || defaultApiUrl,
  timeout: 12000,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lovechat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;