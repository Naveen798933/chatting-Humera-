import React from 'react';
import { X, Palette, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { toast } from '../lib/toast';

export type AppTheme = 'cosmic' | 'rose' | 'emerald' | 'ocean' | 'amoled';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme
}) => {
  if (!isOpen) return null;

  const themes: { id: AppTheme; name: string; gradient: string; accentColor: string; desc: string }[] = [
    {
      id: 'cosmic',
      name: 'Cosmic Violet',
      gradient: 'from-purple-900 via-pink-900 to-space-950',
      accentColor: '#ff70a6',
      desc: 'Deep space purple & neon rose (Default)'
    },
    {
      id: 'rose',
      name: 'Midnight Rose',
      gradient: 'from-rose-950 via-red-950 to-space-950',
      accentColor: '#f43f5e',
      desc: 'Romantic crimson red & velvet rose'
    },
    {
      id: 'emerald',
      name: 'Emerald Aurora',
      gradient: 'from-emerald-950 via-teal-950 to-space-950',
      accentColor: '#10b981',
      desc: 'Lush aurora green & mint glow'
    },
    {
      id: 'ocean',
      name: 'Ocean Cyan',
      gradient: 'from-cyan-950 via-blue-950 to-space-950',
      accentColor: '#06b6d4',
      desc: 'Deep ocean cyan & sapphire'
    },
    {
      id: 'amoled',
      name: 'AMOLED Pure Black',
      gradient: 'from-black via-zinc-950 to-black',
      accentColor: '#e4e4e7',
      desc: 'Pure OLED black battery saver'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel max-w-md w-full rounded-3xl border border-white/10 p-6 relative space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-400" />
              <h3 className="font-extrabold text-white text-base">App Color Theme</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-xl glass-card text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Customize the ambient atmosphere of Our Universe 💕
          </p>

          <div className="space-y-2.5">
            {themes.map((t) => {
              const isSelected = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelectTheme(t.id);
                    toast.love(`Theme changed to ${t.name}! ✨`);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-white/10 border-pink-400/60 shadow-lg shadow-pink-500/20'
                      : 'glass-card border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${t.gradient} border border-white/20 flex items-center justify-center shadow-md`}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">{t.name}</p>
                      <p className="text-[10px] text-slate-400">{t.desc}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs mt-2"
          >
            Apply & Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
