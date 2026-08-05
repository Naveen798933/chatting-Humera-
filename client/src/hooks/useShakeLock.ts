import { useEffect, useRef } from 'react';

/**
 * Mobile Shake-to-Lock Hook
 * Requires deliberate physical shake motion (excludes gravity noise to prevent false triggers)
 */
export function useShakeLock(onShake: () => void) {
  const lastTimeRef = useRef<number>(Date.now());
  const shakeCountRef = useRef<number>(0);
  const cooldownRef = useRef<boolean>(false);

  useEffect(() => {
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      if (cooldownRef.current) return;

      // Prefer linear acceleration (excluding gravity) to prevent false gravity triggers
      const acc = e.acceleration || e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const now = Date.now();
      const timeDiff = now - lastTimeRef.current;

      if (timeDiff > 120) {
        // Calculate G-force vector magnitude
        const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

        // A real physical shake generates > 28 m/s² acceleration spike!
        if (magnitude > 28) {
          shakeCountRef.current += 1;

          // Require 2 consecutive strong shake motions within 800ms
          if (shakeCountRef.current >= 2) {
            cooldownRef.current = true;
            shakeCountRef.current = 0;
            onShake();

            setTimeout(() => {
              cooldownRef.current = false;
            }, 3000);
          }
        } else {
          // Reset shake counter if motion subsides
          if (timeDiff > 800) {
            shakeCountRef.current = 0;
          }
        }

        lastTimeRef.current = now;
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [onShake]);
}
