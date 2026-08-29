import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Message, Memory, VaultNote, CalendarEvent, SharedListItem,
  LoveMapPin, AmbientEffect, QuickActionNotification,
  Chat, UserProfile, FriendRequest, AppNotification, GameSession
} from '../types';
import { useAuth } from './AuthContext';
import { sounds } from '../lib/soundEffects';
import { toast } from '../lib/toast';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { chatApi, messageApi, friendApi, notificationApi, safetyApi } from '../lib/api';

// Local-only keys (fallback)
const LS_MEMS  = 'ou_shared_memories';
const LS_VAULT = 'ou_shared_vault';
const LS_CAL   = 'ou_shared_calendar';
const LS_TODO  = 'ou_shared_todos';
const LS_MAP   = 'ou_shared_mappins';

function readLS<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function writeLS(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

interface UniverseContextType {
  ambientEffect: AmbientEffect;
  setAmbientEffect: (e: AmbientEffect) => void;
  anniversaryDate: string;
  setAnniversaryDate: (d: string) => void;

  // Multi-Chat Architecture
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  setActiveChatId: (id: string) => void;
  startDirectChatWithUser: (partner: UserProfile) => Promise<string>;
  createGroupChat: (name: string, memberUids: string[], description?: string) => Promise<string>;
  refreshChats: () => Promise<void>;

  // Messaging in active chat
  messages: Message[];
  sendMessage: (content: string, type?: Message['type'], mediaUrl?: string, replyToId?: string, isSecret?: boolean, secretTimeout?: number, isViewOnce?: boolean) => Promise<void>;
  burnViewOnceMessage: (id: string) => Promise<void>;
  deleteMessage: (id: string, forEveryone?: boolean) => Promise<void>;
  editMessage: (id: string, newContent: string) => Promise<void>;
  markMessagesAsSeen: () => void;
  toggleStarMessage: (id: string) => void;
  addReaction: (id: string, emoji: string) => void;

  // Typing
  isPartnerTyping: boolean;
  setTypingStatus: (isTyping: boolean) => void;

  // Friends & Connections
  friends: UserProfile[];
  pendingFriendRequests: FriendRequest[];
  sendFriendRequest: (receiverId: string) => Promise<boolean>;
  respondFriendRequest: (requestId: string, status: 'accepted' | 'rejected') => Promise<void>;
  removeFriend: (friendUid: string) => Promise<void>;
  blockUser: (blockedUid: string) => Promise<void>;
  reportEntity: (targetId: string, targetType: 'user' | 'message' | 'group', reason: any, details?: string) => Promise<void>;
  refreshFriends: () => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationsAsRead: () => void;

  // Memories & Vault
  memories: Memory[];
  addMemory: (mem: Omit<Memory, 'id' | 'createdAt'>) => void;
  deleteMemory: (id: string) => void;
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
  deleteMapPin: (id: string) => void;

  importDatabaseBackup: (jsonContent: string) => boolean;

  recentNotification: QuickActionNotification | null;
  sendQuickAction: (type: QuickActionNotification['type']) => void;

  // Calls
  isCallActive: boolean;
  callType: 'voice' | 'video' | null;
  callRole: 'caller' | 'answerer' | null;
  incomingCall: { callerId: string; callerName: string; callerPhoto: string; callType: 'voice' | 'video' } | null;
  startCall: (type: 'voice' | 'video') => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;

  // Synchronized media
  syncedMediaUrl: string;
  setSyncedMediaUrl: (url: string) => void;
  isPlayingMedia: boolean;
  setIsPlayingMedia: (v: boolean) => void;
}

const UniverseContext = createContext<UniverseContextType | undefined>(undefined);

export const UniverseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, partnerUser, setPartnerUser } = useAuth();

  const [ambientEffect, setAmbientEffect] = useState<AmbientEffect>('galaxy');
  const [anniversaryDate, setAnniversaryDate] = useState<string>(() => {
    return localStorage.getItem('ou_anniversary_date') || '2024-02-14T00:00:00.000Z';
  });

  // ── Multi-Chat State ──
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // ── Friends & Notifications State ──
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // ── Memories, Vault, Calendar fallback ──
  const [memories, setMemories] = useState<Memory[]>(() => readLS(LS_MEMS, []));
  const [vaultNotes, setVaultNotes] = useState<VaultNote[]>(() => readLS(LS_VAULT, []));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => readLS(LS_CAL, []));
  const [todoItems, setTodoItems] = useState<SharedListItem[]>(() => readLS(LS_TODO, []));
  const [mapPins, setMapPins] = useState<LoveMapPin[]>(() => readLS(LS_MAP, []));

  // ── Quick Actions & WebRTC Calls ──
  const [recentNotification, setRecentNotification] = useState<QuickActionNotification | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callRole, setCallRole] = useState<'caller' | 'answerer' | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string; callerPhoto: string; callType: 'voice' | 'video' } | null>(null);

  const [syncedMediaUrl, setSyncedMediaUrl] = useState('');
  const [isPlayingMedia, setIsPlayingMedia] = useState(false);

  const spChatChannelRef = useRef<any>(null);
  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // ── Fetch Chats on login ──
  const refreshChats = useCallback(async () => {
    if (!currentUser) return;
    const userChats = await chatApi.getUserChats(currentUser.uid);
    setChats(userChats);

    // If no active chat selected yet, pick the first one or create direct with partnerUser
    if (!activeChatId && userChats.length > 0) {
      setActiveChatId(userChats[0].id);
    } else if (!activeChatId && partnerUser && partnerUser.uid !== currentUser.uid) {
      const direct = await chatApi.createOrGetDirectChat(currentUser, partnerUser);
      setChats([direct]);
      setActiveChatId(direct.id);
    }
  }, [currentUser, partnerUser, activeChatId]);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  // ── Fetch Friends & Notifications ──
  const refreshFriends = useCallback(async () => {
    if (!currentUser) return;
    const flist = await friendApi.getFriends(currentUser.uid);
    setFriends(flist);
    const preqs = await friendApi.getPendingRequests(currentUser.uid);
    setPendingFriendRequests(preqs);
    const notifs = await notificationApi.getNotifications(currentUser.uid);
    setNotifications(notifs);
  }, [currentUser]);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  // ── Personal Channel for Incoming Realtime Calls & Instant Alerts ──
  useEffect(() => {
    if (!currentUser || !isSupabaseConfigured()) return;

    const uChannel = supabase.channel(`ou_user_${currentUser.uid}`, {
      config: { broadcast: { self: false } }
    });

    uChannel
      .on('broadcast', { event: 'CALL_INCOMING' }, (payload: any) => {
        const callData = payload.payload;
        if (callData && callData.callerId !== currentUser.uid) {
          setIncomingCall({
            callerId: callData.callerId,
            callerName: callData.callerName || 'Friend',
            callerPhoto: callData.callerPhoto || '',
            callType: callData.callType || 'voice'
          });
          sounds.playCallRingtone();
        }
      })
      .on('broadcast', { event: 'CALL_ACCEPTED' }, (payload: any) => {
        const data = payload.payload;
        if (data && data.callerId === currentUser.uid) {
          setIsCallActive(true);
          setCallRole('caller');
          setCallType(data.callType);
          setIncomingCall(null);
        }
      })
      .on('broadcast', { event: 'CALL_DECLINED' }, () => {
        setIsCallActive(false);
        setCallRole(null);
        setCallType(null);
        setIncomingCall(null);
        toast.info('Call declined');
      })
      .on('broadcast', { event: 'CALL_ENDED' }, () => {
        setIsCallActive(false);
        setCallRole(null);
        setCallType(null);
        setIncomingCall(null);
        toast.info('Call ended');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(uChannel);
    };
  }, [currentUser]);

  // ── Load Messages for Active Chat ──
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    messageApi.getMessages(activeChatId).then(loadedMsgs => {
      if (isMounted) {
        setMessages(loadedMsgs);
      }
    });

    // Mark as seen
    if (currentUser) {
      messageApi.markAsSeen(activeChatId, currentUser.uid);
    }

    // Set partnerUser to the other participant in direct chats
    if (activeChat && activeChat.type === 'direct' && currentUser) {
      const otherUid = activeChat.participants.find(p => p !== currentUser.uid);
      if (otherUid && activeChat.participantDetails?.[otherUid]) {
        const pd = activeChat.participantDetails[otherUid];
        setPartnerUser({
          uid: pd.uid,
          username: pd.username,
          displayName: pd.displayName,
          email: `${pd.username}@ouruniverse.app`,
          photoURL: pd.photoURL,
          online: pd.online,
          lastSeen: pd.lastSeen
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [activeChatId, activeChat, currentUser, setPartnerUser]);

  // ── Realtime Listener for Active Chat ──
  useEffect(() => {
    if (!activeChatId || !isSupabaseConfigured()) return;

    if (spChatChannelRef.current) {
      supabase.removeChannel(spChatChannelRef.current);
    }

    const channel = supabase.channel(`ou_chat_${activeChatId}`, {
      config: { broadcast: { self: false } }
    });
    spChatChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'NEW_MESSAGE' }, (payload: any) => {
        const { message } = payload.payload || {};
        if (message && message.chatId === activeChatId) {
          setMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
          sounds.playMessageReceive();
          if (currentUser) {
            messageApi.markAsSeen(activeChatId, currentUser.uid);
          }
        }
      })
      .on('broadcast', { event: 'TYPING_STATUS' }, (payload: any) => {
        const { isTyping, senderId } = payload.payload || {};
        if (senderId !== currentUser?.uid) {
          setIsPartnerTyping(Boolean(isTyping));
        }
      })
      .on('broadcast', { event: 'DELETE_MESSAGE' }, (payload: any) => {
        const { id, forEveryone } = payload.payload || {};
        if (forEveryone) {
          setMessages(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
        }
      })
      .on('broadcast', { event: 'EDIT_MESSAGE' }, (payload: any) => {
        const { id, newContent } = payload.payload || {};
        setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent, isEdited: true } : m));
      })
      .on('broadcast', { event: 'REACTIONS_UPDATE' }, (payload: any) => {
        const { id, reactions } = payload.payload || {};
        setMessages(prev => prev.map(m => m.id === id ? { ...m, reactions } : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      spChatChannelRef.current = null;
    };
  }, [activeChatId, currentUser]);

  // ── Helper: Start direct chat with user ──
  const startDirectChatWithUser = async (partner: UserProfile): Promise<string> => {
    if (!currentUser) return '';
    const chat = await chatApi.createOrGetDirectChat(currentUser, partner);
    setChats(prev => {
      if (prev.some(c => c.id === chat.id)) return prev;
      return [chat, ...prev];
    });
    setActiveChatId(chat.id);
    setPartnerUser(partner);
    return chat.id;
  };

  // ── Helper: Create Group Chat ──
  const createGroupChat = async (name: string, memberUids: string[], description?: string): Promise<string> => {
    if (!currentUser) return '';
    const group = await chatApi.createGroupChat(currentUser, name, memberUids, description);
    setChats(prev => [group, ...prev]);
    setActiveChatId(group.id);
    toast.love(`Group "${name}" created! ✨`);
    return group.id;
  };

  // ── Send Message ──
  const sendMessage = async (
    content: string,
    type: Message['type'] = 'text',
    mediaUrl?: string,
    replyToId?: string,
    isSecret = false,
    secretTimeout = 60,
    isViewOnce = false
  ) => {
    if (!currentUser || !activeChatId) return;

    const replyToMsg = replyToId ? messages.find(m => m.id === replyToId) : undefined;
    const nowIso = new Date().toISOString();

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chatId: activeChatId,
      senderId: currentUser.uid,
      type,
      content,
      mediaUrl,
      replyTo: replyToMsg ? {
        id: replyToMsg.id,
        senderId: replyToMsg.senderId,
        excerpt: replyToMsg.content.slice(0, 80)
      } : undefined,
      reactions: {},
      delivered: true,
      isSecret,
      isViewOnce,
      expiresAt: isSecret ? new Date(Date.now() + secretTimeout * 1000).toISOString() : undefined,
      createdAt: nowIso
    };

    // Optimistic local update
    setMessages(prev => [...prev, newMsg]);
    sounds.playMessageSend();

    // Broadcast via Supabase Realtime
    if (spChatChannelRef.current) {
      try {
        spChatChannelRef.current.send({
          type: 'broadcast',
          event: 'NEW_MESSAGE',
          payload: { message: newMsg }
        }).catch(() => {});
      } catch (_) {}
    }

    // Persist to database
    await messageApi.sendMessage(newMsg);
  };

  const burnViewOnceMessage = async (id: string) => {
    if (!currentUser) return;
    setMessages(prev => prev.map(m => m.id === id ? { ...m, viewedOnce: true, content: 'Photo viewed 🔒' } : m));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').update({ is_view_once: true, viewed_by: [currentUser.uid], content: 'Photo viewed 🔒' }).eq('id', id);
      } catch (_) {}
    }
  };

  const deleteMessage = async (id: string, forEveryone = false) => {
    if (!currentUser) return;
    if (forEveryone) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
      if (spChatChannelRef.current) {
        spChatChannelRef.current.send({
          type: 'broadcast',
          event: 'DELETE_MESSAGE',
          payload: { id, forEveryone: true }
        }).catch(() => {});
      }
    } else {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
    await messageApi.deleteMessage(id, forEveryone, currentUser.uid);
  };

  const editMessage = async (id: string, newContent: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent, isEdited: true } : m));
    if (spChatChannelRef.current) {
      spChatChannelRef.current.send({
        type: 'broadcast',
        event: 'EDIT_MESSAGE',
        payload: { id, newContent }
      }).catch(() => {});
    }
    await messageApi.editMessage(id, newContent);
  };

  const markMessagesAsSeen = () => {
    if (!activeChatId || !currentUser) return;
    messageApi.markAsSeen(activeChatId, currentUser.uid);
    setMessages(prev => prev.map(m => m.senderId !== currentUser.uid ? { ...m, seen: true } : m));
  };

  const toggleStarMessage = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
  };

  const addReaction = (id: string, emoji: string) => {
    if (!currentUser) return;
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    const currentReactions = { ...(msg.reactions || {}) };
    const currentUsers = currentReactions[emoji] || [];
    const hasReacted = currentUsers.includes(currentUser.uid);

    if (hasReacted) {
      currentReactions[emoji] = currentUsers.filter(u => u !== currentUser.uid);
      if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
    } else {
      currentReactions[emoji] = [...currentUsers, currentUser.uid];
    }

    setMessages(prev => prev.map(m => m.id === id ? { ...m, reactions: currentReactions } : m));
    messageApi.updateReactions(id, currentReactions);

    if (spChatChannelRef.current) {
      spChatChannelRef.current.send({
        type: 'broadcast',
        event: 'REACTIONS_UPDATE',
        payload: { id, reactions: currentReactions }
      }).catch(() => {});
    }
  };

  const setTypingStatus = (isTyping: boolean) => {
    if (!currentUser || !spChatChannelRef.current) return;
    try {
      spChatChannelRef.current.send({
        type: 'broadcast',
        event: 'TYPING_STATUS',
        payload: { isTyping, senderId: currentUser.uid }
      }).catch(() => {});
    } catch (_) {}
  };

  // ── Friend Actions ──
  const sendFriendRequest = async (receiverId: string): Promise<boolean> => {
    if (!currentUser) return false;
    const ok = await friendApi.sendRequest(currentUser.uid, receiverId);
    if (ok) {
      toast.love('Friend request sent! ✨');
      refreshFriends();
    }
    return ok;
  };

  const respondFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    await friendApi.respondRequest(requestId, status);
    if (status === 'accepted') toast.love('Friend request accepted! 🎉');
    refreshFriends();
  };

  const removeFriend = async (friendUid: string) => {
    if (!currentUser) return;
    await friendApi.removeFriend(currentUser.uid, friendUid);
    toast.info('Friend removed');
    refreshFriends();
  };

  const blockUser = async (blockedUid: string) => {
    if (!currentUser) return;
    await safetyApi.blockUser(currentUser.uid, blockedUid);
    toast.info('User blocked');
    refreshFriends();
  };

  const reportEntity = async (targetId: string, targetType: 'user' | 'message' | 'group', reason: any, details?: string) => {
    if (!currentUser) return;
    await safetyApi.reportEntity({
      reporterId: currentUser.uid,
      targetId,
      targetType,
      reason,
      details
    });
    toast.success('Report submitted. Thank you for keeping Our Universe safe.');
  };

  const markNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationApi.markAllRead(currentUser.uid);
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // ── Memories, Vault, Calendar ──
  const addMemory = (mem: Omit<Memory, 'id' | 'createdAt'>) => {
    const newMem: Memory = {
      ...mem,
      id: `mem_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newMem, ...memories];
    setMemories(updated);
    writeLS(LS_MEMS, updated);
  };

  const deleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    writeLS(LS_MEMS, updated);
  };

  const toggleFavoriteMemory = (id: string) => {
    const updated = memories.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m);
    setMemories(updated);
    writeLS(LS_MEMS, updated);
  };

  const addVaultNote = (note: Omit<VaultNote, 'id' | 'createdAt'>) => {
    const newNote: VaultNote = {
      ...note,
      id: `note_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newNote, ...vaultNotes];
    setVaultNotes(updated);
    writeLS(LS_VAULT, updated);
  };

  const deleteVaultNote = (id: string) => {
    const updated = vaultNotes.filter(n => n.id !== id);
    setVaultNotes(updated);
    writeLS(LS_VAULT, updated);
  };

  const addCalendarEvent = (evt: Omit<CalendarEvent, 'id'>) => {
    const newEvt: CalendarEvent = { ...evt, id: `evt_${Date.now()}` };
    const updated = [...calendarEvents, newEvt];
    setCalendarEvents(updated);
    writeLS(LS_CAL, updated);
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
    const updated = [newItem, ...todoItems];
    setTodoItems(updated);
    writeLS(LS_TODO, updated);
  };

  const toggleTodoItem = (id: string) => {
    const updated = todoItems.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodoItems(updated);
    writeLS(LS_TODO, updated);
  };

  const deleteTodoItem = (id: string) => {
    const updated = todoItems.filter(t => t.id !== id);
    setTodoItems(updated);
    writeLS(LS_TODO, updated);
  };

  const addMapPin = (pin: Omit<LoveMapPin, 'id'>) => {
    const newPin: LoveMapPin = { ...pin, id: `pin_${Date.now()}` };
    const updated = [newPin, ...mapPins];
    setMapPins(updated);
    writeLS(LS_MAP, updated);
  };

  const deleteMapPin = (id: string) => {
    const updated = mapPins.filter(p => p.id !== id);
    setMapPins(updated);
    writeLS(LS_MAP, updated);
  };

  const sendQuickAction = (type: QuickActionNotification['type']) => {
    if (!currentUser) return;
    const notif: QuickActionNotification = {
      id: `qa_${Date.now()}`,
      senderId: currentUser.uid,
      type,
      timestamp: new Date().toISOString()
    };
    setRecentNotification(notif);
    if (type === 'kiss') {
      sounds.playKissSound();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
    setTimeout(() => setRecentNotification(null), 4000);
  };

  // Calls
  const startCall = (type: 'voice' | 'video') => {
    if (!currentUser) return;
    setIsCallActive(true);
    setCallType(type);
    setCallRole('caller');

    const targetUid = partnerUser?.uid;
    const callPayload = {
      callerId: currentUser.uid,
      callerName: currentUser.displayName || currentUser.username || 'User',
      callerPhoto: currentUser.photoURL || '',
      callType: type,
      chatId: activeChatId,
      targetUid: targetUid
    };

    if (isSupabaseConfigured()) {
      if (targetUid) {
        const targetChannel = supabase.channel(`ou_user_${targetUid}`);
        targetChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            targetChannel.send({
              type: 'broadcast',
              event: 'CALL_INCOMING',
              payload: callPayload
            }).catch(() => {});
          }
        });
      }

      if (spChatChannelRef.current) {
        spChatChannelRef.current.send({
          type: 'broadcast',
          event: 'CALL_INCOMING',
          payload: callPayload
        }).catch(() => {});
      }
    }
  };

  const acceptCall = () => {
    if (!incomingCall || !currentUser) return;
    setIsCallActive(true);
    setCallType(incomingCall.callType);
    setCallRole('answerer');

    const acceptPayload = {
      callerId: incomingCall.callerId,
      answererId: currentUser.uid,
      callType: incomingCall.callType
    };

    if (isSupabaseConfigured()) {
      const callerChannel = supabase.channel(`ou_user_${incomingCall.callerId}`);
      callerChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          callerChannel.send({
            type: 'broadcast',
            event: 'CALL_ACCEPTED',
            payload: acceptPayload
          }).catch(() => {});
        }
      });
    }

    setIncomingCall(null);
  };

  const declineCall = () => {
    if (incomingCall && isSupabaseConfigured()) {
      const callerChannel = supabase.channel(`ou_user_${incomingCall.callerId}`);
      callerChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          callerChannel.send({
            type: 'broadcast',
            event: 'CALL_DECLINED',
            payload: { callerId: incomingCall.callerId }
          }).catch(() => {});
        }
      });
    }
    setIncomingCall(null);
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallType(null);
    setCallRole(null);
    setIncomingCall(null);

    if (partnerUser && isSupabaseConfigured()) {
      const pChannel = supabase.channel(`ou_user_${partnerUser.uid}`);
      pChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          pChannel.send({
            type: 'broadcast',
            event: 'CALL_ENDED',
            payload: {}
          }).catch(() => {});
        }
      });
    }
  };

  const importDatabaseBackup = (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (Array.isArray(data.messages)) setMessages(data.messages);
      if (Array.isArray(data.memories)) setMemories(data.memories);
      if (Array.isArray(data.vaultNotes)) setVaultNotes(data.vaultNotes);
      if (Array.isArray(data.calendarEvents)) setCalendarEvents(data.calendarEvents);
      if (Array.isArray(data.todoItems)) setTodoItems(data.todoItems);
      if (Array.isArray(data.mapPins)) setMapPins(data.mapPins);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <UniverseContext.Provider value={{
      ambientEffect,
      setAmbientEffect,
      anniversaryDate,
      setAnniversaryDate,
      chats,
      activeChatId,
      activeChat,
      setActiveChatId,
      startDirectChatWithUser,
      createGroupChat,
      refreshChats,
      messages,
      sendMessage,
      burnViewOnceMessage,
      deleteMessage,
      editMessage,
      markMessagesAsSeen,
      toggleStarMessage,
      addReaction,
      isPartnerTyping,
      setTypingStatus,
      friends,
      pendingFriendRequests,
      sendFriendRequest,
      respondFriendRequest,
      removeFriend,
      blockUser,
      reportEntity,
      refreshFriends,
      notifications,
      unreadNotificationCount,
      markNotificationsAsRead,
      memories,
      addMemory,
      deleteMemory,
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
      deleteMapPin,
      importDatabaseBackup,
      recentNotification,
      sendQuickAction,
      isCallActive,
      callType,
      callRole,
      incomingCall,
      startCall,
      acceptCall,
      declineCall,
      endCall,
      syncedMediaUrl,
      setSyncedMediaUrl,
      isPlayingMedia,
      setIsPlayingMedia
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
