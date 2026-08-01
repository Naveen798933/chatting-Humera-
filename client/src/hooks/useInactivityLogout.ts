import { useEffect } from 'react';

/**
 * Auto-Logout Hook: automatically triggers logout callback after 15 minutes of inactivity
 */
export function useInactivityLogout(onLogout: () => void, timeoutMinutes: number = 15) {
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        onLogout();
      }, timeoutMinutes * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [onLogout, timeoutMinutes]);
}
