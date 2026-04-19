import { useEffect, useState } from 'react';

export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return undefined;
    const viewport = window.visualViewport;
    const update = () => {
      const delta = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setInset(delta);
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}