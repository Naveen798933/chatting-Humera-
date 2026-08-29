import React from 'react';
import {
  Sparkles, Bot, Music, Video, Palette, HelpCircle,
  ShieldCheck, Lock, X, Settings, Heart, LogOut, Send
} from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
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
  const { sendQuickAction } = useUniverse();

  const handleAction = (callback: () => void) => {
    onClose();
    setTimeout(callback, 150);
  };

  const handleLogout = () => {
    onClose();
    toast.love('Goodbye! Logging out... 💕');
    setTimeout(() => logout(), 400);
  };

  const handleQuickKiss = () => {
    sendQuickAction('kiss');
    toast.love('💋 Kiss sent to your love!');
    onClose();
  };

  const toolCategories = [
    {
      category: 'AI & Couple Magic',
      accent: 'from-pink-500/20 to-transparent',
      items: [
        {
          id: 'love_ai',
          title: 'Cupid Love AI',
          desc: 'Date planner & poetry generator',
          icon: <Bot className="w-5 h-5 text-accent-pink" />,
          bg: 'bg-pink-500/15 border-pink-500/30',
          glow: 'hover:shadow-pink-500/20',
          onClick: () => handleAction(onOpenLoveAI)
        },
        {
          id: 'daily_q',
          title: 'Daily Question',
          desc: 'Answer & unlock secret response',
          icon: <HelpCircle className="w-5 h-5 text-amber-300" />,
          bg: 'bg-amber-500/15 border-amber-500/30',
          glow: 'hover:shadow-amber-500/20',
          onClick: () => handleAction(onOpenDailyQuestion)
        }
      ]
    },
    {
      category: 'Atmosphere & Media',
      accent: 'from-cyan-500/20 to-transparent',
      items: [
        {
          id: 'soundscapes',
          title: 'Soundscapes & Lo-Fi',
          desc: 'Rain, fire & ocean wave audio',
          icon: <Music className="w-5 h-5 text-cyan-300" />,
          bg: 'bg-cyan-500/15 border-cyan-500/30',
          glow: 'hover:shadow-cyan-500/20',
          onClick: () => handleAction(onOpenSoundscapes)
        },
        {
          id: 'theme',
          title: 'App Theme',
          desc: 'Cosmic, Rose, Emerald & AMOLED',
          icon: <Palette className="w-5 h-5 text-purple-300" />,
          bg: 'bg-purple-500/15 border-purple-500/30',
          glow: 'hover:shadow-purple-500/20',
          onClick: () => handleAction(onOpenTheme)
        }
      ]
    },
    {
      category: 'Communication',
      accent: 'from-pink-500/20 to-transparent',
      items: [
        {
          id: 'status',
          title: 'Status Stories',
          desc: 'Share photos & daily updates',
          icon: <Sparkles className="w-5 h-5 text-pink-400" />,
          bg: 'bg-pink-500/15 border-pink-500/30',
          glow: 'hover:shadow-pink-500/20',
          onClick: () => handleAction(onOpenStatus)
        },
        {
          id: 'calls',
          title: 'Call History',
          desc: 'Recent voice & video logs',
          icon: <Video className="w-5 h-5 text-emerald-300" />,
          bg: 'bg-emerald-500/15 border-emerald-500/30',
          glow: 'hover:shadow-emerald-500/20',
          onClick: () => handleAction(onOpenCallHistory)
        }
      ]
    },
    {
      category: 'Privacy & Security',
      accent: 'from-emerald-500/20 to-transparent',
      items: [
        {
          id: 'security',
          title: 'Security Hub',
          desc: 'Safety keys, biometrics & nuke',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          bg: 'bg-emerald-500/15 border-emerald-500/30',
          glow: 'hover:shadow-emerald-500/20',
          onClick: () => handleAction(onOpenSecurityCenter)
        },
        {
          id: 'stealth',
          title: 'Stealth Decoy Mode',
          desc: 'Switch to scientific calculator',
          icon: <Lock className="w-5 h-5 text-rose-300" />,
          bg: 'bg-rose-500/15 border-rose-500/30',
          glow: 'hover:shadow-rose-500/20',
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
            className="w-full max-w-lg bg-space-950/98 backdrop-blur-3xl border-t sm:border border-pink-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] select-none overflow-hidden"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
          >
            {/* Grabber */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 shrink-0" />

            {/* ── Couple Profile Strip Header ── */}
            <div className="px-5 pt-3 pb-3 shrink-0">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/8 to-transparent border border-white/8 mb-3">
                {/* Current User */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full border-2 border-pink-500/60 overflow-hidden shadow-lg shadow-pink-500/20">
                    <img
                      src={currentUser?.photoURL}
                      alt={currentUser?.realName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.realName || 'N')}&background=ff70a6&color=fff`;
                      }}
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-space-950 rounded-full" />
                </div>

                {/* Center */}
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-pink-400 fill-current animate-heartbeat" />
                    <span className="text-[10px] font-extrabold text-pink-200">Our Space Hub</span>
                    <Heart className="w-3.5 h-3.5 text-pink-400 fill-current animate-heartbeat" />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {currentUser?.petName || currentUser?.displayName || 'You'} & {partnerUser?.petName || partnerUser?.displayName || 'Partner'}
                  </p>
                </div>

                {/* Partner User */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-full overflow-hidden shadow-lg border-2 ${
                    partnerUser?.online ? 'border-emerald-500/60 shadow-emerald-500/20' : 'border-purple-500/50'
                  }`}>
                    <img
                      src={partnerUser?.photoURL}
                      alt={partnerUser?.displayName || partnerUser?.username || 'Partner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser?.displayName || partnerUser?.username || 'Partner')}&background=a855f7&color=fff`;
                      }}
                    />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-space-950 rounded-full ${
                    partnerUser?.online ? 'bg-emerald-400 animate-presence-glow' : 'bg-slate-500'
                  }`} />
                </div>
              </div>

              {/* ── Quick Kiss Button ── */}
              <button
                onClick={handleQuickKiss}
                className="btn-love w-full py-2.5 rounded-2xl text-xs"
              >
                <span>💋</span>
                <span>Quick Kiss to {partnerUser?.petName || partnerUser?.displayName || 'Partner'}</span>
                <Send className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>

            {/* ── Divider ── */}
            <div className="mx-5 h-px bg-white/8 shrink-0 mb-1" />

            {/* ── Tool Sections Grid ── */}
            <div className="flex-1 overflow-y-auto space-y-3 px-5 py-2 scrollbar-none">
              {toolCategories.map(cat => (
                <div key={cat.category} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-0.5 w-4 rounded-full bg-gradient-to-r ${cat.accent}`} />
                    <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                      {cat.category}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.items.map(item => (
                      <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-95 hover:scale-[1.02] flex items-start gap-2.5 hover:shadow-lg ${item.bg} ${item.glow}`}
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

              {/* ── Footer Actions ── */}
              <div className="pt-2 border-t border-white/8 flex gap-2">
                {currentUser?.role === 'owner' && (
                  <button
                    onClick={() => handleAction(onOpenAdmin)}
                    className="flex-1 py-2.5 rounded-2xl glass-card text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all hover:border-white/20"
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

            {/* Close button floating */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-2xl glass-card text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
