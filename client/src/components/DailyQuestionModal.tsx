import React, { useState } from 'react';
import { X, Heart, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { toast } from '../lib/toast';

interface DailyQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPetName: string;
  partnerPetName: string;
}

export const DailyQuestionModal: React.FC<DailyQuestionModalProps> = ({
  isOpen,
  onClose,
  currentPetName,
  partnerPetName
}) => {
  const [myAnswer, setMyAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;

    setIsSubmitted(true);
    // Simulate partner response reveal
    setPartnerAnswer("Your smile in our last call made my entire day so happy Jaanu! ❤️");
    toast.love('Answer submitted & Partner answer unlocked! 💕');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel max-w-md w-full rounded-3xl border border-pink-500/30 p-6 relative space-y-4 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <h3 className="font-extrabold text-white text-base">Daily Love Question</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl glass-card text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-pink-400/20 text-center space-y-1">
            <span className="text-2xl">💭</span>
            <p className="font-bold text-sm text-pink-200">"What made you smile thinking of me today?"</p>
            <p className="text-[10px] text-slate-400">Answer to unlock {partnerPetName}'s secret response!</p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                placeholder={`Write your answer for ${partnerPetName}...`}
                className="w-full px-4 py-3 rounded-2xl glass-input text-xs h-24 resize-none"
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Submit & Reveal Answer</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-left space-y-1">
                <p className="text-[10px] font-bold text-pink-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Your Answer ({currentPetName}):</span>
                </p>
                <p className="text-xs text-white italic">"{myAnswer}"</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-left space-y-1">
                <p className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-pink-400 fill-current" />
                  <span>{partnerPetName}'s Answer:</span>
                </p>
                <p className="text-xs text-white italic">"{partnerAnswer}"</p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
          >
            Close Question
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
