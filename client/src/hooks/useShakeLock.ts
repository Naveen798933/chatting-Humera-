import { useEffect, useRef } from 'react';

/**
 * Mobile Shake-to-Lock Hook
 * Triggers callback when rapid physical device motion/acceleration is detected
 */
export function useShakeLock(onShake: () => void, threshold: number = 22) {
  const lastTimeRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);
  const lastZRef = useRef<number>(0);

  useEffect(() => {
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const current = e.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;

      const now = Date.now();
      const diffTime = now - lastTimeRef.current;

      if (diffTime > 100) {
        const dx = current.x - lastXRef.current;
        const dy = current.y - lastYRef.current;
        const dz = current.z - lastZRef.current;

        const speed = (Math.abs(dx) + Math.abs(dy) + Math.abs(dz)) / diffTime * 10000;

        if (speed > threshold * 10) {
          onShake();
        }

        lastTimeRef.current = now;
        lastXRef.current = current.x;
        lastYRef.current = current.y;
        lastZRef.current = current.z;
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
  }, [onShake, threshold]);
}
