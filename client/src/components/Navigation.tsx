import React, { useState, useEffect } from 'react';
import { Home, MessageCircle, Heart, Lock, Video, Sparkles, Settings, LogOut, ShieldAlert, Palette, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShakeLock } from '../hooks/useShakeLock';
import { toast } from '../lib/toast';

export type TabType = 'home' | 'chat' | 'memories' | 'vault';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAdmin: () => void;
  onOpenStatus?: () => void;
  onOpenCallHistory?: () => void;
  onOpenTheme?: () => void;
  onOpenDailyQuestion?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdmin,
  onOpenStatus,
  onOpenCallHistory,
  onOpenTheme,
  onOpenDailyQuestion
}) => {
  const { currentUser, logout, toggleDecoyMode } = useAuth();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Auto-hide mobile bottom bar when virtual keyboard opens
  useEffect(() => {
    const handleFocusChange = () => {
      const active = document.activeElement;
      const isInputFocused = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      setIsKeyboardOpen(Boolean(isInputFocused));
    };
    document.addEventListener('focusin', handleFocusChange);
    document.addEventListener('focusout', handleFocusChange);
    return () => {
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusChange);
    };
  }, []);

  // Mobile Shake-to-Lock: Shaking phone triggers stealth decoy calculator
  useShakeLock(() => {
    toast.info('Mobile Shake Panic triggered!');
    toggleDecoyMode();
  });

  const navItems: { id: TabType; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'home',     label: 'Home',     shortLabel: 'Home',    icon: <Home className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'chat',     label: 'Chat',     shortLabel: 'Chat',    icon: <MessageCircle className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'memories', label: 'Memories', shortLabel: 'Gallery', icon: <Heart className="w-6 h-6 sm:w-5 sm:h-5" /> },
    { id: 'vault',    label: 'Vault',    shortLabel: 'Vault',   icon: <Lock className="w-6 h-6 sm:w-5 sm:h-5" /> }
  ];

  const handleLogout = () => {
    toast.love('Goodbye! Logging out... 💕');
    setTimeout(() => logout(), 500);
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-2 sm:px-6 shadow-xl"
      style={{
        paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))',
        paddingBottom: '0.5rem'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">

        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-0.5 shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <div className="w-full h-full bg-space-950 rounded-[10px] flex items-center justify-center">
              <span className="text-sm sm:text-xl animate-heartbeat">❤️</span>
            </div>
          </div>
          <div className="min-w-0" onDoubleClick={() => { toast.info('Stealth mode activated!'); toggleDecoyMode(); }}>
            <h1 className="font-extrabold text-[11px] sm:text-base tracking-tight bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent truncate cursor-pointer" title="Double tap for Stealth Decoy">
              OUR UNIVERSE
            </h1>
            <p className="hidden sm:block text-[10px] text-pink-400/80 font-medium tracking-wide truncate">
              NAVEEN &amp; HUMERA · PRIVATE
            </p>
          </div>
        </div>

        {/* Desktop Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 glass-card p-1.5 rounded-full border border-white/10">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Controls & PROMINENT LOGOUT BUTTON */}
        <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
          {currentUser && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="relative">
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.realName}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-accent-pink/50 shadow-md flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.realName)}&background=ff70a6&color=fff`;
                  }}
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border border-space-950 rounded-full" />
              </div>
              <span className="hidden md:inline text-xs font-bold text-pink-200">
                {currentUser.petName}
              </span>
            </div>
          )}

          {/* Desktop Only Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {onOpenTheme && (
              <button
                onClick={onOpenTheme}
                title="Change Color Theme"
                className="p-2 rounded-xl glass-card text-purple-300 hover:text-white transition-colors"
              >
                <Palette className="w-5 h-5" />
              </button>
            )}

            {onOpenDailyQuestion && (
              <button
                onClick={onOpenDailyQuestion}
                title="Daily Love Question"
                className="p-2 rounded-xl glass-card text-amber-300 hover:text-white transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            )}

            {onOpenStatus && (
              <button
                onClick={onOpenStatus}
                title="WhatsApp Status Stories"
                className="p-2 rounded-xl glass-card border border-pink-500/30 text-pink-300 hover:text-white transition-all relative"
              >
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping absolute top-1 right-1" />
                <Sparkles className="w-5 h-5" />
              </button>
            )}

            {onOpenCallHistory && (
              <button
                onClick={onOpenCallHistory}
                title="Call History Logs"
                className="p-2 rounded-xl glass-card text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                <Video className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => { toast.info('Stealth mode activated!'); toggleDecoyMode(); }}
              title="Panic / Stealth Mode (Alt + L)"
              className="p-2 rounded-xl glass-card hover:border-rose-400/40 text-rose-300 hover:text-rose-200 transition-colors"
            >
              <ShieldAlert className="w-5 h-5" />
            </button>

            {currentUser?.role === 'owner' && (
              <button
                onClick={onOpenAdmin}
                title="Admin Panel"
                className="p-2 rounded-xl glass-card hover:border-pink-400/40 text-slate-300 hover:text-pink-300 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Prominent Header Logout Button — ALWAYS visible on all screen sizes */}
          <button
            onClick={handleLogout}
            title="Logout of Universe"
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-rose-600/40 border border-rose-400/40 active:scale-95 transition-all flex-shrink-0 min-h-[36px]"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] font-bold">Exit</span>
          </button>
        </div>
      </div>

      {/* Mobile Quick Action Toolbar Strip — 100% visible on all mobile screens */}
      <div className="md:hidden flex items-center justify-start overflow-x-auto scrollbar-none pt-2 border-t border-white/10 mt-2 gap-1.5 px-1">
        {onOpenStatus && (
          <button
            onClick={onOpenStatus}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-card border border-pink-500/30 text-pink-300 text-[10px] font-bold shrink-0 relative"
          >
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            <Sparkles className="w-3.5 h-3.5" />
            <span>Status</span>
          </button>
        )}

        {onOpenCallHistory && (
          <button
            onClick={onOpenCallHistory}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-card text-emerald-300 text-[10px] font-bold shrink-0"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Call Logs</span>
          </button>
        )}

        {onOpenTheme && (
          <button
            onClick={onOpenTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-card text-purple-300 text-[10px] font-bold shrink-0"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme</span>
          </button>
        )}

        {onOpenDailyQuestion && (
          <button
            onClick={onOpenDailyQuestion}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-card text-amber-300 text-[10px] font-bold shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Question</span>
          </button>
        )}

        <button
          onClick={() => { toast.info('Stealth mode activated!'); toggleDecoyMode(); }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-card text-rose-300 text-[10px] font-bold shrink-0"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Stealth</span>
        </button>
      </div>
    </header>

    {/* Mobile Bottom Navigation Bar — Auto hides when in Chat mode or virtual keyboard is active */}
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-space-950/95 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around shadow-2xl px-1 transition-transform duration-300 ${
        activeTab === 'chat' || isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))', paddingTop: '6px' }}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[40px] px-1 py-1 rounded-xl transition-all duration-200 relative ${
              isActive
                ? 'text-pink-300'
                : 'text-slate-400 hover:text-slate-200 active:scale-95'
            }`}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-accent-pink/20 to-accent-purple/15 border border-pink-500/30" />
            )}
            <div className={`relative z-10 ${isActive ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(255,112,166,0.9)] scale-110' : ''}`}>
              {item.icon}
            </div>
            <span className={`text-[9px] font-semibold tracking-tight truncate max-w-[44px] relative z-10 ${isActive ? 'text-pink-300 font-bold' : ''}`}>
              {item.shortLabel}
            </span>
          </button>
        );
      })}

      {/* Mobile Bottom Bar Logout Shortcut */}
      <button
        onClick={handleLogout}
        title="Logout"
        className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[40px] px-1 py-1 rounded-xl text-rose-400 hover:text-rose-300 active:scale-95 transition-all"
      >
        <LogOut className="w-6 h-6 sm:w-5 sm:h-5 text-rose-400" />
        <span className="text-[9px] font-bold tracking-tight text-rose-400">Exit</span>
      </button>
    </div>
  </>
);
};
