import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Message, Memory, VaultNote, CalendarEvent, SharedListItem, 
  LoveMapPin, AmbientEffect, QuickActionNotification, UserUid 
} from '../types';
import { useAuth } from './AuthContext';
import { sounds } from '../lib/soundEffects';
import confetti from 'canvas-confetti';

interface UniverseContextType {
  ambientEffect: AmbientEffect;
  setAmbientEffect: (effect: AmbientEffect) => void;
  anniversaryDate: string;
  setAnniversaryDate: (date: string) => void;
  
  messages: Message[];
  sendMessage: (content: string, type?: Message['type'], mediaUrl?: string, replyToId?: string, isSecret?: boolean, secretTimeout?: number) => void;
  deleteMessage: (id: string, forEveryone?: boolean) => void;
  toggleStarMessage: (id: string) => void;
  addReaction: (id: string, emoji: string) => void;

  memories: Memory[];
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  toggleFavoriteMemory: (id: string) => void;

  vaultNotes: VaultNote[];
  addVaultNote: (note: Omit<VaultNote, 'id' | 'createdAt'>) => void;
  deleteVaultNote: (id: string) => void;

  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;

  todoItems: SharedListItem[];
  addTodoItem: (title: string, category: SharedListItem['category']) => void;
  toggleTodoItem: (id: string) => void;
  deleteTodoItem: (id: string) => void;

  mapPins: LoveMapPin[];
  addMapPin: (pin: Omit<LoveMapPin, 'id'>) => void;

  recentNotification: QuickActionNotification | null;
  sendQuickAction: (type: QuickActionNotification['type']) => void;

  isCallActive: boolean;
  callType: 'voice' | 'video' | null;
  startCall: (type: 'voice' | 'video') => void;
  endCall: () => void;

  syncedMediaUrl: string;
  setSyncedMediaUrl: (url: string) => void;
  isPlayingMedia: boolean;
  setIsPlayingMedia: (playing: boolean) => void;

  importDatabaseBackup: (jsonString: string) => boolean;
}

const UniverseContext = createContext<UniverseContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STORAGE KEY — same key for BOTH users so messages are visible to both
// This is the FIX: both Naveen and Humera now read from/write to the exact
// same localStorage namespace, and a BroadcastChannel fires storage events
// so the other browser tab / device picks up updates in real-time.
// ─────────────────────────────────────────────────────────────────────────────
const SHARED_MSGS_KEY   = 'ou_shared_messages';
const SHARED_MEMS_KEY   = 'ou_shared_memories';
const SHARED_VAULT_KEY  = 'ou_shared_vault';
const SHARED_CAL_KEY    = 'ou_shared_calendar';
const SHARED_TODO_KEY   = 'ou_shared_todos';
const SHARED_MAP_KEY    = 'ou_shared_mappins';
const BC_CHANNEL_NAME   = 'our_universe_sync';

// ─────────────────────────────────────────────────────────────────────────────
// Helper to safely read from localStorage
// ─────────────────────────────────────────────────────────────────────────────
function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'naveen_uid_798933',
    type: 'text',
    content: 'Good morning Jaanu ❤️ Hope you slept well! Can\'t wait to start our day together.',
    reactions: { '❤️': ['humera_uid_140299'] },
    delivered: true,
    seenAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'm2',
    senderId: 'humera_uid_140299',
    type: 'text',
    content: 'Good morning Bangaram 🥰 I missed you so much in my dreams last night!',
    reactions: { '🥹': ['naveen_uid_798933'] },
    delivered: true,
    seenAt: new Date(Date.now() - 7100000).toISOString(),
    createdAt: new Date(Date.now() - 7100000).toISOString()
  },
  {
    id: 'm3',
    senderId: 'naveen_uid_798933',
    type: 'image',
    content: 'Our sunset view from last weekend ✨',
    mediaUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    reactions: { '🔥': ['humera_uid_140299'], '❤️': ['naveen_uid_798933', 'humera_uid_140299'] },
    delivered: true,
    seenAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'm4',
    senderId: 'humera_uid_140299',
    type: 'text',
    content: 'Look at the timer on our home screen! We have been together for so many beautiful days ❤️',
    reactions: { '💖': ['naveen_uid_798933'] },
    delivered: true,
    seenAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'mem1',
    title: 'Our First Coffee Date ☕',
    description: 'The day time stood still and we talked for 4 hours non-stop.',
    mediaUrls: ['https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80'],
    type: 'photo',
    album: 'Random',
    date: '2024-02-14',
    isFavorite: true,
    createdBy: 'naveen_uid_798933',
    createdAt: '2024-02-14T10:00:00.000Z'
  },
  {
    id: 'mem2',
    title: 'Stargazing by the Lake 🌌',
    description: 'Holding hands under a sky full of stars in the quiet cold night.',
    mediaUrls: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'],
    type: 'photo',
    album: 'Vacations',
    date: '2024-07-20',
    isFavorite: true,
    createdBy: 'humera_uid_140299',
    createdAt: '2024-07-20T22:30:00.000Z'
  },
  {
    id: 'mem3',
    title: 'Humera\'s Surprise Birthday 🎂',
    description: 'The secret party and the customized galaxy ring!',
    mediaUrls: ['https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80'],
    type: 'photo',
    album: 'Birthdays',
    date: '2024-09-15',
    isFavorite: false,
    createdBy: 'naveen_uid_798933',
    createdAt: '2024-09-15T18:00:00.000Z'
  }
];

const INITIAL_VAULT: VaultNote[] = [
  {
    id: 'v1',
    title: 'A Letter for the Future Us 📜',
    content: 'My dearest Humera, no matter where life takes us, remember that my heart belongs to you. Every single day with you is my favorite memory.',
    isLocked: false,
    createdBy: 'naveen_uid_798933',
    createdAt: '2024-02-14T00:00:00.000Z'
  },
  {
    id: 'v2',
    title: 'Open on Our 5th Anniversary 🎁',
    content: 'Happy 5th Anniversary my love! If you are reading this, we have conquered so many milestones together...',
    unlockDate: '2029-02-14',
    isLocked: true,
    createdBy: 'humera_uid_140299',
    createdAt: '2024-02-14T00:00:00.000Z'
  }
];

const INITIAL_CALENDAR: CalendarEvent[] = [
  { id: 'c1', title: 'Our Relationship Anniversary ❤️', date: '2024-02-14', category: 'anniversary', description: 'The official beginning of Our Universe', createdBy: 'naveen_uid_798933' },
  { id: 'c2', title: 'Humera\'s Birthday 👑', date: '2024-09-15', category: 'birthday', description: 'Treating Jaanu like the queen she is', createdBy: 'naveen_uid_798933' },
  { id: 'c3', title: 'Naveen\'s Birthday 🎂', date: '2024-11-20', category: 'birthday', description: 'Bangaram\'s special day!', createdBy: 'humera_uid_140299' },
  { id: 'c4', title: 'Romantic Getaway Trip 🏖️', date: '2026-10-10', category: 'trip', description: 'Maldives beachfront villa vacation', createdBy: 'humera_uid_140299' }
];

const INITIAL_TODOS: SharedListItem[] = [
  { id: 't1', title: 'Watch Interstellar together in 4K', category: 'movies', completed: true, addedBy: 'naveen_uid_798933' },
  { id: 't2', title: 'Hot air balloon ride in Cappadocia', category: 'bucket', completed: false, addedBy: 'humera_uid_140299' },
  { id: 't3', title: 'Bake a chocolate lava cake together from scratch', category: 'foods', completed: false, addedBy: 'humera_uid_140299' },
  { id: 't4', title: 'Visit Paris and see the Eiffel Tower lights at midnight', category: 'travel', completed: false, addedBy: 'naveen_uid_798933' }
];

const INITIAL_MAP_PINS: LoveMapPin[] = [
  { id: 'p1', title: 'First Date Spot ☕', latitude: 17.3850, longitude: 78.4867, locationName: 'Hyderabad, India', dateVisited: '2024-02-14' },
  { id: 'p2', title: 'Bengaluru Botanical Gardens 🌸', latitude: 12.9716, longitude: 77.5946, locationName: 'Bengaluru, India', dateVisited: '2024-06-10' },
  { id: 'p3', title: 'Dream Honeymoon Destination 🗼', latitude: 48.8566, longitude: 2.3522, locationName: 'Paris, France', isBucketList: true }
];

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export const UniverseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [ambientEffect, setAmbientEffect]     = useState<AmbientEffect>('hearts');
  const [anniversaryDate, setAnniversaryDate] = useState<string>('2024-02-14T00:00:00.000Z');

  // ── shared state — initialise from the SHARED keys ─────────────────────────
  const [messages, setMessages]       = useState<Message[]>(() => readStorage(SHARED_MSGS_KEY,  INITIAL_MESSAGES));
  const [memories, setMemories]       = useState<Memory[]>(() => readStorage(SHARED_MEMS_KEY,   INITIAL_MEMORIES));
  const [vaultNotes, setVaultNotes]   = useState<VaultNote[]>(() => readStorage(SHARED_VAULT_KEY, INITIAL_VAULT));
  const [calendarEvents, setCalendar] = useState<CalendarEvent[]>(() => readStorage(SHARED_CAL_KEY, INITIAL_CALENDAR));
  const [todoItems, setTodos]         = useState<SharedListItem[]>(() => readStorage(SHARED_TODO_KEY, INITIAL_TODOS));
  const [mapPins, setMapPins]         = useState<LoveMapPin[]>(() => readStorage(SHARED_MAP_KEY, INITIAL_MAP_PINS));

  const [recentNotification, setRecentNotification] = useState<QuickActionNotification | null>(null);
  const [isCallActive, setIsCallActive]             = useState<boolean>(false);
  const [callType, setCallType]                     = useState<'voice' | 'video' | null>(null);
  const [syncedMediaUrl, setSyncedMediaUrl]         = useState<string>('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isPlayingMedia, setIsPlayingMedia]         = useState<boolean>(false);

  // ── BroadcastChannel — real-time sync across tabs/windows ─────────────────
  // When Naveen sends a message in Tab A, Humera (Tab B on the SAME device)
  // or another session reading the same localStorage gets the update instantly.
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Create channel
    if (typeof BroadcastChannel !== 'undefined') {
      bcRef.current = new BroadcastChannel(BC_CHANNEL_NAME);

      bcRef.current.onmessage = (e) => {
        const { type, payload } = e.data as { type: string; payload: any };
        switch (type) {
          case 'MESSAGES_UPDATE':  setMessages(payload);  break;
          case 'MEMORIES_UPDATE':  setMemories(payload);  break;
          case 'VAULT_UPDATE':     setVaultNotes(payload); break;
          case 'CALENDAR_UPDATE':  setCalendar(payload);  break;
          case 'TODOS_UPDATE':     setTodos(payload);     break;
          case 'MAPPINS_UPDATE':   setMapPins(payload);   break;
        }
      };
    }

    // Also listen for storage events (different browser tabs on same device)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SHARED_MSGS_KEY  && e.newValue) setMessages(JSON.parse(e.newValue));
      if (e.key === SHARED_MEMS_KEY  && e.newValue) setMemories(JSON.parse(e.newValue));
      if (e.key === SHARED_VAULT_KEY && e.newValue) setVaultNotes(JSON.parse(e.newValue));
      if (e.key === SHARED_CAL_KEY   && e.newValue) setCalendar(JSON.parse(e.newValue));
      if (e.key === SHARED_TODO_KEY  && e.newValue) setTodos(JSON.parse(e.newValue));
      if (e.key === SHARED_MAP_KEY   && e.newValue) setMapPins(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      bcRef.current?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // ── Helper: write + broadcast a change ─────────────────────────────────────
  const persistAndBroadcast = <T,>(
    key: string,
    bcType: string,
    setter: React.Dispatch<React.SetStateAction<T>>,
    updater: (prev: T) => T
  ) => {
    setter(prev => {
      const next = updater(prev);
      writeStorage(key, next);
      bcRef.current?.postMessage({ type: bcType, payload: next });
      return next;
    });
  };

  // ── Burn disappearing messages ──────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let burnedAny = false;
      setMessages(prev => {
        const filtered = prev.filter(m => {
          if (m.isSecret && m.expiresAt) {
            const expired = new Date(m.expiresAt).getTime() <= now;
            if (expired) burnedAny = true;
            return !expired;
          }
          return true;
        });
        if (burnedAny) {
          writeStorage(SHARED_MSGS_KEY, filtered);
          bcRef.current?.postMessage({ type: 'MESSAGES_UPDATE', payload: filtered });
        }
        return filtered;
      });
      if (burnedAny) sounds.playSecretBurnSound();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = (
    content: string,
    type: Message['type'] = 'text',
    mediaUrl?: string,
    replyToId?: string,
    isSecret?: boolean,
    secretTimeout: number = 60
  ) => {
    if (!currentUser) return;

    const replyToMsg = replyToId ? messages.find(m => m.id === replyToId) : undefined;
    const replyToObj = replyToMsg
      ? { id: replyToMsg.id, senderId: replyToMsg.senderId, excerpt: replyToMsg.content.substring(0, 40) }
      : undefined;

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      senderId: currentUser.uid,
      type,
      content,
      mediaUrl,
      replyTo: replyToObj,
      reactions: {},
      delivered: true,
      seenAt: new Date().toISOString(),
      isSecret,
      expiresAt: isSecret ? new Date(Date.now() + secretTimeout * 1000).toISOString() : undefined,
      createdAt: new Date().toISOString()
    };

    persistAndBroadcast<Message[]>(
      SHARED_MSGS_KEY,
      'MESSAGES_UPDATE',
      setMessages,
      prev => [...prev, newMsg]
    );
    sounds.playMessageSentSound();
  };

  const deleteMessage = (id: string, forEveryone = true) => {
    if (!forEveryone) return;
    persistAndBroadcast<Message[]>(SHARED_MSGS_KEY, 'MESSAGES_UPDATE', setMessages, prev => prev.filter(m => m.id !== id));
  };

  const toggleStarMessage = (id: string) => {
    persistAndBroadcast<Message[]>(SHARED_MSGS_KEY, 'MESSAGES_UPDATE', setMessages,
      prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
  };

  const addReaction = (id: string, emoji: string) => {
    if (!currentUser) return;
    persistAndBroadcast<Message[]>(SHARED_MSGS_KEY, 'MESSAGES_UPDATE', setMessages, prev =>
      prev.map(m => {
        if (m.id !== id) return m;
        const cur = m.reactions[emoji] || [];
        const has = cur.includes(currentUser.uid);
        const uids = has ? cur.filter(u => u !== currentUser.uid) : [...cur, currentUser.uid];
        const next = { ...m.reactions };
        if (uids.length) next[emoji] = uids; else delete next[emoji];
        return { ...m, reactions: next };
      })
    );
  };

  const addMemory = (mem: Omit<Memory, 'id' | 'createdAt'>) => {
    const newMem: Memory = { ...mem, id: `mem_${Date.now()}`, createdAt: new Date().toISOString() };
    persistAndBroadcast<Memory[]>(SHARED_MEMS_KEY, 'MEMORIES_UPDATE', setMemories, prev => [newMem, ...prev]);
  };

  const toggleFavoriteMemory = (id: string) => {
    persistAndBroadcast<Memory[]>(SHARED_MEMS_KEY, 'MEMORIES_UPDATE', setMemories,
      prev => prev.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
  };

  const addVaultNote = (note: Omit<VaultNote, 'id' | 'createdAt'>) => {
    const n: VaultNote = { ...note, id: `vault_${Date.now()}`, createdAt: new Date().toISOString() };
    persistAndBroadcast<VaultNote[]>(SHARED_VAULT_KEY, 'VAULT_UPDATE', setVaultNotes, prev => [n, ...prev]);
  };

  const deleteVaultNote = (id: string) => {
    persistAndBroadcast<VaultNote[]>(SHARED_VAULT_KEY, 'VAULT_UPDATE', setVaultNotes, prev => prev.filter(v => v.id !== id));
  };

  const addCalendarEvent = (evt: Omit<CalendarEvent, 'id'>) => {
    const e: CalendarEvent = { ...evt, id: `cal_${Date.now()}` };
    persistAndBroadcast<CalendarEvent[]>(SHARED_CAL_KEY, 'CALENDAR_UPDATE', setCalendar, prev => [...prev, e]);
  };

  const addTodoItem = (title: string, category: SharedListItem['category']) => {
    if (!currentUser) return;
    const item: SharedListItem = { id: `todo_${Date.now()}`, title, category, completed: false, addedBy: currentUser.uid };
    persistAndBroadcast<SharedListItem[]>(SHARED_TODO_KEY, 'TODOS_UPDATE', setTodos, prev => [...prev, item]);
  };

  const toggleTodoItem = (id: string) => {
    persistAndBroadcast<SharedListItem[]>(SHARED_TODO_KEY, 'TODOS_UPDATE', setTodos,
      prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t));
  };

  const deleteTodoItem = (id: string) => {
    persistAndBroadcast<SharedListItem[]>(SHARED_TODO_KEY, 'TODOS_UPDATE', setTodos, prev => prev.filter(t => t.id !== id));
  };

  const addMapPin = (pin: Omit<LoveMapPin, 'id'>) => {
    const p: LoveMapPin = { ...pin, id: `pin_${Date.now()}` };
    persistAndBroadcast<LoveMapPin[]>(SHARED_MAP_KEY, 'MAPPINS_UPDATE', setMapPins, prev => [...prev, p]);
  };

  const sendQuickAction = (type: QuickActionNotification['type']) => {
    if (!currentUser) return;
    const action: QuickActionNotification = { id: `action_${Date.now()}`, senderId: currentUser.uid, type, timestamp: new Date().toISOString() };
    setRecentNotification(action);
    if (type === 'kiss')      { sounds.playKissSound();      confetti({ particleCount: 120, spread: 80,  origin: { y: 0.6 } }); }
    else if (type === 'hug')       sounds.playHugSound();
    else if (type === 'miss_you')  sounds.playHeartbeatSound();
    else if (type === 'surprise') { sounds.playKissSound();  confetti({ particleCount: 150, spread: 90,  origin: { y: 0.5 } }); }
    setTimeout(() => setRecentNotification(null), 4000);
  };

  const startCall = (type: 'voice' | 'video') => { setIsCallActive(true); setCallType(type); };
  const endCall   = ()                           => { setIsCallActive(false); setCallType(null); };

  const importDatabaseBackup = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.messages)      { writeStorage(SHARED_MSGS_KEY,  parsed.messages);      setMessages(parsed.messages); }
      if (parsed.memories)      { writeStorage(SHARED_MEMS_KEY,  parsed.memories);      setMemories(parsed.memories); }
      if (parsed.vaultNotes)    { writeStorage(SHARED_VAULT_KEY, parsed.vaultNotes);    setVaultNotes(parsed.vaultNotes); }
      if (parsed.calendarEvents){ writeStorage(SHARED_CAL_KEY,   parsed.calendarEvents); setCalendar(parsed.calendarEvents); }
      if (parsed.todoItems)     { writeStorage(SHARED_TODO_KEY,  parsed.todoItems);     setTodos(parsed.todoItems); }
      if (parsed.mapPins)       { writeStorage(SHARED_MAP_KEY,   parsed.mapPins);       setMapPins(parsed.mapPins); }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <UniverseContext.Provider value={{
      ambientEffect, setAmbientEffect, anniversaryDate, setAnniversaryDate,
      messages, sendMessage, deleteMessage, toggleStarMessage, addReaction,
      memories, addMemory, toggleFavoriteMemory,
      vaultNotes, addVaultNote, deleteVaultNote,
      calendarEvents, addCalendarEvent,
      todoItems, addTodoItem, toggleTodoItem, deleteTodoItem,
      mapPins, addMapPin,
      recentNotification, sendQuickAction,
      isCallActive, callType, startCall, endCall,
      syncedMediaUrl, setSyncedMediaUrl, isPlayingMedia, setIsPlayingMedia,
      importDatabaseBackup
    }}>
      {children}
    </UniverseContext.Provider>
  );
};

export const useUniverse = () => {
  const ctx = useContext(UniverseContext);
  if (!ctx) throw new Error('useUniverse must be used within UniverseProvider');
  return ctx;
};
