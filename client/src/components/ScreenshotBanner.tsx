import React, { useEffect, useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from './motion';

export const ScreenshotBanner: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.shiftKey && (e.key === 'S' || e.key === 's') && (e.metaKey || e.ctrlKey)) ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))
      ) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-[90%]">
          <div className="glass-panel-glow bg-space-900/90 border border-accent-pink/50 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="p-2.5 bg-accent-pink/20 text-accent-pink rounded-xl">
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm text-pink-300 flex items-center gap-1.5">
                <span>Screenshot Detected!</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Someone tried to steal a memory 📸
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
