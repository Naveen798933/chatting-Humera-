import React, { useState, useEffect } from 'react';
import { Eye, Flame, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { sounds } from '../lib/soundEffects';

interface ViewOnceModalProps {
  mediaUrl: string;
  onBurn: () => void;
  onClose: () => void;
}

export const ViewOnceModal: React.FC<ViewOnceModalProps> = ({ mediaUrl, onBurn, onClose }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  useEffect(() => {
    sounds.playSecretBurnSound();
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onBurn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onBurn]);

  // Anti-save / right-click block
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-8 select-none"
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      {/* Header with Burning Countdown */}
      <div className="w-full max-w-xl flex items-center justify-between z-20">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold animate-pulse">
          <Flame className="w-4 h-4 text-rose-400" />
          <span>Self-Destructs in {secondsRemaining}s</span>
        </div>

        <button
          onClick={() => { onBurn(); onClose(); }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          title="Close & Burn Now"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image with Anti-Download Shield */}
      <div className="relative max-w-2xl max-h-[75vh] mx-auto my-auto flex items-center justify-center pointer-events-none">
        <img
          src={mediaUrl}
          alt="View Once Media"
          draggable={false}
          className="max-h-[70vh] w-auto max-w-full rounded-3xl object-contain shadow-2xl border border-rose-500/30 select-none"
        />

        {/* Dynamic Watermark Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
          <p className="text-white text-xs font-mono tracking-widest uppercase rotate-[-25deg]">
            🔒 Confidential • View Once
          </p>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-center space-y-1 z-20">
        <p className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
          <Eye className="w-4 h-4 text-pink-400" />
          <span>View-Once Photo Protected</span>
        </p>
        <p className="text-[10px] text-slate-500">
          This media will permanently burn and cannot be viewed again.
        </p>
      </div>
    </div>
  );
};
