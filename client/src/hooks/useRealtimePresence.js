import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket.js';

export function useRealtimePresence(roomId) {
  const [state, setState] = useState({});

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return undefined;
    const handler = (payload) => setState((current) => ({ ...current, [payload.userId]: payload.isOnline }));
    socket.on('presence:update', handler);
    return () => socket.off('presence:update', handler);
  }, [roomId]);

  return state;
}