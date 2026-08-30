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
  onOpenAdmin?: () => void;
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
  onOpenStatus,
  onOpenTheme,
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

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems: { id: TabType; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'chat',     label: 'Chats',       shortLabel: 'Chats',     icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'home',     label: 'Dashboard',   shortLabel: 'Home',      icon: <Home className="w-5 h-5" /> },
    { id: 'together', label: 'Activities',  shortLabel: 'Play',      icon: <Sparkles className="w-5 h-5 text-pink-400" /> },
    { id: 'memories', label: 'Memories',    shortLabel: 'Gallery',   icon: <Heart className="w-5 h-5" /> },
    { id: 'vault',    label: 'Love Vault',  shortLabel: 'Vault',     icon: <Lock className="w-5 h-5" /> },
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
        className="sticky top-0 z-40 w-full bg-space-950/95 backdrop-blur-2xl border-b border-white/10 px-3 sm:px-6 shadow-2xl shadow-black/60 select-none"
        style={{
          paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))',
          paddingBottom: '0.5rem'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

          {/* ── Brand Logo & Title ── */}
          <div
            onClick={() => handleTabChange('chat')}
            className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-0.5 shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
                  <span className="text-sm sm:text-base animate-heartbeat">❤️</span>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent truncate">
                OUR UNIVERSE
              </h1>
              <p className="hidden sm:block text-[10px] text-pink-400/80 font-medium tracking-wide truncate">
                @{currentUser?.username || 'user'}
              </p>
            </div>
          </div>

          {/* ── Desktop Navigation Tabs ── */}
          <nav className="hidden md:flex items-center gap-1 glass-card p-1 rounded-full border border-white/10">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Action Icons & Profile ── */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Search Users Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                title="Search Users & Start Chat"
                className="p-1.5 xs:p-2 rounded-xl glass-card text-pink-300 hover:text-white hover:border-pink-400/60 active:scale-95 transition-all min-w-[32px] min-h-[32px] xs:min-w-[36px] xs:min-h-[36px] flex items-center justify-center"
              >
                <Search className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Friends & Pending Requests */}
            {onOpenFriends && (
              <button
                onClick={onOpenFriends}
                title="Friends List & Requests"
                className="p-1.5 xs:p-2 rounded-xl glass-card text-purple-300 hover:text-white hover:border-purple-400/60 active:scale-95 transition-all relative min-w-[32px] min-h-[32px] xs:min-w-[36px] xs:min-h-[36px] flex items-center justify-center"
              >
                <Users className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                {pendingFriendRequests.length > 0 && (
                  <span className="w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full bg-pink-500 animate-ping absolute top-0.5 right-0.5" />
                )}
              </button>
            )}

            {/* Notifications Bell */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                title="Notifications"
                className="p-1.5 xs:p-2 rounded-xl glass-card text-amber-300 hover:text-white hover:border-amber-400/60 active:scale-95 transition-all relative min-w-[32px] min-h-[32px] xs:min-w-[36px] xs:min-h-[36px] flex items-center justify-center"
              >
                <Bell className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="min-w-[14px] h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[8px] font-extrabold flex items-center justify-center absolute -top-1 -right-1 animate-pulse shadow-md shadow-rose-500/50">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Theme Selector */}
            {onOpenTheme && (
              <button
                onClick={onOpenTheme}
                title="Theme & Atmosphere"
                className="p-1.5 xs:p-2 rounded-xl glass-card text-pink-300 hover:text-white hover:border-pink-400/60 active:scale-95 transition-all min-w-[32px] min-h-[32px] xs:min-w-[36px] xs:min-h-[36px] flex items-center justify-center"
              >
                <Palette className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* User Profile & Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title="My Account"
                className="p-0.5 rounded-full border-2 border-pink-400/80 hover:border-pink-300 transition-all flex items-center gap-1 active:scale-95"
              >
                <img
                  src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'Me')}&background=ff70a6&color=fff`}
                  alt="Profile"
                  className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 top-11 z-50 w-52 rounded-2xl glass-panel-glow border border-pink-500/30 p-2 shadow-2xl space-y-1"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="p-2.5 border-b border-white/10">
                    <p className="font-extrabold text-xs text-white truncate">{currentUser?.displayName || currentUser?.username}</p>
                    <p className="text-[10px] text-pink-300 truncate">@{currentUser?.username}</p>
                  </div>

                  {onOpenProfile && (
                    <button
                      onClick={onOpenProfile}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-pink-400" />
                      <span>Account &amp; Settings</span>
                    </button>
                  )}

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── Floating Glass Bottom Nav Bar (Mobile) ──────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 xs:px-3.5 transition-all duration-300 ease-in-out ${
          isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
      >
        <nav className="max-w-md mx-auto bg-space-950/92 backdrop-blur-2xl border border-white/15 rounded-3xl p-1 xs:p-1.5 shadow-2xl shadow-black/80 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isBouncing = bouncingTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 xs:px-1 rounded-2xl transition-all duration-200 relative min-h-[44px] ${
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
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-rose-500 text-white text-[7px] xs:text-[8px] font-extrabold rounded-full flex items-center justify-center px-0.5 shadow-lg shadow-rose-500/40 border border-space-950 animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[8.5px] xs:text-[10px] font-semibold tracking-tight truncate max-w-[46px] xs:max-w-[56px] relative z-10 mt-0.5 ${isActive ? 'text-pink-300 font-extrabold' : ''}`}>
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
