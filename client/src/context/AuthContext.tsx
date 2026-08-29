import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserUid, PrivacySettings } from '../types';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { userApi } from '../lib/api';

interface AuthContextType {
  currentUser: UserProfile | null;
  partnerUser: UserProfile | null; // Currently active conversation partner
  setPartnerUser: (user: UserProfile | null) => void;
  isAuthenticated: boolean;
  loginError: string | null;
  isVaultUnlocked: boolean;
  isDecoyActive: boolean;
  formatLastSeen: (lastSeenIso?: string, isOnline?: boolean) => string;
  login: (identifier: string, pass: string) => Promise<boolean>;
  signup: (email: string, pass: string, displayName: string, username: string, photoURL?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  unlockVaultWithPin: (pin: string) => boolean;
  lockVault: () => void;
  updateMood: (emoji: string, text: string) => void;
  updatePetName: (petName: string) => void;
  toggleDecoyMode: () => void;
  authenticateBiometric: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default seed users for instant demonstration if offline
const SEED_USERS: UserProfile[] = [
  {
    uid: 'naveen_uid_798933',
    username: 'naveen',
    displayName: 'Naveen',
    email: 'naveen@ouruniverse.app',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Explorer of the cosmos ✨',
    role: 'owner',
    realName: 'Naveen',
    petName: 'Bangaram ❤️',
    city: 'Vijayawada, India',
    online: true,
    lastSeen: new Date().toISOString()
  },
  {
    uid: 'humera_uid_140299',
    username: 'humera',
    displayName: 'Humera',
    email: 'humera@ouruniverse.app',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    bio: 'Living in our private galaxy 💫',
    role: 'partner',
    realName: 'Humera',
    petName: 'Jaanu ❤️',
    city: 'Hyderabad, India',
    online: true,
    lastSeen: new Date().toISOString()
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pre-seed local storage with seed profiles if completely empty
  useEffect(() => {
    try {
      const existing = userApi.getAllCachedProfiles();
      if (existing.length === 0) {
        SEED_USERS.forEach(u => userApi.cacheProfile(u));
      }
    } catch (_) {}
  }, []);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('our_universe_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [partnerUser, setPartnerUser] = useState<UserProfile | null>(() => {
    if (!currentUser) return null;
    const all = userApi.getAllCachedProfiles();
    const other = all.find(u => u.uid !== currentUser.uid) || SEED_USERS.find(u => u.uid !== currentUser.uid);
    return other || null;
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

  // ── Global Real-Time Presence Synchronization ──────────
  useEffect(() => {
    if (!currentUser) return;

    const bcChannel = new BroadcastChannel('ou_presence_sync');

    // Supabase Realtime Channel for global presence
    const spChannel = isSupabaseConfigured()
      ? supabase.channel('ou_presence_global')
      : null;

    const handleIncomingPresence = (userId: string, timestamp: string) => {
      if (userId !== currentUser.uid) {
        setPartnerUser(prev => {
          if (!prev || prev.uid !== userId) return prev;
          return {
            ...prev,
            online: true,
            lastSeen: timestamp || new Date().toISOString()
          };
        });
      }
    };

    if (spChannel) {
      spChannel
        .on('broadcast', { event: 'PRESENCE_HEARTBEAT' }, (payload: any) => {
          const { userId, timestamp } = payload.payload || {};
          if (userId) handleIncomingPresence(userId, timestamp);
        })
        .subscribe();
    }

    // Heartbeat sender
    const sendHeartbeat = () => {
      const nowIso = new Date().toISOString();
      try {
        localStorage.setItem(`ou_last_seen_${currentUser.uid}`, nowIso);
        bcChannel.postMessage({
          type: 'PRESENCE_HEARTBEAT',
          userId: currentUser.uid,
          timestamp: nowIso
        });
      } catch (_) {}

      if (spChannel) {
        try {
          spChannel.send({
            type: 'broadcast',
            event: 'PRESENCE_HEARTBEAT',
            payload: { userId: currentUser.uid, timestamp: nowIso }
          }).catch(() => {});
        } catch (_) {}
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);

    bcChannel.onmessage = (e) => {
      if (e.data?.type === 'PRESENCE_HEARTBEAT' && e.data.userId) {
        handleIncomingPresence(e.data.userId, e.data.timestamp);
      }
    };

    return () => {
      clearInterval(interval);
      bcChannel.close();
      if (spChannel) supabase.removeChannel(spChannel);
    };
  }, [currentUser]);

  // ── Login with Email OR @Username ──
  const login = async (identifier: string, pass: string): Promise<boolean> => {
    setLoginError(null);
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');

    // Stealth decoy mode PIN
    if (pass === '0000') {
      setIsDecoyActive(true);
      return true;
    }

    // 1. Check local cached profiles first
    const cachedProfiles = userApi.getAllCachedProfiles();
    let foundProfile = cachedProfiles.find(
      u => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId
    );

    // 2. Check Supabase profiles if not in cache or if online
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.${cleanId},username_lower.eq.${cleanId}`)
          .maybeSingle();

        if (data && !error) {
          foundProfile = {
            uid: data.id,
            username: data.username,
            displayName: data.display_name,
            email: data.email,
            photoURL: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.display_name)}&background=ff70a6&color=fff`,
            bio: data.bio || '',
            role: data.role || 'user',
            online: true,
            lastSeen: new Date().toISOString(),
            privacySettings: data.privacy_settings
          };
        }
      } catch (err) {
        console.warn('[Auth] Remote lookup failed, falling back to local profiles:', err);
      }
    }

    // 3. Check hardcoded seeds as fallback
    if (!foundProfile) {
      foundProfile = SEED_USERS.find(
        u => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId
      );
    }

    if (!foundProfile) {
      setLoginError("Account not found. Please check your username or sign up.");
      return false;
    }

    // Update active user state
    const userToSave: UserProfile = {
      ...foundProfile,
      online: true,
      lastSeen: new Date().toISOString()
    };

    try {
      localStorage.setItem('our_universe_active_user', JSON.stringify(userToSave));
      userApi.cacheProfile(userToSave);
    } catch (_) {}

    setCurrentUser(userToSave);
    setIsAuthenticated(true);
    setIsDecoyActive(false);

    // Set online status in remote
    if (isSupabaseConfigured()) {
      supabase.from('profiles').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', userToSave.uid).then(() => {});
    }

    return true;
  };

  // ── Signup with Unique Username ──
  const signup = async (
    email: string,
    pass: string,
    displayName: string,
    username: string,
    photoURL?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoginError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanName = displayName.trim() || cleanUsername;

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      const err = "Username must be 3-20 characters long and contain only letters, numbers, and underscores.";
      setLoginError(err);
      return { success: false, error: err };
    }

    // Check username availability
    const isAvailable = await userApi.isUsernameAvailable(cleanUsername);
    if (!isAvailable) {
      const err = `@${cleanUsername} is already taken. Please choose another username.`;
      setLoginError(err);
      return { success: false, error: err };
    }

    const newUid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const avatar = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=ff70a6&color=fff`;

    const newUser: UserProfile = {
      uid: newUid,
      username: cleanUsername,
      displayName: cleanName,
      email: cleanEmail,
      photoURL: avatar,
      bio: "Hey there! I am using Our Universe.",
      role: 'user',
      online: true,
      lastSeen: new Date().toISOString(),
      privacySettings: {
        whoCanMessage: 'everyone',
        whoCanAdd: 'everyone',
        showOnline: true,
        showReadReceipts: true,
        showLastSeen: true,
        whoCanSeeProfile: 'everyone'
      },
      createdAt: new Date().toISOString()
    };

    // Save profile remotely and locally
    await userApi.upsertProfile(newUser);

    try {
      localStorage.setItem('our_universe_active_user', JSON.stringify(newUser));
    } catch (_) {}

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsDecoyActive(false);

    return { success: true };
  };

  const logout = () => {
    if (currentUser && isSupabaseConfigured()) {
      supabase.from('profiles').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', currentUser.uid).then(() => {});
    }
    localStorage.removeItem('our_universe_active_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsVaultUnlocked(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!currentUser) return false;

    // If changing username, verify availability
    if (updates.username && updates.username.toLowerCase() !== currentUser.username.toLowerCase()) {
      const avail = await userApi.isUsernameAvailable(updates.username, currentUser.uid);
      if (!avail) {
        return false;
      }
    }

    const updated: UserProfile = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await userApi.upsertProfile(updated);
    try {
      localStorage.setItem('our_universe_active_user', JSON.stringify(updated));
    } catch (_) {}

    setCurrentUser(updated);
    return true;
  };

  const unlockVaultWithPin = (pin: string): boolean => {
    if (pin.trim().length >= 4) {
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
    updateProfile(updated);
  };

  const updatePetName = (newPetName: string) => {
    if (!currentUser) return;
    updateProfile({ petName: newPetName });
  };

  const toggleDecoyMode = () => {
    setIsDecoyActive(prev => !prev);
  };

  const authenticateBiometric = async (): Promise<boolean> => {
    try {
      if (window.PublicKeyCredential && navigator.credentials) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const options: CredentialRequestOptions = {
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'preferred'
          }
        };
        await navigator.credentials.get(options);
        setIsVaultUnlocked(true);
        return true;
      }
    } catch (e: any) {
      console.warn('[Biometric] Auth failed or cancelled:', e?.name || e);
      return false;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      partnerUser,
      setPartnerUser,
      isAuthenticated,
      loginError,
      isVaultUnlocked,
      isDecoyActive,
      formatLastSeen,
      login,
      signup,
      logout,
      updateProfile,
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
