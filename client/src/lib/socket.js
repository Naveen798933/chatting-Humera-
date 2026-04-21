import { io } from 'socket.io-client';

let socket;

function resolveSocketUrl() {
  const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (configuredSocketUrl) return configuredSocketUrl;

  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocalHost ? 'http://localhost:5000' : window.location.origin;
}

export function connectSocket(token) {
  if (socket) return socket;
  socket = io(resolveSocketUrl(), {
    auth: { token },
    transports: ['websocket']
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}