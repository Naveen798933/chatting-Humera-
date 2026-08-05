import { useEffect } from 'react';

/**
 * Auto-Logout Hook: automatically triggers logout callback after 15 minutes of inactivity
 */
export function useInactivityLogout(onLogout: () => void, timeoutMinutes: number = 15) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        onLogout();
      }, timeoutMinutes * 60 * 1000);
    };

    let lastReset = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset > 2000) {
        lastReset = now;
        resetTimer();
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [onLogout, timeoutMinutes]);
}
