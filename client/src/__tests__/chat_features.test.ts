import { describe, it, expect } from 'vitest';
import { Message } from '../types';

describe('Chat Logic & State Invariants', () => {
  describe('View-Once Burning Invariant', () => {
    it('should completely purge mediaUrl and set viewedOnce when burned', () => {
      const activeViewOnceMsg: Message = {
        id: 'vo_1',
        chatId: 'chat_1',
        senderId: 'user_a',
        receiverId: 'user_b',
        type: 'image',
        content: 'View once photo',
        mediaUrl: 'blob:https://ouruniverse.app/temp-secret-photo-uuid',
        reactions: {},
        delivered: true,
        isViewOnce: true,
        viewedOnce: false,
        createdAt: new Date().toISOString()
      };

      // Burning function
      const burn = (msg: Message): Message => ({
        ...msg,
        viewedOnce: true,
        mediaUrl: undefined,
        content: 'Photo viewed 🔒'
      });

      const burned = burn(activeViewOnceMsg);

      expect(burned.viewedOnce).toBe(true);
      expect(burned.mediaUrl).toBeUndefined();
      expect(burned.content).toBe('Photo viewed 🔒');
      expect(burned.isViewOnce).toBe(true);
    });
  });

  describe('Interactive Message Reactions', () => {
    function toggleReaction(
      reactions: Record<string, string[]> | undefined,
      emoji: string,
      userId: string
    ): Record<string, string[]> {
      const current = { ...(reactions || {}) };
      const currentUsers = current[emoji] || [];
      const hasReacted = currentUsers.includes(userId);

      if (hasReacted) {
        current[emoji] = currentUsers.filter(u => u !== userId);
        if (current[emoji].length === 0) {
          delete current[emoji];
        }
      } else {
        current[emoji] = [...currentUsers, userId];
      }
      return current;
    }

    it('should add a new reaction from a user', () => {
      const initialReactions = {};
      const updated = toggleReaction(initialReactions, '❤️', 'user_1');

      expect(updated['❤️']).toBeDefined();
      expect(updated['❤️']).toEqual(['user_1']);
    });

    it('should allow multiple different users to react with the same emoji', () => {
      const r1 = toggleReaction({}, '🔥', 'user_1');
      const r2 = toggleReaction(r1, '🔥', 'user_2');

      expect(r2['🔥']).toEqual(['user_1', 'user_2']);
    });

    it('should remove the reaction when the user clicks the same emoji again (toggle off)', () => {
      const r1 = toggleReaction({}, '💖', 'user_1');
      const r2 = toggleReaction(r1, '💖', 'user_1');

      expect(r2['💖']).toBeUndefined();
      expect(Object.keys(r2)).toHaveLength(0);
    });
  });

  describe('Secret Self-Destruct Expiration', () => {
    it('should determine if a secret message is expired', () => {
      const now = Date.now();
      const pastMsg: Message = {
        id: 'sec_1',
        chatId: 'c1',
        senderId: 'u1',
        type: 'text',
        content: 'Secret message',
        reactions: {},
        delivered: true,
        isSecret: true,
        expiresAt: new Date(now - 10000).toISOString(),
        createdAt: new Date(now - 20000).toISOString()
      };

      const futureMsg: Message = {
        id: 'sec_2',
        chatId: 'c1',
        senderId: 'u1',
        type: 'text',
        content: 'Still valid secret',
        reactions: {},
        delivered: true,
        isSecret: true,
        expiresAt: new Date(now + 60000).toISOString(),
        createdAt: new Date(now).toISOString()
      };

      const isExpired = (m: Message) => Boolean(m.expiresAt && new Date(m.expiresAt).getTime() < Date.now());

      expect(isExpired(pastMsg)).toBe(true);
      expect(isExpired(futureMsg)).toBe(false);
    });
  });
});
