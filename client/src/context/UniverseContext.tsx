import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const UniverseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [ambientEffect, setAmbientEffect] = useState<AmbientEffect>('hearts');
  const [anniversaryDate, setAnniversaryDate] = useState<string>('2024-02-14T00:00:00.000Z');

  const [messages, setMessages] = useState<Message[]>(() => {
    const local = localStorage.getItem('our_universe_messages');
    return local ? JSON.parse(local) : INITIAL_MESSAGES;
  });

  const [memories, setMemories] = useState<Memory[]>(() => {
    const local = localStorage.getItem('our_universe_memories');
    return local ? JSON.parse(local) : INITIAL_MEMORIES;
  });

  const [vaultNotes, setVaultNotes] = useState<VaultNote[]>(() => {
    const local = localStorage.getItem('our_universe_vault');
    return local ? JSON.parse(local) : INITIAL_VAULT;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const local = localStorage.getItem('our_universe_calendar');
    return local ? JSON.parse(local) : INITIAL_CALENDAR;
  });

  const [todoItems, setTodoItems] = useState<SharedListItem[]>(() => {
    const local = localStorage.getItem('our_universe_todos');
    return local ? JSON.parse(local) : INITIAL_TODOS;
  });

  const [mapPins, setMapPins] = useState<LoveMapPin[]>(() => {
    const local = localStorage.getItem('our_universe_mappins');
    return local ? JSON.parse(local) : INITIAL_MAP_PINS;
  });

  const [recentNotification, setRecentNotification] = useState<QuickActionNotification | null>(null);

  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [syncedMediaUrl, setSyncedMediaUrl] = useState<string>('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isPlayingMedia, setIsPlayingMedia] = useState<boolean>(false);

  useEffect(() => { localStorage.setItem('our_universe_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('our_universe_memories', JSON.stringify(memories)); }, [memories]);
  useEffect(() => { localStorage.setItem('our_universe_vault', JSON.stringify(vaultNotes)); }, [vaultNotes]);
  useEffect(() => { localStorage.setItem('our_universe_calendar', JSON.stringify(calendarEvents)); }, [calendarEvents]);
  useEffect(() => { localStorage.setItem('our_universe_todos', JSON.stringify(todoItems)); }, [todoItems]);
  useEffect(() => { localStorage.setItem('our_universe_mappins', JSON.stringify(mapPins)); }, [mapPins]);

  // Burn disappearing messages
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      let burnedAny = false;
      setMessages(prev => {
        const filtered = prev.filter(m => {
          if (m.isSecret && m.expiresAt) {
            const isExpired = new Date(m.expiresAt).getTime() <= now;
            if (isExpired) burnedAny = true;
            return !isExpired;
          }
          return true;
        });
        return filtered;
      });
      if (burnedAny) {
        sounds.playSecretBurnSound();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = (
    content: string, 
    type: Message['type'] = 'text', 
    mediaUrl?: string, 
    replyToId?: string,
    isSecret?: boolean,
    secretTimeout: number = 60
  ) => {
    if (!currentUser) return;
    let replyToObj;
    if (replyToId) {
      const match = messages.find(m => m.id === replyToId);
      if (match) {
        replyToObj = { id: match.id, senderId: match.senderId, excerpt: match.content.substring(0, 40) };
      }
    }

    const expiresAt = isSecret ? new Date(Date.now() + secretTimeout * 1000).toISOString() : undefined;

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
      expiresAt,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    sounds.playMessageSentSound();
  };

  const deleteMessage = (id: string, forEveryone: boolean = true) => {
    if (forEveryone) {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  const toggleStarMessage = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
  };

  const addReaction = (id: string, emoji: string) => {
    if (!currentUser) return;
    setMessages(prev => prev.map(m => {
      if (m.id !== id) return m;
      const currentUids = m.reactions[emoji] || [];
      const hasReacted = currentUids.includes(currentUser.uid);
      const updatedUids = hasReacted 
        ? currentUids.filter(u => u !== currentUser.uid)
        : [...currentUids, currentUser.uid];
      
      const newReactions = { ...m.reactions };
      if (updatedUids.length > 0) {
        newReactions[emoji] = updatedUids;
      } else {
        delete newReactions[emoji];
      }
      return { ...m, reactions: newReactions };
    }));
  };

  const addMemory = (mem: Omit<Memory, 'id' | 'createdAt'>) => {
    const newMem: Memory = {
      ...mem,
      id: `mem_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setMemories(prev => [newMem, ...prev]);
  };

  const toggleFavoriteMemory = (id: string) => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
  };

  const addVaultNote = (note: Omit<VaultNote, 'id' | 'createdAt'>) => {
    const newNote: VaultNote = {
      ...note,
      id: `vault_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setVaultNotes(prev => [newNote, ...prev]);
  };

  const deleteVaultNote = (id: string) => {
    setVaultNotes(prev => prev.filter(v => v.id !== id));
  };

  const addCalendarEvent = (evt: Omit<CalendarEvent, 'id'>) => {
    const newEvt: CalendarEvent = { ...evt, id: `cal_${Date.now()}` };
    setCalendarEvents(prev => [...prev, newEvt]);
  };

  const addTodoItem = (title: string, category: SharedListItem['category']) => {
    if (!currentUser) return;
    const newItem: SharedListItem = {
      id: `todo_${Date.now()}`,
      title,
      category,
      completed: false,
      addedBy: currentUser.uid
    };
    setTodoItems(prev => [...prev, newItem]);
  };

  const toggleTodoItem = (id: string) => {
    setTodoItems(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t));
  };

  const deleteTodoItem = (id: string) => {
    setTodoItems(prev => prev.filter(t => t.id !== id));
  };

  const addMapPin = (pin: Omit<LoveMapPin, 'id'>) => {
    const newPin: LoveMapPin = { ...pin, id: `pin_${Date.now()}` };
    setMapPins(prev => [...prev, newPin]);
  };

  const sendQuickAction = (type: QuickActionNotification['type']) => {
    if (!currentUser) return;
    const action: QuickActionNotification = {
      id: `action_${Date.now()}`,
      senderId: currentUser.uid,
      type,
      timestamp: new Date().toISOString()
    };
    setRecentNotification(action);

    if (type === 'kiss') {
      sounds.playKissSound();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } else if (type === 'hug') {
      sounds.playHugSound();
    } else if (type === 'miss_you') {
      sounds.playHeartbeatSound();
    } else if (type === 'surprise') {
      sounds.playKissSound();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    }

    setTimeout(() => {
      setRecentNotification(null);
    }, 4000);
  };

  const startCall = (type: 'voice' | 'video') => {
    setIsCallActive(true);
    setCallType(type);
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallType(null);
  };

  const importDatabaseBackup = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.messages) setMessages(parsed.messages);
      if (parsed.memories) setMemories(parsed.memories);
      if (parsed.vaultNotes) setVaultNotes(parsed.vaultNotes);
      if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents);
      if (parsed.todoItems) setTodoItems(parsed.todoItems);
      if (parsed.mapPins) setMapPins(parsed.mapPins);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <UniverseContext.Provider value={{
      ambientEffect,
      setAmbientEffect,
      anniversaryDate,
      setAnniversaryDate,
      messages,
      sendMessage,
      deleteMessage,
      toggleStarMessage,
      addReaction,
      memories,
      addMemory,
      toggleFavoriteMemory,
      vaultNotes,
      addVaultNote,
      deleteVaultNote,
      calendarEvents,
      addCalendarEvent,
      todoItems,
      addTodoItem,
      toggleTodoItem,
      deleteTodoItem,
      mapPins,
      addMapPin,
      recentNotification,
      sendQuickAction,
      isCallActive,
      callType,
      startCall,
      endCall,
      syncedMediaUrl,
      setSyncedMediaUrl,
      isPlayingMedia,
      setIsPlayingMedia,
      importDatabaseBackup
    }}>
      {children}
    </UniverseContext.Provider>
  );
};

export const useUniverse = () => {
  const context = useContext(UniverseContext);
  if (!context) throw new Error('useUniverse must be used within UniverseProvider');
  return context;
};
