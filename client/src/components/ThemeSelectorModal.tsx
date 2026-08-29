import React from 'react';
import { X, Palette, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { toast } from '../lib/toast';

export type AppTheme = 'cosmic' | 'rose' | 'emerald' | 'ocean' | 'amoled' | 'sunset' | 'galaxy';

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
      id: 'sunset',
      name: 'Sunset Glow',
      gradient: 'from-orange-950 via-rose-950 to-amber-950',
      accentColor: '#fb923c',
      desc: 'Warm golden sunset & romantic orange'
    },
    {
      id: 'galaxy',
      name: 'Deep Galaxy',
      gradient: 'from-indigo-950 via-purple-950 to-black',
      accentColor: '#818cf8',
      desc: 'Starlit nebula indigo & cosmos blue'
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
      {isOpen && (
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

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {themes.map((t) => {
                const isSelected = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTheme(t.id);
                      toast.love(`Atmosphere changed to ${t.name}! ✨`);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 group active:scale-[0.98] ${
                      isSelected
                        ? 'bg-white/12 border-pink-400/80 shadow-lg shadow-pink-500/25 ring-1 ring-pink-400/40'
                        : 'glass-card border-white/10 hover:border-white/25 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${t.gradient} border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0 transition-transform group-hover:scale-105`}
                        style={{ boxShadow: isSelected ? `0 0 20px ${t.accentColor}55` : undefined }}
                      >
                        <Sparkles className="w-4 h-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-xs sm:text-sm text-white tracking-wide">{t.name}</p>
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: t.accentColor, boxShadow: `0 0 8px ${t.accentColor}` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium mt-0.5">{t.desc}</p>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-accent-pink to-accent-purple text-white flex items-center justify-center shadow-md shadow-pink-500/40 flex-shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/20 group-hover:border-white/40 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-extrabold text-xs shadow-lg shadow-pink-500/30 hover:opacity-90 active:scale-95 transition-all mt-2"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
