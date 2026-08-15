import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { isPrivacyShieldEnabled } from '../lib/securityAudit';

export const PrivacyShieldOverlay: React.FC = () => {
  const [isShieldActive, setIsShieldActive] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isPrivacyShieldEnabled()) return;
      if (document.hidden) {
        setIsShieldActive(true);
      } else {
        // Small delay to prevent flashing while returning
        setTimeout(() => setIsShieldActive(false), 200);
      }
    };

    const handleWindowBlur = () => {
      if (!isPrivacyShieldEnabled()) return;
      setIsShieldActive(true);
    };

    const handleWindowFocus = () => {
      setIsShieldActive(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  if (!isShieldActive) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-space-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 select-none pointer-events-auto"
      style={{ touchAction: 'none' }}
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-accent-pink to-accent-purple p-0.5 shadow-2xl flex items-center justify-center animate-pulse">
        <div className="w-full h-full bg-space-950 rounded-3xl flex items-center justify-center">
          <Heart className="w-10 h-10 text-pink-400 fill-current animate-heartbeat" />
        </div>
      </div>

      <div className="text-center mt-6 space-y-2">
        <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Our Universe Protected</span>
        </h2>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Screen masked for your privacy. Tap anywhere or refocus to resume.
        </p>
      </div>
    </div>
  );
};
