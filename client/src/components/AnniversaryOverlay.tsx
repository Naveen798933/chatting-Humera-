import React, { useState, useEffect } from 'react';
import { useUniverse } from '../context/UniverseContext';
import { useAuth } from '../context/AuthContext';
import { Heart, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from './motion';

export const AnniversaryOverlay: React.FC = () => {
  const { anniversaryDate } = useUniverse();
  const { currentUser, partnerUser } = useAuth();
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const today = new Date();
    const anniv = new Date(anniversaryDate);

    // Check if today matches month and day of anniversary date
    if (today.getMonth() === anniv.getMonth() && today.getDate() === anniv.getDate()) {
      setIsAnniversary(true);

      // Trigger celebratory fireworks confetti
      const interval = setInterval(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.5 }
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [anniversaryDate]);

  if (!isAnniversary || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="glass-panel-glow p-8 rounded-3xl max-w-md w-full text-center space-y-4 border border-pink-400/60 shadow-2xl relative overflow-hidden">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-1 shadow-2xl flex items-center justify-center animate-heartbeat">
            <Heart className="w-10 h-10 text-white fill-current" />
          </div>

          <span className="inline-block px-4 py-1 rounded-full text-xs font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/40">
            HAPPY ANNIVERSARY! 🎉
          </span>

          <h2 className="text-2xl font-black bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 bg-clip-text text-transparent">
            {currentUser?.petName} & {partnerUser?.petName}
          </h2>

          <p className="text-xs text-slate-200 leading-relaxed italic">
            "Today marks another magnificent milestone of our private universe. Thank you for filling every day with love, laughter, and endless warmth."
          </p>

          <button
            onClick={() => {
              confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
              setDismissed(true);
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-xl shadow-pink-500/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Celebrate Our Anniversary ❤️</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
