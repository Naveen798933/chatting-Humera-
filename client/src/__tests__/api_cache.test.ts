import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userApi, chatApi, messageApi, CACHE_KEYS } from '../lib/api';
import { UserProfile, Message } from '../types';

describe('API & Local Storage Durability Tests', () => {
  // Mock localStorage in test environment
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = String(value); },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
    });
  });

  describe('User Profile Caching', () => {
    const sampleUser: UserProfile = {
      uid: 'user_1',
      username: 'naveen_k',
      displayName: 'Naveen Kumar',
      email: 'naveen@ouruniverse.app',
      photoURL: 'https://avatar.com/naveen.png',
      online: true,
      bio: 'Creating something beautiful',
      city: 'Hyderabad'
    };

    it('should cache and retrieve user profile from local storage', () => {
      userApi.cacheProfile(sampleUser);
      const retrieved = userApi.getCachedProfile('user_1');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.displayName).toBe('Naveen Kumar');
      expect(retrieved?.city).toBe('Hyderabad');
    });

    it('should update profile when cached again with new details', () => {
      userApi.cacheProfile(sampleUser);
      const updatedUser = { ...sampleUser, bio: 'Updated bio here' };
      userApi.cacheProfile(updatedUser);

      const retrieved = userApi.getCachedProfile('user_1');
      expect(retrieved?.bio).toBe('Updated bio here');
    });
  });

  describe('Direct Chat ID Invariance', () => {
    it('should generate identical direct chat IDs regardless of user parameter order', () => {
      const id1 = chatApi.getDirectChatId('user_alpha', 'user_beta');
      const id2 = chatApi.getDirectChatId('user_beta', 'user_alpha');

      expect(id1).toBe(id2);
      expect(id1).toBe('direct_user_alpha_user_beta');
    });
  });

  describe('Chat Offline Persistence', () => {
    const userA: UserProfile = {
      uid: 'u_1',
      username: 'partner_1',
      displayName: 'Partner One',
      email: 'p1@universe.app',
      photoURL: 'https://avatar.com/p1.png'
    };

    const userB: UserProfile = {
      uid: 'u_2',
      username: 'partner_2',
      displayName: 'Partner Two',
      email: 'p2@universe.app',
      photoURL: 'https://avatar.com/p2.png'
    };

    it('should persist new direct chat to local storage', async () => {
      const chat = await chatApi.createOrGetDirectChat(userA, userB);
      expect(chat.id).toBe('direct_u_1_u_2');

      const cachedRaw = localStorage.getItem(CACHE_KEYS.CHATS);
      expect(cachedRaw).not.toBeNull();
      const cachedList = JSON.parse(cachedRaw!);
      expect(cachedList).toHaveLength(1);
      expect(cachedList[0].id).toBe('direct_u_1_u_2');
      expect(cachedList[0].participants).toContain('u_1');
      expect(cachedList[0].participants).toContain('u_2');
    });
  });

  describe('Message Offline Caching & Last Message Sync', () => {
    const chatId = 'direct_u_1_u_2';
    const msg: Message = {
      id: 'msg_101',
      chatId,
      senderId: 'u_1',
      receiverId: 'u_2',
      type: 'text',
      content: 'Good morning my star! 🌟',
      reactions: {},
      delivered: true,
      createdAt: new Date().toISOString()
    };

    it('should save sent message to local messages cache', async () => {
      await messageApi.sendMessage(msg);

      const cached = localStorage.getItem(CACHE_KEYS.MESSAGES_PREFIX + chatId);
      expect(cached).not.toBeNull();
      const msgs = JSON.parse(cached!);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].id).toBe('msg_101');
      expect(msgs[0].content).toBe('Good morning my star! 🌟');
    });

    it('should update last message in cached chats when message is sent', async () => {
      // Pre-seed chat in local storage
      const initialChat = {
        id: chatId,
        type: 'direct',
        participants: ['u_1', 'u_2'],
        lastMessage: 'Started',
        lastMessageAt: '2026-01-01T00:00:00.000Z'
      };
      localStorage.setItem(CACHE_KEYS.CHATS, JSON.stringify([initialChat]));

      await messageApi.sendMessage(msg);

      const chatsRaw = localStorage.getItem(CACHE_KEYS.CHATS);
      const chats = JSON.parse(chatsRaw!);
      expect(chats[0].lastMessage).toBe('Good morning my star! 🌟');
      expect(chats[0].lastSenderId).toBe('u_1');
    });
  });
});
