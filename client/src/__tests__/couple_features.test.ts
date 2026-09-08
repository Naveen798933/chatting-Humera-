import { describe, it, expect } from 'vitest';
import { differenceInDays, addYears, isAfter } from 'date-fns';

describe('Couple Milestones & Relationship Counters', () => {
  describe('Days Together Calculation', () => {
    it('should accurately calculate days since anniversary date', () => {
      const startDate = new Date('2024-02-14T00:00:00.000Z');
      const targetDate = new Date('2024-02-24T00:00:00.000Z');

      const days = differenceInDays(targetDate, startDate);
      expect(days).toBe(10);
    });

    it('should compute next annual milestone correctly', () => {
      const anniversary = new Date('2024-02-14T00:00:00.000Z');
      const testToday = new Date('2024-05-01T00:00:00.000Z');

      // Next anniversary will be 2025-02-14
      let nextAnniversary = new Date(testToday.getFullYear(), anniversary.getMonth(), anniversary.getDate());
      if (isAfter(testToday, nextAnniversary)) {
        nextAnniversary = addYears(nextAnniversary, 1);
      }

      expect(nextAnniversary.getFullYear()).toBe(2025);
      expect(nextAnniversary.getMonth()).toBe(1); // February is index 1
      expect(nextAnniversary.getDate()).toBe(14);
    });
  });

  describe('Relationship Streak Logic', () => {
    it('should increment streak when consecutive daily check-ins occur', () => {
      let streak = 42;
      const lastCheckIn = '2026-09-07';
      const today = '2026-09-08';

      const isConsecutive = (last: string, curr: string) => {
        const diff = differenceInDays(new Date(curr), new Date(last));
        return diff === 1;
      };

      if (isConsecutive(lastCheckIn, today)) {
        streak += 1;
      }

      expect(streak).toBe(43);
    });

    it('should reset streak when more than 1 day is missed', () => {
      let streak = 42;
      const lastCheckIn = '2026-09-05';
      const today = '2026-09-08';

      const diff = differenceInDays(new Date(today), new Date(lastCheckIn));
      if (diff > 1) {
        streak = 1;
      }

      expect(streak).toBe(1);
    });
  });
});
