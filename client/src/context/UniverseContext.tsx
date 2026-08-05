import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Message, Memory, VaultNote, CalendarEvent, SharedListItem,
  LoveMapPin, AmbientEffect, QuickActionNotification
} from '../types';
import { useAuth } from './AuthContext';
import { sounds } from '../lib/soundEffects';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// CHAT ID: always sort so Naveen→Humera and Humera→Naveen produce SAME id
// This was the root cause of one-way messaging
// ─────────────────────────────────────────────────────────────────────────────
const NAVEEN_UID  = 'naveen_uid_798933';
const HUMERA_UID  = 'humera_uid_140299';
const SHARED_CHAT_ID = [NAVEEN_UID, HUMERA_UID].sort().join('_');

// Firestore collection paths
const CHATS_COL   = 'chats';
const MSGS_SUB    = 'messages';
const MEMS_COL    = 'memories';
const VAULT_COL   = 'vault';
const CAL_COL     = 'calendar';
const TODO_COL    = 'todos';
const MAP_COL     = 'mapPins';
const NOTIF_COL   = 'notifications';

// Local-only keys (non-message data stored in localStorage as fallback)
const LS_MEMS  = 'ou_shared_memories';
const LS_VAULT = 'ou_shared_vault';
const LS_CAL   = 'ou_shared_calendar';
const LS_TODO  = 'ou_shared_todos';
const LS_MAP   = 'ou_shared_mappins';
const LS_MSGS  = 'ou_shared_messages';

function readLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function writeLS(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

const SEED_MESSAGES: Message[] = [
  {
    id: 'msg_seed_1',
    senderId: NAVEEN_UID,
    type: 'text',
    content: 'Welcome to Our Universe! ❤️ Every moment with you is magical, Humera.',
    reactions: { '❤️': [HUMERA_UID] },
    delivered: true,
    isSecret: false,
    isStarred: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'msg_seed_2',
    senderId: HUMERA_UID,
    type: 'text',
    content: 'I love our private space so much Bangaram! 💕',
    reactions: { '💖': [NAVEEN_UID] },
    delivered: true,
    isSecret: false,
    isStarred: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed data for first-time runs
// ─────────────────────────────────────────────────────────────────────────────
const SEED_MEMORIES: Memory[] = [
  { id: 'mem1', title: 'Our First Coffee Date ☕', description: 'The day time stood still and we talked for 4 hours.', mediaUrls: ['https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80'], type: 'photo', album: 'Random', date: '2024-02-14', isFavorite: true, createdBy: NAVEEN_UID, createdAt: '2024-02-14T10:00:00.000Z' },
  { id: 'mem2', title: 'Stargazing by the Lake 🌌', description: 'Holding hands under a sky full of stars.', mediaUrls: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'], type: 'photo', album: 'Vacations', date: '2024-07-20', isFavorite: true, createdBy: HUMERA_UID, createdAt: '2024-07-20T22:30:00.000Z' }
];
const SEED_VAULT: VaultNote[] = [
  { id: 'v1', title: 'A Letter for the Future Us 📜', content: 'My dearest Humera, my heart belongs to you forever.', isLocked: false, createdBy: NAVEEN_UID, createdAt: '2024-02-14T00:00:00.000Z' },
  { id: 'v2', title: 'Open on Our 5th Anniversary 🎁', content: 'Happy 5th Anniversary my love!', unlockDate: '2029-02-14', isLocked: true, createdBy: HUMERA_UID, createdAt: '2024-02-14T00:00:00.000Z' }
];
const SEED_CALENDAR: CalendarEvent[] = [
  { id: 'c1', title: 'Our Relationship Anniversary ❤️', date: '2024-02-14', category: 'anniversary', description: 'The official beginning of Our Universe', createdBy: NAVEEN_UID },
  { id: 'c2', title: "Humera's Birthday 👑", date: '2024-09-15', category: 'birthday', description: 'Treating Jaanu like the queen she is', createdBy: NAVEEN_UID },
  { id: 'c3', title: "Naveen's Birthday 🎂", date: '2024-11-20', category: 'birthday', description: "Bangaram's special day!", createdBy: HUMERA_UID },
  { id: 'c4', title: 'Romantic Getaway Trip 🏖️', date: '2026-10-10', category: 'trip', description: 'Maldives beachfront villa vacation', createdBy: HUMERA_UID }
];
const SEED_TODOS: SharedListItem[] = [
  { id: 't1', title: 'Watch Interstellar together in 4K', category: 'movies', completed: true, addedBy: NAVEEN_UID },
  { id: 't2', title: 'Hot air balloon ride in Cappadocia', category: 'bucket', completed: false, addedBy: HUMERA_UID },
  { id: 't3', title: 'Bake a chocolate lava cake together', category: 'foods', completed: false, addedBy: HUMERA_UID },
  { id: 't4', title: 'Visit Paris and see the Eiffel Tower', category: 'travel', completed: false, addedBy: NAVEEN_UID }
];
const SEED_MAP: LoveMapPin[] = [
  { id: 'p1', title: 'First Date Spot ☕', latitude: 17.3850, longitude: 78.4867, locationName: 'Hyderabad, India', dateVisited: '2024-02-14' },
  { id: 'p2', title: 'Bengaluru Botanical Gardens 🌸', latitude: 12.9716, longitude: 77.5946, locationName: 'Bengaluru, India', dateVisited: '2024-06-10' },
  { id: 'p3', title: 'Dream Honeymoon Destination 🗼', latitude: 48.8566, longitude: 2.3522, locationName: 'Paris, France', isBucketList: true }
];

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────
interface UniverseContextType {
  ambientEffect: AmbientEffect;
  setAmbientEffect: (e: AmbientEffect) => void;
  anniversaryDate: string;
  setAnniversaryDate: (d: string) => void;

  messages: Message[];
  sendMessage: (content: string, type?: Message['type'], mediaUrl?: string, replyToId?: string, isSecret?: boolean, secretTimeout?: number) => Promise<void>;
  deleteMessage: (id: string, forEveryone?: boolean) => Promise<void>;
  editMessage: (id: string, newContent: string) => Promise<void>;
  markMessagesAsSeen: () => void;
  toggleStarMessage: (id: string) => void;
  addReaction: (id: string, emoji: string) => void;

  isPartnerTyping: boolean;
  setTypingStatus: (isTyping: boolean) => void;

  memories: Memory[];
  addMemory: (mem: Omit<Memory, 'id' | 'createdAt'>) => void;
  toggleFavoriteMemory: (id: string) => void;

  vaultNotes: VaultNote[];
  addVaultNote: (note: Omit<VaultNote, 'id' | 'createdAt'>) => void;
  deleteVaultNote: (id: string) => void;

  calendarEvents: CalendarEvent[];
  addCalendarEvent: (evt: Omit<CalendarEvent, 'id'>) => void;

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
  setIsPlayingMedia: (v: boolean) => void;

  importDatabaseBackup: (json: string) => boolean;
}

const UniverseContext = createContext<UniverseContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export const UniverseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [ambientEffect, setAmbientEffect]     = useState<AmbientEffect>('hearts');
  const [anniversaryDate, setAnniversaryDate] = useState('2026-05-30T00:00:00.000Z');

  // ── Messages — localStorage & Supabase ──────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>(() => readLS(LS_MSGS, SEED_MESSAGES));
  const msgSyncChannelRef = useRef<BroadcastChannel | null>(null);

  // ── Non-message data — localStorage with BroadcastChannel ─────────────────
  const [memories, setMemories]         = useState<Memory[]>(() => readLS(LS_MEMS, SEED_MEMORIES));
  const [vaultNotes, setVaultNotes]     = useState<VaultNote[]>(() => readLS(LS_VAULT, SEED_VAULT));
  const [calendarEvents, setCalendar]   = useState<CalendarEvent[]>(() => readLS(LS_CAL, SEED_CALENDAR));
  const [todoItems, setTodos]           = useState<SharedListItem[]>(() => readLS(LS_TODO, SEED_TODOS));
  const [mapPins, setMapPins]           = useState<LoveMapPin[]>(() => readLS(LS_MAP, SEED_MAP));

  const [recentNotification, setNotif] = useState<QuickActionNotification | null>(null);
  const [isCallActive, setCallActive]  = useState(false);
  const [callType, setCallType]        = useState<'voice' | 'video' | null>(null);
  const [syncedMediaUrl, setSyncedMediaUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isPlayingMedia, setIsPlayingMedia] = useState(false);

  // ── Supabase Realtime Listener ─────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    console.log('[Supabase] Initializing real-time subscription for chat:', SHARED_CHAT_ID);

    // Initial fetch
    supabase
      .from('messages')
      .select('*')
      .eq('chat_id', SHARED_CHAT_ID)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (data && !error) {
          const loaded: Message[] = data.map(row => ({
            id: row.id,
            senderId: row.sender_id,
            type: row.type || 'text',
            content: row.content || '',
            mediaUrl: row.media_url || undefined,
            replyTo: row.reply_to || undefined,
            reactions: row.reactions || {},
            delivered: true,
            isSecret: Boolean(row.is_secret),
            isStarred: Boolean(row.is_starred),
            expiresAt: row.expires_at || undefined,
            createdAt: row.created_at || new Date().toISOString()
          }));
          setMessages(loaded);
        }
      });

    // Realtime changes channel
    const channel = supabase
      .channel(`chat_${SHARED_CHAT_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${SHARED_CHAT_ID}`
        },
        (payload) => {
          console.log('[Supabase Realtime] Event received:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            const newMsg: Message = {
              id: row.id,
              senderId: row.sender_id,
              type: row.type || 'text',
              content: row.content || '',
              mediaUrl: row.media_url || undefined,
              replyTo: row.reply_to || undefined,
              reactions: row.reactions || {},
              delivered: true,
              isSecret: Boolean(row.is_secret),
              isStarred: Boolean(row.is_starred),
              expiresAt: row.expires_at || undefined,
              createdAt: row.created_at || new Date().toISOString()
            };
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) return prev;
              const filtered = prev.filter(m => m.id !== newMsg.id && !(m.content === newMsg.content && m.senderId === newMsg.senderId && m.id.startsWith('temp_')));
              if (currentUser && newMsg.senderId !== currentUser.uid) {
                sounds.playMessageReceivedSound();
              }
              return [...filtered, newMsg].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            });
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new;
            setMessages(prev => prev.map(m => m.id === row.id ? {
              ...m,
              content: row.content,
              reactions: row.reactions || {},
              isStarred: Boolean(row.is_starred)
            } : m));
          }
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // ── Typing indicator via BroadcastChannel & Supabase Realtime Broadcast ──
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingChannelRef = useRef<BroadcastChannel | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spChatChannelRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUser) return;
    const bcChannel = new BroadcastChannel('ou_typing_indicator');
    typingChannelRef.current = bcChannel;

    const handleIncomingTyping = (userId: string, isTyping: boolean) => {
      if (userId && userId !== currentUser.uid) {
        setIsPartnerTyping(Boolean(isTyping));
        if (isTyping) {
          if (typingClearRef.current) clearTimeout(typingClearRef.current);
          typingClearRef.current = setTimeout(() => setIsPartnerTyping(false), 3500);
        }
      }
    };

    bcChannel.onmessage = (e) => {
      const { userId, isTyping } = e.data || {};
      handleIncomingTyping(userId, isTyping);
    };

    // Supabase Realtime Channel for internet-wide cross-device typing & actions
    if (isSupabaseConfigured()) {
      const spChannel = supabase.channel('ou_chat_broadcast');
      spChatChannelRef.current = spChannel;

      spChannel
        .on('broadcast', { event: 'TYPING_STATUS' }, (payload) => {
          const { userId, isTyping } = payload.payload || {};
          handleIncomingTyping(userId, isTyping);
        })
        .on('broadcast', { event: 'MARK_SEEN' }, (payload) => {
          const { readerId, seenAt } = payload.payload || {};
          if (readerId && readerId !== currentUser.uid) {
            const seenTime = seenAt || new Date().toISOString();
            setMessages(prev => prev.map(m => m.senderId !== readerId && !m.seen ? { ...m, seen: true, seenAt: seenTime } : m));
          }
        })
        .on('broadcast', { event: 'NEW_MESSAGE' }, (payload) => {
          const { msg } = payload.payload || {};
          if (msg && msg.senderId !== currentUser.uid) {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              sounds.playMessageReceivedSound();
              return [...prev, msg].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            });
          }
        })
        .subscribe();
    }

    return () => {
      bcChannel.close();
      typingChannelRef.current = null;
      if (spChatChannelRef.current) {
        supabase.removeChannel(spChatChannelRef.current);
        spChatChannelRef.current = null;
      }
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
    };
  }, [currentUser]);

  const setTypingStatus = (isTyping: boolean) => {
    if (!currentUser) return;
    try {
      typingChannelRef.current?.postMessage({ userId: currentUser.uid, isTyping });
    } catch {}

    if (spChatChannelRef.current) {
      try {
        spChatChannelRef.current.send({
          type: 'broadcast',
          event: 'TYPING_STATUS',
          payload: { userId: currentUser.uid, isTyping }
        });
      } catch {}
    }
  };

  // ── Burn disappearing messages ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      const toDelete = messages.filter(m =>
        m.isSecret && m.expiresAt && new Date(m.expiresAt).getTime() <= now
      );
      for (const m of toDelete) {
        if (isSupabaseConfigured()) {
          try { await supabase.from('messages').delete().eq('id', m.id); } catch {}
        }
        setMessages(prev => prev.filter(item => item.id !== m.id));
      }
      if (toDelete.length) sounds.playSecretBurnSound();
    }, 2000);
    return () => clearInterval(interval);
  }, [messages]);

  // ── Persist all state to LocalStorage ─────────────────────────────────────
  useEffect(() => { writeLS(LS_MSGS,  messages);  }, [messages]);
  useEffect(() => { writeLS(LS_MEMS,  memories);  }, [memories]);
  useEffect(() => { writeLS(LS_VAULT, vaultNotes); }, [vaultNotes]);
  useEffect(() => { writeLS(LS_CAL,   calendarEvents); }, [calendarEvents]);
  useEffect(() => { writeLS(LS_TODO,  todoItems);  }, [todoItems]);
  useEffect(() => { writeLS(LS_MAP,   mapPins);    }, [mapPins]);

  // ── Cross-tab Local Realtime Sync via BroadcastChannel ───────────────────
  useEffect(() => {
    const bc = new BroadcastChannel('ou_chat_sync');
    msgSyncChannelRef.current = bc;
    bc.onmessage = (e) => {
      if (e.data?.type === 'NEW_MESSAGE' && e.data.msg) {
        setMessages(prev => {
          if (prev.some(m => m.id === e.data.msg.id)) return prev;
          if (currentUser && e.data.msg.senderId !== currentUser.uid) {
            sounds.playMessageReceivedSound();
          }
          return [...prev, e.data.msg].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      } else if (e.data?.type === 'DELETE_MESSAGE' && e.data.id) {
        setMessages(prev => prev.filter(m => m.id !== e.data.id));
      } else if (e.data?.type === 'EDIT_MESSAGE' && e.data.id && e.data.content) {
        setMessages(prev => prev.map(m => m.id === e.data.id ? { ...m, content: e.data.content, isEdited: true } : m));
      } else if (e.data?.type === 'MARK_SEEN' && e.data.readerId) {
        const seenTime = e.data.seenAt || new Date().toISOString();
        setMessages(prev => prev.map(m => m.senderId !== e.data.readerId && !m.seen ? { ...m, seen: true, seenAt: seenTime } : m));
      }
    };
    return () => {
      bc.close();
      msgSyncChannelRef.current = null;
    };
  }, [currentUser]);

  // ── sendMessage → Supabase write ──────────────────────────────────────────
  const sendMessage = async (
    content: string,
    type: Message['type'] = 'text',
    mediaUrl?: string,
    replyToId?: string,
    isSecret?: boolean,
    secretTimeout = 60
  ) => {
    if (!currentUser) return;

    const replyToMsg = replyToId ? messages.find(m => m.id === replyToId) : undefined;
    const replyToObj = replyToMsg
      ? { id: replyToMsg.id, senderId: replyToMsg.senderId, excerpt: replyToMsg.content.substring(0, 40) }
      : null;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsgObj: Message = {
      id: tempId,
      senderId: currentUser.uid,
      type,
      content,
      mediaUrl: mediaUrl ?? undefined,
      replyTo: replyToObj ?? undefined,
      reactions: {},
      delivered: true,
      isSecret: isSecret ?? false,
      isStarred: false,
      expiresAt: isSecret ? new Date(Date.now() + secretTimeout * 1000).toISOString() : undefined,
      createdAt: new Date().toISOString()
    };

    // ⚡ Optimistic local UI update — instant 0ms rendering for sender
    setMessages(prev => [...prev, newMsgObj]);
    sounds.playMessageSentSound();
    try {
      msgSyncChannelRef.current?.postMessage({ type: 'NEW_MESSAGE', msg: newMsgObj });
    } catch {}

    if (spChatChannelRef.current) {
      try {
        spChatChannelRef.current.send({
          type: 'broadcast',
          event: 'NEW_MESSAGE',
          payload: { msg: newMsgObj }
        });
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').insert({
          id: tempId,
          chat_id: SHARED_CHAT_ID,
          sender_id: currentUser.uid,
          receiver_id: currentUser.uid === NAVEEN_UID ? HUMERA_UID : NAVEEN_UID,
          type,
          content,
          media_url: mediaUrl ?? null,
          reply_to: replyToObj ?? null,
          reactions: {},
          delivered: true,
          is_secret: isSecret ?? false,
          is_starred: false,
          expires_at: isSecret ? new Date(Date.now() + secretTimeout * 1000).toISOString() : null,
          created_at: new Date().toISOString()
        });
      } catch (err: any) {
        console.error('[Supabase] Insert failed:', err);
      }
    }
  };

  const deleteMessage = async (id: string, forEveryone = true) => {
    if (!forEveryone) return;
    setMessages(prev => prev.filter(m => m.id !== id));
    try { msgSyncChannelRef.current?.postMessage({ type: 'DELETE_MESSAGE', id }); } catch {}
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').delete().eq('id', id);
      } catch {}
    }
  };

  const editMessage = async (id: string, newContent: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg || !newContent.trim()) return;
    const content = newContent.trim();
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content, isEdited: true } : m));
    try { msgSyncChannelRef.current?.postMessage({ type: 'EDIT_MESSAGE', id, content }); } catch {}
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').update({ content, is_edited: true }).eq('id', id);
      } catch {}
    }
  };

  const markMessagesAsSeen = () => {
    if (!currentUser) return;
    const nowIso = new Date().toISOString();
    setMessages(prev => {
      const hasUnseen = prev.some(m => m.senderId !== currentUser.uid && !m.seen);
      if (!hasUnseen) return prev;
      return prev.map(m => m.senderId !== currentUser.uid ? { ...m, seen: true, seenAt: m.seenAt || nowIso } : m);
    });

    try {
      msgSyncChannelRef.current?.postMessage({
        type: 'MARK_SEEN',
        readerId: currentUser.uid,
        seenAt: nowIso
      });
    } catch {}

    if (spChatChannelRef.current) {
      try {
        spChatChannelRef.current.send({
          type: 'broadcast',
          event: 'MARK_SEEN',
          payload: { readerId: currentUser.uid, seenAt: nowIso }
        });
      } catch {}
    }

    if (isSupabaseConfigured()) {
      try {
        supabase.from('messages').update({ seen: true, seen_at: nowIso }).neq('sender_id', currentUser.uid).then(() => {});
      } catch {}
    }
  };

  const toggleStarMessage = async (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    const nextVal = !msg.isStarred;
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').update({ is_starred: nextVal }).eq('id', id);
      } catch {}
    }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isStarred: nextVal } : m));
  };

  const addReaction = async (id: string, emoji: string) => {
    if (!currentUser) return;
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    const cur = msg.reactions[emoji] ?? [];
    const has = cur.includes(currentUser.uid);
    const uids = has ? cur.filter(u => u !== currentUser.uid) : [...cur, currentUser.uid];
    const next = { ...msg.reactions };
    if (uids.length) next[emoji] = uids; else delete next[emoji];
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').update({ reactions: next }).eq('id', id);
      } catch {}
    }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, reactions: next } : m));
  };

  // ── Non-message helpers ────────────────────────────────────────────────────
  const addMemory = (mem: Omit<Memory, 'id' | 'createdAt'>) => {
    const n: Memory = { ...mem, id: `mem_${Date.now()}`, createdAt: new Date().toISOString() };
    setMemories(p => [n, ...p]);
  };
  const toggleFavoriteMemory = (id: string) => setMemories(p => p.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
  const addVaultNote = (note: Omit<VaultNote, 'id' | 'createdAt'>) => {
    const n: VaultNote = { ...note, id: `vault_${Date.now()}`, createdAt: new Date().toISOString() };
    setVaultNotes(p => [n, ...p]);
  };
  const deleteVaultNote = (id: string) => setVaultNotes(p => p.filter(v => v.id !== id));
  const addCalendarEvent = (evt: Omit<CalendarEvent, 'id'>) => setCalendar(p => [...p, { ...evt, id: `cal_${Date.now()}` }]);
  const addTodoItem = (title: string, category: SharedListItem['category']) => {
    if (!currentUser) return;
    setTodos(p => [...p, { id: `todo_${Date.now()}`, title, category, completed: false, addedBy: currentUser.uid }]);
  };
  const toggleTodoItem = (id: string) => setTodos(p => p.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t));
  const deleteTodoItem = (id: string) => setTodos(p => p.filter(t => t.id !== id));
  const addMapPin = (pin: Omit<LoveMapPin, 'id'>) => setMapPins(p => [...p, { ...pin, id: `pin_${Date.now()}` }]);

  const sendQuickAction = (type: QuickActionNotification['type']) => {
    if (!currentUser) return;
    setNotif({ id: `action_${Date.now()}`, senderId: currentUser.uid, type, timestamp: new Date().toISOString() });
    if (type === 'kiss')     { sounds.playKissSound();     confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }); }
    else if (type === 'hug')      sounds.playHugSound();
    else if (type === 'miss_you') sounds.playHeartbeatSound();
    else if (type === 'surprise') { sounds.playKissSound(); confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } }); }
    setTimeout(() => setNotif(null), 4000);
  };

  const startCall = (type: 'voice' | 'video') => { setCallActive(true); setCallType(type); sounds.playCallRingtone(); };
  const endCall   = () => { setCallActive(false); setCallType(null); };

  const importDatabaseBackup = (json: string): boolean => {
    try {
      const p = JSON.parse(json);
      if (p.memories)       setMemories(p.memories);
      if (p.vaultNotes)     setVaultNotes(p.vaultNotes);
      if (p.calendarEvents) setCalendar(p.calendarEvents);
      if (p.todoItems)      setTodos(p.todoItems);
      if (p.mapPins)        setMapPins(p.mapPins);
      return true;
    } catch { return false; }
  };

  return (
    <UniverseContext.Provider value={{
      ambientEffect, setAmbientEffect, anniversaryDate, setAnniversaryDate,
      messages, sendMessage, deleteMessage, editMessage, markMessagesAsSeen, toggleStarMessage, addReaction,
      isPartnerTyping, setTypingStatus,
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
