import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, MessageCircle, Heart, Lock, Video, Sparkles, Settings,
  LogOut, ShieldAlert, Palette, HelpCircle, Bot, Music, Grid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { useShakeLock } from '../hooks/useShakeLock';
import { toast } from '../lib/toast';

export type TabType = 'home' | 'chat' | 'together' | 'memories' | 'vault';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAdmin: () => void;
  onOpenStatus?: () => void;
  onOpenCallHistory?: () => void;
  onOpenTheme?: () => void;
  onOpenDailyQuestion?: () => void;
  onOpenLoveAI?: () => void;
  onOpenSoundscapes?: () => void;
  onOpenSecurityCenter?: () => void;
  onOpenMobileHub?: () => void;
  onOpenPartnerProfile?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdmin,
  onOpenStatus,
  onOpenCallHistory,
  onOpenTheme,
  onOpenDailyQuestion,
  onOpenLoveAI,
  onOpenSoundscapes,
  onOpenSecurityCenter,
  onOpenMobileHub,
  onOpenPartnerProfile
}) => {
  const { currentUser, partnerUser, logout, toggleDecoyMode } = useAuth();
  const { messages } = useUniverse();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Count unread messages (partner messages not yet seen)
  const unreadCount = messages.filter(m => m.senderId !== currentUser?.uid && !m.seen).length;

  useEffect(() => {
    const vv = window.visualViewport;
    if (vv) {
      const handleVVResize = () => {
        setIsKeyboardOpen(vv.height < window.innerHeight - 150);
      };
      vv.addEventListener('resize', handleVVResize);
      return () => vv.removeEventListener('resize', handleVVResize);
    } else {
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
    }
  }, []);

  const handleShake = useCallback(() => {
    toast.info('Mobile Shake Panic triggered!');
    toggleDecoyMode();
  }, [toggleDecoyMode]);

  useShakeLock(handleShake);

  const navItems: { id: TabType; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'home',     label: 'Home',     shortLabel: 'Home',     icon: <Home className="w-5 h-5" /> },
    { id: 'chat',     label: 'Chat',     shortLabel: 'Chat',     icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'together', label: 'Together', shortLabel: 'Together', icon: <Sparkles className="w-5 h-5 text-pink-400" /> },
    { id: 'memories', label: 'Memories', shortLabel: 'Gallery',  icon: <Heart className="w-5 h-5" /> },
    { id: 'vault',    label: 'Vault',    shortLabel: 'Vault',    icon: <Lock className="w-5 h-5" /> }
  ];

  const handleLogout = () => {
    toast.love('Goodbye! Logging out... 💕');
    setTimeout(() => logout(), 500);
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full bg-space-950/90 backdrop-blur-2xl border-b border-white/10 px-3 sm:px-6 shadow-2xl shadow-black/50 select-none"
        style={{
          paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))',
          paddingBottom: '0.5rem'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">

          {/* Left: Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-0.5 shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
                <span className="text-sm sm:text-base animate-heartbeat">❤️</span>
              </div>
            </div>
            <div className="min-w-0" onDoubleClick={() => { toast.info('Stealth mode activated!'); toggleDecoyMode(); }}>
              <h1 className="font-extrabold text-xs sm:text-base tracking-tight bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent truncate cursor-pointer">
                OUR UNIVERSE
              </h1>
              <p className="hidden sm:block text-[10px] text-pink-400/80 font-medium tracking-wide truncate">
                NAVEEN &amp; HUMERA
              </p>
            </div>
          </div>

          {/* Center on Mobile: Partner Status Capsule */}
          <div
            onClick={onOpenPartnerProfile}
            className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-pink-500/30 cursor-pointer active:scale-95 transition-all"
          >
            <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-pink-400">
              <img
                src={partnerUser?.photoURL}
                alt="Partner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Partner&background=a855f7&color=fff`;
                }}
              />
              <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full border border-black ${partnerUser?.online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            </div>
            <span className="text-[11px] font-bold text-pink-200 truncate max-w-[80px]">
              {partnerUser?.petName || 'Partner'}
            </span>
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

          {/* Controls & Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            
            {/* Desktop Only Extra Action Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {onOpenLoveAI && (
                <button
                  onClick={onOpenLoveAI}
                  title="Cupid Love AI Assistant"
                  className="p-2 rounded-xl glass-card border border-pink-500/30 text-pink-300 hover:text-white hover:border-pink-400/60 transition-all relative group"
                >
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping absolute top-1 right-1" />
                  <Bot className="w-5 h-5 text-accent-pink group-hover:scale-110 transition-transform" />
                </button>
              )}

              {onOpenSoundscapes && (
                <button
                  onClick={onOpenSoundscapes}
                  title="Ambient Soundscapes & Lo-Fi"
                  className="p-2 rounded-xl glass-card text-cyan-300 hover:text-white hover:border-cyan-400/40 transition-colors"
                >
                  <Music className="w-5 h-5" />
                </button>
              )}

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

              {onOpenSecurityCenter && (
                <button
                  onClick={onOpenSecurityCenter}
                  title="Security & Privacy Hub"
                  className="p-2 rounded-xl glass-card text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/40 transition-colors"
                >
                  <ShieldAlert className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => { toast.info('Stealth mode activated!'); toggleDecoyMode(); }}
                title="Panic / Stealth Mode (Alt + L)"
                className="p-2 rounded-xl glass-card hover:border-rose-400/40 text-rose-300 hover:text-rose-200 transition-colors"
              >
                <Lock className="w-5 h-5" />
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

            {/* Mobile Header Buttons (Clean & Minimal) */}
            <div className="flex md:hidden items-center gap-1.5">
              {/* Universal Space Hub Sheet Trigger */}
              <button
                onClick={onOpenMobileHub}
                title="Space Hub Tools"
                className="p-2 rounded-2xl bg-gradient-to-tr from-accent-pink/20 to-accent-purple/20 border border-pink-500/40 text-pink-300 hover:text-white shadow-md active:scale-90 transition-all flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-[10px] font-bold">Hub</span>
              </button>

              {/* Stealth Quick Panic Button */}
              <button
                onClick={() => { toast.info('Stealth mode activated!'); toggleDecoyMode(); }}
                title="Stealth Mode (Alt + L)"
                className="p-2 rounded-2xl glass-card border border-rose-500/30 text-rose-300 active:scale-90 transition-all"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Logout Button */}
            <button
              onClick={handleLogout}
              title="Logout of Universe"
              className="hidden md:flex px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold items-center gap-1 shadow-lg shadow-rose-600/40 border border-rose-400/40 active:scale-95 transition-all flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Modern Glass Bottom Navigation Bar for Mobile */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 transition-all duration-300 ease-in-out ${
          activeTab === 'chat' || isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
      >
        <nav className="max-w-md mx-auto bg-space-950/95 backdrop-blur-3xl border border-white/15 rounded-3xl p-1.5 shadow-2xl shadow-black/80 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 relative min-h-[48px] ${
                  isActive
                    ? 'text-pink-300'
                    : 'text-slate-400 hover:text-slate-200 active:scale-90'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-accent-pink/20 to-accent-purple/15 border border-pink-500/30 shadow-inner" />
                )}
                <div className={`relative z-10 ${isActive ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(255,112,166,0.9)] scale-110' : ''}`}>
                  {item.icon}
                  {item.id === 'chat' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center px-0.5 shadow-lg shadow-rose-500/40 border border-space-950 animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-tight truncate max-w-[50px] relative z-10 mt-0.5 ${isActive ? 'text-pink-300 font-extrabold' : ''}`}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
