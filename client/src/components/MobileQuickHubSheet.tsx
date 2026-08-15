import React from 'react';
import {
  Sparkles, Bot, Music, Video, Palette, HelpCircle,
  ShieldCheck, Lock, X, Settings, Heart, Flame, MessageCircle, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { useAuth } from '../context/AuthContext';
import { toast } from '../lib/toast';

interface MobileQuickHubSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLoveAI: () => void;
  onOpenSoundscapes: () => void;
  onOpenStatus: () => void;
  onOpenCallHistory: () => void;
  onOpenTheme: () => void;
  onOpenDailyQuestion: () => void;
  onOpenSecurityCenter: () => void;
  onOpenAdmin: () => void;
  onToggleDecoy: () => void;
}

export const MobileQuickHubSheet: React.FC<MobileQuickHubSheetProps> = ({
  isOpen,
  onClose,
  onOpenLoveAI,
  onOpenSoundscapes,
  onOpenStatus,
  onOpenCallHistory,
  onOpenTheme,
  onOpenDailyQuestion,
  onOpenSecurityCenter,
  onOpenAdmin,
  onToggleDecoy
}) => {
  const { currentUser, partnerUser, logout } = useAuth();

  const handleAction = (callback: () => void) => {
    onClose();
    setTimeout(callback, 150);
  };

  const handleLogout = () => {
    onClose();
    toast.love('Goodbye! Logging out... 💕');
    setTimeout(() => logout(), 400);
  };

  const toolCategories = [
    {
      category: 'AI & Couple Magic',
      items: [
        {
          id: 'love_ai',
          title: 'Cupid Love AI',
          desc: 'Date planner & poetry generator',
          icon: <Bot className="w-5 h-5 text-accent-pink" />,
          bg: 'bg-pink-500/15 border-pink-500/30',
          onClick: () => handleAction(onOpenLoveAI)
        },
        {
          id: 'daily_q',
          title: 'Daily Question',
          desc: 'Answer & unlock secret response',
          icon: <HelpCircle className="w-5 h-5 text-amber-300" />,
          bg: 'bg-amber-500/15 border-amber-500/30',
          onClick: () => handleAction(onOpenDailyQuestion)
        }
      ]
    },
    {
      category: 'Atmosphere & Media',
      items: [
        {
          id: 'soundscapes',
          title: 'Soundscapes & Lo-Fi',
          desc: 'Rain, fire & ocean wave audio',
          icon: <Music className="w-5 h-5 text-cyan-300" />,
          bg: 'bg-cyan-500/15 border-cyan-500/30',
          onClick: () => handleAction(onOpenSoundscapes)
        },
        {
          id: 'theme',
          title: 'App Theme',
          desc: 'Cosmic, Rose, Emerald & AMOLED',
          icon: <Palette className="w-5 h-5 text-purple-300" />,
          bg: 'bg-purple-500/15 border-purple-500/30',
          onClick: () => handleAction(onOpenTheme)
        }
      ]
    },
    {
      category: 'Communication',
      items: [
        {
          id: 'status',
          title: 'Status Stories',
          desc: 'Share photos & daily updates',
          icon: <Sparkles className="w-5 h-5 text-pink-400" />,
          bg: 'bg-pink-500/15 border-pink-500/30',
          onClick: () => handleAction(onOpenStatus)
        },
        {
          id: 'calls',
          title: 'Call History',
          desc: 'Recent voice & video logs',
          icon: <Video className="w-5 h-5 text-emerald-300" />,
          bg: 'bg-emerald-500/15 border-emerald-500/30',
          onClick: () => handleAction(onOpenCallHistory)
        }
      ]
    },
    {
      category: 'Privacy & Security',
      items: [
        {
          id: 'security',
          title: 'Security Hub',
          desc: 'Safety keys, biometrics & nuke',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          bg: 'bg-emerald-500/15 border-emerald-500/30',
          onClick: () => handleAction(onOpenSecurityCenter)
        },
        {
          id: 'stealth',
          title: 'Stealth Decoy Mode',
          desc: 'Switch to scientific calculator',
          icon: <Lock className="w-5 h-5 text-rose-300" />,
          bg: 'bg-rose-500/15 border-rose-500/30',
          onClick: () => handleAction(onToggleDecoy)
        }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-lg bg-space-950/98 backdrop-blur-3xl border-t sm:border border-pink-500/30 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88dvh] select-none"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
          >
            {/* Grabber Indicator */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent-pink to-accent-purple p-0.5 shadow-md flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Our Space Hub</h3>
                  <p className="text-[10px] text-pink-300">Quick tools for {currentUser?.petName} &amp; {partnerUser?.petName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-2xl glass-card text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tool Sections Grid */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
              {toolCategories.map(cat => (
                <div key={cat.category} className="space-y-2">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider px-1">
                    {cat.category}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {cat.items.map(item => (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex items-start gap-2.5 ${item.bg}`}
                      >
                        <div className="p-2 rounded-xl bg-space-950/80 border border-white/10 shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{item.title}</p>
                          <p className="text-[9px] text-slate-300 leading-tight line-clamp-2 mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Admin Panel (if owner) & Logout */}
              <div className="pt-2 border-t border-white/10 flex gap-2">
                {currentUser?.role === 'owner' && (
                  <button
                    onClick={() => handleAction(onOpenAdmin)}
                    className="flex-1 py-2.5 rounded-2xl glass-card text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
