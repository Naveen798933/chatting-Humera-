import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, MessageCircle, Heart, Lock, Video, Sparkles, Settings,
  LogOut, ShieldAlert, Palette, HelpCircle, Bot, Music, Grid,
  Search, Users, Bell, User, Shield
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
  onOpenSearch?: () => void;
  onOpenFriends?: () => void;
  onOpenNotifications?: () => void;
  onOpenPrivacy?: () => void;
  onOpenProfile?: () => void;
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
  onOpenPartnerProfile,
  onOpenSearch,
  onOpenFriends,
  onOpenNotifications,
  onOpenPrivacy,
  onOpenProfile
}) => {
  const { currentUser, partnerUser, logout, toggleDecoyMode } = useAuth();
  const { messages, unreadNotificationCount, friends, pendingFriendRequests } = useUniverse();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [lastActiveTab, setLastActiveTab] = useState<TabType>(activeTab);
  const [bouncingTab, setBouncingTab] = useState<TabType | null>(null);

  // Count unread messages (partner messages not yet seen)
  const unreadCount = messages.filter(m => m.senderId !== currentUser?.uid && !m.seen).length;

  // Trigger bounce animation & haptic feedback on tab switch
  const handleTabChange = (tab: TabType) => {
    if (tab !== activeTab) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(15); } catch (_) {}
      }
      setBouncingTab(tab);
      setActiveTab(tab);
      setLastActiveTab(tab);
      setTimeout(() => setBouncingTab(null), 500);
    }
  };

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
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── Top Header Bar ─────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-40 w-full bg-space-950/92 backdrop-blur-2xl border-b border-white/8 px-3 sm:px-6 shadow-2xl shadow-black/60 select-none"
        style={{
          paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))',
          paddingBottom: '0.5rem'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">

          {/* ── Brand Logo & Title ── */}
          <div
            onClick={() => handleTabChange('home')}
            className="flex items-center gap-2 cursor-pointer group select-none flex-shrink-0"
          >
            {/* Logo with sparkle ring */}
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-0.5 shadow-lg shadow-pink-500/25 group-hover:scale-110 transition-transform relative z-10 flex items-center justify-center">
                <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
                  <span className="text-sm sm:text-base animate-heartbeat">❤️</span>
                </div>
              </div>
              {/* Decorative rotating rings on the logo */}
              <div className="absolute inset-0 rounded-2xl border border-dashed border-pink-500/25 animate-spin-slow pointer-events-none" />
            </div>

            <div className="min-w-0" onDoubleClick={() => { toast.info('Stealth mode activated!'); toggleDecoyMode(); }}>
              <h1 className="font-extrabold text-xs sm:text-base tracking-tight bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent truncate cursor-pointer">
                OUR UNIVERSE
              </h1>
              <p className="hidden sm:block text-[10px] text-pink-400/80 font-medium tracking-wide truncate">
                @{currentUser?.username || 'user'} • ONLINE
              </p>
            </div>
          </div>

          {/* ── Center on Mobile: Discover / Search Capsule ── */}
          <div
            onClick={onOpenSearch}
            className="flex md:hidden items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-pink-500/30 cursor-pointer active:scale-95 transition-all"
          >
            <Search className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-[11px] font-bold text-pink-200 truncate max-w-[80px]">
              Search
            </span>
          </div>

          {/* ── Desktop Navigation Pills ── */}
          <nav className="hidden md:flex items-center gap-1 glass-card p-1.5 rounded-full border border-white/10">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 scale-105'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 animate-shimmer pointer-events-none" />
                  )}
                  <span className={`relative z-10 ${isActive ? '' : ''}`}>{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Controls & Quick Action Buttons ── */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">

            {/* Desktop Only Action Buttons */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Discover People (Search) */}
              {onOpenSearch && (
                <button
                  onClick={onOpenSearch}
                  title="Search & Discover People"
                  className="p-2 rounded-xl glass-card text-pink-300 hover:text-white hover:border-pink-400/60 active:scale-95 transition-all"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Theme Selector */}
              {onOpenTheme && (
                <button
                  onClick={onOpenTheme}
                  title="Atmosphere & Themes"
                  className="p-2 rounded-xl glass-card text-pink-300 hover:text-white hover:border-pink-400/60 active:scale-95 transition-all relative group"
                >
                  <Palette className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-45" />
                </button>
              )}

              {/* Friends & Connections */}
              {onOpenFriends && (
                <button
                  onClick={onOpenFriends}
                  title="Friends & Requests"
                  className="p-2 rounded-xl glass-card text-purple-300 hover:text-white hover:border-purple-400/60 active:scale-95 transition-all relative"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  {pendingFriendRequests.length > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping absolute top-1 right-1" />
                  )}
                </button>
              )}

              {/* Notifications Bell */}
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  title="Notifications"
                  className="p-2 rounded-xl glass-card text-amber-300 hover:text-white hover:border-amber-400/60 active:scale-95 transition-all relative"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center absolute -top-1 -right-1 animate-pulse shadow-md shadow-rose-500/50">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>
              )}

              {/* Privacy Settings */}
              {onOpenPrivacy && (
                <button
                  onClick={onOpenPrivacy}
                  title="Privacy & Security"
                  className="hidden sm:flex p-2 rounded-xl glass-card text-emerald-300 hover:text-emerald-200 active:scale-95 transition-colors"
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

            {/* Profile Avatar Button */}
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                title="My Profile"
                className="p-0.5 rounded-full border-2 border-pink-400/80 hover:border-pink-300 transition-all shrink-0"
              >
                <img
                  src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'Me')}&background=ff70a6&color=fff`}
                  alt="Profile"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                />
              </button>
            )}

            {/* WhatsApp Status Stories */}
            {onOpenStatus && (
              <button
                onClick={onOpenStatus}
                title="Status Stories"
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

            {/* Mobile Header Buttons */}
            <div className="flex md:hidden items-center gap-1.5">
              {/* Hub Sheet Trigger */}
              <button
                onClick={onOpenMobileHub}
                title="Space Hub Tools"
                className="p-2 rounded-2xl bg-gradient-to-tr from-accent-pink/20 to-accent-purple/20 border border-pink-500/40 text-pink-300 hover:text-white shadow-md active:scale-90 transition-all flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-[10px] font-bold">Hub</span>
              </button>

              {/* Stealth Panic Button */}
              <button
                onClick={() => { toast.info('Stealth mode activated!'); toggleDecoyMode(); }}
                title="Stealth Mode (Alt + L)"
                className="p-2 rounded-2xl glass-card border border-rose-500/30 text-rose-300 active:scale-90 transition-all"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Logout */}
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

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── Floating Glass Bottom Nav Bar (Mobile) ──────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 transition-all duration-300 ease-in-out ${
          activeTab === 'chat' || isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
      >
        <nav className="max-w-md mx-auto bg-space-950/95 backdrop-blur-3xl border border-white/15 rounded-3xl p-1.5 shadow-2xl shadow-black/80 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isBouncing = bouncingTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 relative min-h-[48px] ${
                  isActive
                    ? 'text-pink-300'
                    : 'text-slate-400 hover:text-slate-200 active:scale-90'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-accent-pink/20 to-accent-purple/15 border border-pink-500/30 shadow-inner" />
                )}
                <div
                  className={`relative z-10 ${isActive ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(255,112,166,0.9)]' : ''} ${
                    isBouncing ? 'animate-nav-bounce' : isActive ? 'scale-110' : ''
                  }`}
                >
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
