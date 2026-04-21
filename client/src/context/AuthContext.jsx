import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';

const AuthContext = createContext(null);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('lovechat_token') || '');

  useEffect(() => {
    async function loadProfile() {
      try {
        if (!token) return;
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        setRoom(data.room);
        connectSocket(token);
      } catch {
        localStorage.removeItem('lovechat_token');
        setToken('');
      } finally {
        setLoading(false);
      }
    }
    loadProfile().finally(() => setLoading(false));
  }, [token]);

  const auth = useMemo(() => ({
    user,
    room,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    async signup(payload) {
      return api.post('/auth/signup', {
        ...payload,
        email: normalizeEmail(payload?.email)
      });
    },
    async verifyOtp(payload) {
      const { data } = await api.post('/auth/verify-otp', payload);
      localStorage.setItem('lovechat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      const roomResponse = await api.get('/auth/me');
      setRoom(roomResponse.data.room);
      connectSocket(data.token);
      return data;
    },
    async login(payload) {
      const { data } = await api.post('/auth/login', {
        ...payload,
        email: normalizeEmail(payload?.email)
      });
      localStorage.setItem('lovechat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      const roomResponse = await api.get('/auth/me');
      setRoom(roomResponse.data.room);
      connectSocket(data.token);
      return data;
    },
    async forgotPassword(payload) {
      return api.post('/auth/forgot-password', payload);
    },
    async resetPassword(payload) {
      return api.post('/auth/reset-password', payload);
    },
    async logout() {
      try {
        await api.post('/auth/logout');
      } catch {
        // Clear local auth state even if server logout request fails.
      }
      disconnectSocket();
      localStorage.removeItem('lovechat_token');
      setToken('');
      setUser(null);
      setRoom(null);
    },
    async updateProfile(payload) {
      const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
      const { data } = await api.put('/rooms/profile/me', payload, isFormData ? {} : { headers: { 'Content-Type': 'application/json' } });
      setUser(data.user);
      return data;
    },
    setRoom
  }), [loading, room, token, user]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}