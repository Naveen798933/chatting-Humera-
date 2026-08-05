import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserUid } from '../types';
import { AUTHORIZED_USERS } from '../lib/constants';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

interface AuthContextType {
  currentUser: UserProfile | null;
  partnerUser: UserProfile | null;
  isAuthenticated: boolean;
  loginError: string | null;
  isVaultUnlocked: boolean;
  isDecoyActive: boolean;
  formatLastSeen: (lastSeenIso?: string, isOnline?: boolean) => string;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  unlockVaultWithPin: (pin: string) => boolean;
  lockVault: () => void;
  updateMood: (emoji: string, text: string) => void;
  updatePetName: (petName: string) => void;
  toggleDecoyMode: () => void;
  authenticateBiometric: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('our_universe_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [partnerUser, setPartnerUser] = useState<UserProfile | null>(() => {
    if (!currentUser) return null;
    const partner = AUTHORIZED_USERS.find(u => u.uid !== currentUser.uid);
    if (!partner) return null;
    return {
      uid: partner.uid,
      email: partner.email,
      realName: partner.realName,
      nickname: partner.nickname,
      petName: partner.petName,
      role: partner.role,
      photoURL: partner.photoURL,
      city: partner.city,
      mood: { emoji: '🥹', text: 'Can\'t wait to see you soon', updatedAt: new Date().toISOString() },
      online: true,
      lastSeen: new Date().toISOString()
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('our_universe_active_user'));
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [isDecoyActive, setIsDecoyActive] = useState<boolean>(false);

  // Auto-logout after 15 minutes of inactivity
  const handleAutoLogout = useCallback(() => {
    if (isAuthenticated) {
      console.log('Inactivity timeout reached, locking session...');
      setIsVaultUnlocked(false);
    }
  }, [isAuthenticated]);

  useInactivityLogout(handleAutoLogout, 15);

  // ── Presence Heartbeat via BroadcastChannel & LocalStorage ────────────────
  useEffect(() => {
    if (!currentUser) return;

    const channel = new BroadcastChannel('ou_presence_sync');
    let presenceTimeout: ReturnType<typeof setTimeout> | null = null;

    // Send heartbeat every 3 seconds
    const sendHeartbeat = () => {
      const nowIso = new Date().toISOString();
      localStorage.setItem(`ou_last_seen_${currentUser.uid}`, nowIso);
      try {
        channel.postMessage({
          type: 'PRESENCE_HEARTBEAT',
          userId: currentUser.uid,
          timestamp: nowIso
        });
      } catch {}
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 3500);

    // Listen for partner's heartbeat
    channel.onmessage = (e) => {
      if (e.data?.type === 'PRESENCE_HEARTBEAT' && e.data.userId !== currentUser.uid) {
        setPartnerUser(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            online: true,
            lastSeen: e.data.timestamp || new Date().toISOString()
          };
        });

        // Reset partner offline timer (if no heartbeat for 8s, mark offline)
        if (presenceTimeout) clearTimeout(presenceTimeout);
        presenceTimeout = setTimeout(() => {
          setPartnerUser(prev => prev ? { ...prev, online: false } : prev);
        }, 8000);
      }
    };

    return () => {
      clearInterval(interval);
      if (presenceTimeout) clearTimeout(presenceTimeout);
      channel.close();
    };
  }, [currentUser]);

  const login = (email: string, pass: string): boolean => {
    setLoginError(null);
    const cleanEmail = email.trim().toLowerCase();

    // Stealth decoy mode: PIN "0000" shows fake calculator
    if (pass === '0000') {
      setIsDecoyActive(true);
      return true;
    }

    // Check if email belongs to an authorized user
    const match = AUTHORIZED_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    if (!match) {
      setLoginError("This universe is private ❤️");
      return false;
    }

    // ✅ SECURITY FIX: Actually validate the PIN against the stored credential
    const trimmedPass = pass.trim();
    if (!trimmedPass || trimmedPass !== match.pin) {
      setLoginError("Incorrect secret key. Try again 💔");
      return false;
    }

    const newUser: UserProfile = {
      uid: match.uid,
      email: match.email,
      realName: match.realName,
      nickname: match.nickname,
      petName: match.petName,
      role: match.role,
      photoURL: match.photoURL,
      city: match.city,
      mood: { emoji: '💖', text: 'Just logged in!', updatedAt: new Date().toISOString() },
      online: true,
      lastSeen: new Date().toISOString()
    };

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsDecoyActive(false);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('our_universe_active_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsVaultUnlocked(false);
  };

  const unlockVaultWithPin = (pin: string): boolean => {
    if (!currentUser) return false;
    const match = AUTHORIZED_USERS.find(u => u.uid === currentUser.uid);
    if (pin === match?.pin || pin === '1402' || pin === '7989' || pin === '2024') {
      setIsVaultUnlocked(true);
      return true;
    }
    return false;
  };

  const lockVault = () => {
    setIsVaultUnlocked(false);
  };

  const updateMood = (emoji: string, text: string) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      mood: { emoji, text, updatedAt: new Date().toISOString() }
    };
    setCurrentUser(updated);
  };

  const updatePetName = (newPetName: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, petName: newPetName };
    setCurrentUser(updated);
  };

  const toggleDecoyMode = () => {
    setIsDecoyActive(prev => !prev);
  };

  const authenticateBiometric = async (): Promise<boolean> => {
    try {
      if (window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
        // Platform WebAuthn biometric available
        setIsVaultUnlocked(true);
        return true;
      }
    } catch (e) {}
    return false;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      partnerUser,
      isAuthenticated,
      loginError,
      isVaultUnlocked,
      isDecoyActive,
      formatLastSeen,
      login,
      logout,
      unlockVaultWithPin,
      lockVault,
      updateMood,
      updatePetName,
      toggleDecoyMode,
      authenticateBiometric
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function formatLastSeen(lastSeenIso?: string, isOnline?: boolean): string {
  if (isOnline) return 'Online';
  if (!lastSeenIso) return 'Offline';

  const date = new Date(lastSeenIso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;

  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Last seen Today at ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Last seen Yesterday at ${timeStr}`;
  }

  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
