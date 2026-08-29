import { supabase, isSupabaseConfigured } from './supabase';
import {
  UserProfile,
  Chat,
  Message,
  FriendRequest,
  AppNotification,
  GameSession,
  UserBlock,
  UserReport,
  UserUid
} from '../types';

// ============================================================================
// Local Storage Cache Keys
// ============================================================================
const CACHE_KEYS = {
  PROFILES: 'ou_profiles_cache',
  CHATS: 'ou_chats_cache',
  MESSAGES_PREFIX: 'ou_messages_cache_',
  FRIENDS: 'ou_friends_cache',
  NOTIFICATIONS: 'ou_notifications_cache',
  GAMES: 'ou_games_cache',
  BLOCKS: 'ou_blocks_cache'
};

// ============================================================================
// User Profile API
// ============================================================================
export const userApi = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();

        if (data && !error) {
          const profile: UserProfile = {
            uid: data.id,
            username: data.username,
            displayName: data.display_name,
            email: data.email,
            photoURL: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.display_name)}&background=ff70a6&color=fff`,
            bio: data.bio || '',
            role: data.role || 'user',
            online: data.is_online,
            lastSeen: data.last_seen,
            privacySettings: data.privacy_settings,
            createdAt: data.created_at
          };
          // Update cache
          userApi.cacheProfile(profile);
          return profile;
        }
      } catch (err) {
        console.warn('[UserAPI] getProfile error, reading cache:', err);
      }
    }
    // Fallback to local cache
    return userApi.getCachedProfile(uid);
  },

  async upsertProfile(profile: UserProfile): Promise<boolean> {
    userApi.cacheProfile(profile);
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: profile.uid,
          username: profile.username,
          username_lower: profile.username.toLowerCase(),
          display_name: profile.displayName,
          email: profile.email,
          avatar_url: profile.photoURL,
          bio: profile.bio || '',
          role: profile.role || 'user',
          is_online: profile.online ?? true,
          last_seen: new Date().toISOString(),
          privacy_settings: profile.privacySettings || {
            whoCanMessage: 'everyone',
            whoCanAdd: 'everyone',
            showOnline: true,
            showReadReceipts: true,
            showLastSeen: true,
            whoCanSeeProfile: 'everyone'
          },
          updated_at: new Date().toISOString()
        });
        if (error) {
          console.error('[UserAPI] upsertProfile error:', error);
          return false;
        }
        return true;
      } catch (err) {
        console.error('[UserAPI] upsertProfile exception:', err);
        return false;
      }
    }
    return true;
  },

  async searchUsers(query: string, currentUid?: string): Promise<UserProfile[]> {
    const q = query.trim().toLowerCase().replace(/^@/, '');
    if (!q) return [];

    let results: UserProfile[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`username_lower.ilike.%${q}%,display_name.ilike.%${q}%`)
          .limit(20);

        if (data && !error) {
          results = data
            .filter(d => d.id !== currentUid)
            .map(d => ({
              uid: d.id,
              username: d.username,
              displayName: d.display_name,
              email: d.email,
              photoURL: d.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.display_name)}&background=ff70a6&color=fff`,
              bio: d.bio || '',
              online: d.is_online,
              lastSeen: d.last_seen,
              privacySettings: d.privacy_settings
            }));
        }
      } catch (err) {
        console.warn('[UserAPI] searchUsers network error:', err);
      }
    }

    // Merge with local cached profiles if remote is empty/offline
    if (results.length === 0) {
      const cached = userApi.getAllCachedProfiles();
      results = cached.filter(p =>
        p.uid !== currentUid &&
        (p.username.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q))
      );
    }

    return results;
  },

  async isUsernameAvailable(username: string, excludeUid?: string): Promise<boolean> {
    const u = username.trim().toLowerCase();
    if (u.length < 3) return false;

    if (isSupabaseConfigured()) {
      try {
        const query = supabase
          .from('profiles')
          .select('id')
          .eq('username_lower', u);

        if (excludeUid) {
          query.neq('id', excludeUid);
        }

        const { data } = await query;
        return !data || data.length === 0;
      } catch {
        return true;
      }
    }
    return true;
  },

  cacheProfile(profile: UserProfile) {
    try {
      const all = userApi.getAllCachedProfiles();
      const existingIdx = all.findIndex(p => p.uid === profile.uid);
      if (existingIdx >= 0) {
        all[existingIdx] = profile;
      } else {
        all.push(profile);
      }
      localStorage.setItem(CACHE_KEYS.PROFILES, JSON.stringify(all));
    } catch (_) {}
  },

  getCachedProfile(uid: string): UserProfile | null {
    try {
      const all = userApi.getAllCachedProfiles();
      return all.find(p => p.uid === uid) || null;
    } catch {
      return null;
    }
  },

  getAllCachedProfiles(): UserProfile[] {
    try {
      const s = localStorage.getItem(CACHE_KEYS.PROFILES);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  }
};

// ============================================================================
// Friend Requests & Relationships API
// ============================================================================
export const friendApi = {
  async getFriends(uid: string): Promise<UserProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('friend_requests')
          .select('sender_id, receiver_id, status')
          .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
          .eq('status', 'accepted');

        if (data && !error) {
          const friendUids = data.map(r => r.sender_id === uid ? r.receiver_id : r.sender_id);
          if (friendUids.length === 0) return [];

          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', friendUids);

          if (profiles) {
            return profiles.map(p => ({
              uid: p.id,
              username: p.username,
              displayName: p.display_name,
              email: p.email,
              photoURL: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name)}&background=ff70a6&color=fff`,
              bio: p.bio,
              online: p.is_online,
              lastSeen: p.last_seen
            }));
          }
        }
      } catch (err) {
        console.warn('[FriendAPI] getFriends error:', err);
      }
    }
    // Fallback cache
    try {
      const s = localStorage.getItem(CACHE_KEYS.FRIENDS);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  },

  async getPendingRequests(uid: string): Promise<FriendRequest[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('receiver_id', uid)
          .eq('status', 'pending');

        if (data && !error) {
          const senderIds = data.map(r => r.sender_id);
          const { data: senderProfiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', senderIds);

          const profileMap = new Map((senderProfiles || []).map(p => [p.id, p]));

          return data.map(r => {
            const sp = profileMap.get(r.sender_id);
            return {
              id: r.id,
              senderId: r.sender_id,
              senderProfile: sp ? {
                uid: sp.id,
                username: sp.username,
                displayName: sp.display_name,
                email: sp.email,
                photoURL: sp.avatar_url
              } : undefined,
              receiverId: r.receiver_id,
              status: r.status,
              createdAt: r.created_at,
              updatedAt: r.updated_at
            };
          });
        }
      } catch (err) {
        console.warn('[FriendAPI] getPendingRequests error:', err);
      }
    }
    return [];
  },

  async sendRequest(senderId: string, receiverId: string): Promise<boolean> {
    if (senderId === receiverId) return false;
    const reqId = `freq_${[senderId, receiverId].sort().join('_')}`;

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('friend_requests').upsert({
          id: reqId,
          sender_id: senderId,
          receiver_id: receiverId,
          status: 'pending',
          updated_at: new Date().toISOString()
        });

        // Also create notification
        await notificationApi.createNotification({
          id: `notif_${Date.now()}`,
          recipientId: receiverId,
          senderId: senderId,
          type: 'friend_request',
          read: false,
          createdAt: new Date().toISOString()
        });

        return !error;
      } catch {
        return false;
      }
    }
    return true;
  },

  async respondRequest(reqId: string, status: 'accepted' | 'rejected'): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('friend_requests')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', reqId);
        return !error;
      } catch {
        return false;
      }
    }
    return true;
  },

  async removeFriend(uid1: string, uid2: string): Promise<boolean> {
    const reqId = `freq_${[uid1, uid2].sort().join('_')}`;
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('friend_requests').delete().eq('id', reqId);
        return !error;
      } catch {
        return false;
      }
    }
    return true;
  }
};

// ============================================================================
// Chats & Groups API
// ============================================================================
export const chatApi = {
  getDirectChatId(uid1: string, uid2: string): string {
    return `direct_${[uid1, uid2].sort().join('_')}`;
  },

  async getUserChats(uid: string): Promise<Chat[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .contains('participants', [uid])
          .order('last_message_at', { ascending: false });

        if (data && !error) {
          // Fetch participant profiles
          const allParticipantUids = Array.from(new Set(data.flatMap(c => c.participants || [])));
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', allParticipantUids);

          const profileMap = new Map((profiles || []).map(p => [p.id, {
            uid: p.id,
            displayName: p.display_name,
            username: p.username,
            photoURL: p.avatar_url,
            online: p.is_online,
            lastSeen: p.last_seen
          }]));

          const chats: Chat[] = data.map(c => {
            const details: Record<string, any> = {};
            (c.participants || []).forEach((pid: string) => {
              if (profileMap.has(pid)) {
                details[pid] = profileMap.get(pid);
              }
            });

            return {
              id: c.id,
              type: c.type || 'direct',
              name: c.name,
              description: c.description,
              photoURL: c.photo_url,
              ownerId: c.owner_id,
              admins: c.admins || [],
              participants: c.participants || [],
              participantDetails: details,
              lastMessage: c.last_message,
              lastMessageAt: c.last_message_at,
              lastSenderId: c.last_sender_id,
              createdAt: c.created_at,
              updatedAt: c.updated_at
            };
          });

          // Update cache
          try { localStorage.setItem(CACHE_KEYS.CHATS, JSON.stringify(chats)); } catch (_) {}
          return chats;
        }
      } catch (err) {
        console.warn('[ChatAPI] getUserChats error:', err);
      }
    }
    // Fallback cache
    try {
      const s = localStorage.getItem(CACHE_KEYS.CHATS);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  },

  async createOrGetDirectChat(currentUser: UserProfile, partnerUser: UserProfile): Promise<Chat> {
    const chatId = chatApi.getDirectChatId(currentUser.uid, partnerUser.uid);
    const existing = (await chatApi.getUserChats(currentUser.uid)).find(c => c.id === chatId);
    if (existing) return existing;

    const newChat: Chat = {
      id: chatId,
      type: 'direct',
      participants: [currentUser.uid, partnerUser.uid],
      participantDetails: {
        [currentUser.uid]: {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          username: currentUser.username,
          photoURL: currentUser.photoURL,
          online: currentUser.online
        },
        [partnerUser.uid]: {
          uid: partnerUser.uid,
          displayName: partnerUser.displayName,
          username: partnerUser.username,
          photoURL: partnerUser.photoURL,
          online: partnerUser.online
        }
      },
      lastMessage: 'Conversation started',
      lastMessageAt: new Date().toISOString(),
      lastSenderId: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('chats').upsert({
          id: chatId,
          type: 'direct',
          participants: [currentUser.uid, partnerUser.uid],
          last_message: newChat.lastMessage,
          last_message_at: newChat.lastMessageAt,
          last_sender_id: currentUser.uid,
          updated_at: new Date().toISOString()
        });
      } catch (_) {}
    }

    return newChat;
  },

  async createGroupChat(
    owner: UserProfile,
    name: string,
    memberUids: string[],
    description?: string,
    photoURL?: string
  ): Promise<Chat> {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const participants = Array.from(new Set([owner.uid, ...memberUids]));

    const newGroup: Chat = {
      id: groupId,
      type: 'group',
      name,
      description: description || '',
      photoURL: photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff`,
      ownerId: owner.uid,
      admins: [owner.uid],
      participants,
      lastMessage: `${owner.displayName} created the group "${name}"`,
      lastMessageAt: new Date().toISOString(),
      lastSenderId: owner.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('chats').insert({
          id: groupId,
          type: 'group',
          name,
          description: newGroup.description,
          photo_url: newGroup.photoURL,
          owner_id: owner.uid,
          admins: [owner.uid],
          participants,
          last_message: newGroup.lastMessage,
          last_message_at: newGroup.lastMessageAt,
          last_sender_id: owner.uid
        });

        // Notify added members
        memberUids.forEach(mUid => {
          notificationApi.createNotification({
            id: `notif_${Date.now()}_${mUid}`,
            recipientId: mUid,
            senderId: owner.uid,
            type: 'group_invite',
            data: { groupId, groupName: name },
            read: false,
            createdAt: new Date().toISOString()
          });
        });
      } catch (_) {}
    }

    return newGroup;
  }
};

// ============================================================================
// Messages API
// ============================================================================
export const messageApi = {
  async getMessages(chatId: string, limit = 100): Promise<Message[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })
          .limit(limit);

        if (data && !error) {
          const msgs: Message[] = data.map(m => ({
            id: m.id,
            chatId: m.chat_id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            type: m.type,
            content: m.content,
            mediaUrl: m.media_url,
            mediaName: m.media_name,
            replyTo: m.reply_to,
            reactions: m.reactions || {},
            delivered: m.delivered,
            pinned: m.pinned,
            isSecret: m.is_secret,
            isViewOnce: m.is_view_once,
            viewedBy: m.viewed_by || [],
            viewedOnce: (m.viewed_by || []).length > 0,
            deletedFor: m.deleted_for || [],
            isDeleted: m.is_deleted,
            isStarred: m.is_starred,
            isEdited: m.is_edited,
            seen: m.seen,
            seenAt: m.seen_at,
            expiresAt: m.expires_at,
            createdAt: m.created_at
          }));

          try {
            localStorage.setItem(CACHE_KEYS.MESSAGES_PREFIX + chatId, JSON.stringify(msgs));
          } catch (_) {}

          return msgs;
        }
      } catch (err) {
        console.warn('[MessageAPI] getMessages error:', err);
      }
    }
    // Fallback cache
    try {
      const s = localStorage.getItem(CACHE_KEYS.MESSAGES_PREFIX + chatId);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  },

  async sendMessage(msg: Message): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('messages').insert({
          id: msg.id,
          chat_id: msg.chatId,
          sender_id: msg.senderId,
          receiver_id: msg.receiverId,
          type: msg.type,
          content: msg.content,
          media_url: msg.mediaUrl,
          media_name: msg.mediaName,
          reply_to: msg.replyTo,
          reactions: msg.reactions || {},
          delivered: true,
          pinned: msg.pinned || false,
          is_secret: msg.isSecret || false,
          is_view_once: msg.isViewOnce || false,
          viewed_by: msg.viewedBy || [],
          is_starred: msg.isStarred || false,
          expires_at: msg.expiresAt,
          created_at: msg.createdAt
        });

        // Also update chat's last_message
        if (msg.chatId) {
          await supabase.from('chats').update({
            last_message: msg.type === 'text' ? msg.content : `[${msg.type.toUpperCase()}]`,
            last_message_at: msg.createdAt,
            last_sender_id: msg.senderId,
            updated_at: new Date().toISOString()
          }).eq('id', msg.chatId);
        }

        return !error;
      } catch (err) {
        console.error('[MessageAPI] sendMessage error:', err);
        return false;
      }
    }
    return true;
  },

  async updateReactions(msgId: string, reactions: Record<string, string[]>): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').update({ reactions }).eq('id', msgId);
      } catch (_) {}
    }
  },

  async editMessage(msgId: string, newContent: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('messages')
          .update({ content: newContent, is_edited: true })
          .eq('id', msgId);
      } catch (_) {}
    }
  },

  async deleteMessage(msgId: string, forEveryone = false, currentUid?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        if (forEveryone) {
          await supabase
            .from('messages')
            .update({ is_deleted: true, content: 'This message was deleted' })
            .eq('id', msgId);
        } else if (currentUid) {
          const { data } = await supabase.from('messages').select('deleted_for').eq('id', msgId).single();
          const list = Array.from(new Set([...(data?.deleted_for || []), currentUid]));
          await supabase.from('messages').update({ deleted_for: list }).eq('id', msgId);
        }
      } catch (_) {}
    }
  },

  async markAsSeen(chatId: string, currentUid: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const nowIso = new Date().toISOString();
        await supabase
          .from('messages')
          .update({ seen: true, seen_at: nowIso })
          .eq('chat_id', chatId)
          .neq('sender_id', currentUid);
      } catch (_) {}
    }
  }
};

// ============================================================================
// Notifications API
// ============================================================================
export const notificationApi = {
  async getNotifications(uid: string): Promise<AppNotification[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', uid)
          .order('created_at', { ascending: false })
          .limit(50);

        if (data && !error) {
          const senderIds = Array.from(new Set(data.map(n => n.sender_id)));
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', senderIds);

          const pMap = new Map((profiles || []).map(p => [p.id, p]));

          return data.map(n => {
            const sp = pMap.get(n.sender_id);
            return {
              id: n.id,
              recipientId: n.recipient_id,
              senderId: n.sender_id,
              senderProfile: sp ? {
                uid: sp.id,
                username: sp.username,
                displayName: sp.display_name,
                photoURL: sp.avatar_url
              } : undefined,
              type: n.type,
              data: n.data || {},
              read: n.read,
              createdAt: n.created_at
            };
          });
        }
      } catch (_) {}
    }
    return [];
  },

  async createNotification(notif: AppNotification): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notifications').insert({
          id: notif.id,
          recipient_id: notif.recipientId,
          sender_id: notif.senderId,
          type: notif.type,
          data: notif.data || {},
          read: notif.read,
          created_at: notif.createdAt
        });
      } catch (_) {}
    }
  },

  async markAllRead(uid: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('recipient_id', uid);
      } catch (_) {}
    }
  }
};

// ============================================================================
// Multiplayer Game Sessions API
// ============================================================================
export const gameApi = {
  async createInvite(gameType: 'tictactoe' | 'rps' | 'quiz', player1: UserProfile, player2: UserProfile): Promise<GameSession> {
    const sessionId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const session: GameSession = {
      id: sessionId,
      gameType,
      player1Id: player1.uid,
      player2Id: player2.uid,
      player1Profile: player1,
      player2Profile: player2,
      status: 'pending',
      currentTurn: player1.uid,
      boardState: gameType === 'tictactoe' ? Array(9).fill(null) : {},
      scores: { player1: 0, player2: 0, draws: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('game_sessions').insert({
          id: sessionId,
          game_type: gameType,
          player1_id: player1.uid,
          player2_id: player2.uid,
          status: 'pending',
          current_turn: player1.uid,
          board_state: session.boardState,
          scores: session.scores,
          created_at: session.createdAt,
          updated_at: session.updatedAt
        });

        // Notify recipient
        await notificationApi.createNotification({
          id: `notif_game_${Date.now()}`,
          recipientId: player2.uid,
          senderId: player1.uid,
          type: 'game_invite',
          data: { gameId: sessionId, gameType },
          read: false,
          createdAt: new Date().toISOString()
        });
      } catch (_) {}
    }

    return session;
  },

  async respondInvite(sessionId: string, status: 'active' | 'declined'): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('game_sessions')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', sessionId);
      } catch (_) {}
    }
  },

  async updateGameState(sessionId: string, boardState: any, nextTurn: string, winnerId?: string | 'draw' | null, scores?: any): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const updateObj: any = {
          board_state: boardState,
          current_turn: nextTurn,
          updated_at: new Date().toISOString()
        };
        if (winnerId !== undefined) updateObj.winner_id = winnerId;
        if (scores !== undefined) updateObj.scores = scores;

        await supabase.from('game_sessions').update(updateObj).eq('id', sessionId);
      } catch (_) {}
    }
  }
};

// ============================================================================
// Moderation & Safety API
// ============================================================================
export const safetyApi = {
  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    const id = `block_${blockerId}_${blockedId}`;
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('user_blocks').upsert({
          id,
          blocker_id: blockerId,
          blocked_id: blockedId
        });
        return !error;
      } catch {
        return false;
      }
    }
    return true;
  },

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', blockerId)
          .eq('blocked_id', blockedId);
        return !error;
      } catch {
        return false;
      }
    }
    return true;
  },

  async reportEntity(report: Omit<UserReport, 'id' | 'createdAt' | 'status'>): Promise<boolean> {
    const id = `report_${Date.now()}`;
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('user_reports').insert({
          id,
          reporter_id: report.reporterId,
          target_id: report.targetId,
          target_type: report.targetType,
          reason: report.reason,
          details: report.details || '',
          status: 'pending'
        });
        return !error;
      } catch {
        return false;
      }
    }
    return true;
  }
};
