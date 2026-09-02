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
  onOpenProfile,
  onOpenMobileHub
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
        className={`sticky top-0 z-40 w-full bg-space-950/92 backdrop-blur-2xl border-b border-white/10 px-3 sm:px-6 shadow-2xl shadow-black/70 select-none ${
          activeTab === 'chat' ? 'hidden md:block' : 'block'
        }`}
        style={{
          paddingTop: 'max(0.6rem, env(safe-area-inset-top, 0.6rem))',
          paddingBottom: '0.6rem'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">

          {/* ── Brand Logo & Title ── */}
          <div
            onClick={() => handleTabChange('chat')}
            className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0 active:scale-95 transition-transform"
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-0.5 shadow-lg shadow-pink-500/30 group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
                  <span className="text-sm sm:text-base animate-heartbeat">❤️</span>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent truncate">
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
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Search Users Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                title="Search Users & Start Chat"
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-2xl glass-card text-pink-300 hover:text-white hover:border-pink-400/60 active:scale-90 transition-all flex items-center justify-center border border-white/10 shadow-sm"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Friends & Pending Requests */}
            {onOpenFriends && (
              <button
                onClick={onOpenFriends}
                title="Friends List & Requests"
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-2xl glass-card text-purple-300 hover:text-white hover:border-purple-400/60 active:scale-90 transition-all relative flex items-center justify-center border border-white/10 shadow-sm"
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
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-2xl glass-card text-amber-300 hover:text-white hover:border-amber-400/60 active:scale-90 transition-all relative flex items-center justify-center border border-white/10 shadow-sm"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="min-w-[15px] h-4 px-1 rounded-full bg-rose-500 text-white text-[8px] font-extrabold flex items-center justify-center absolute -top-1 -right-1 animate-pulse shadow-md shadow-rose-500/50">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Couple Quick Hub Trigger */}
            {onOpenMobileHub && (
              <button
                onClick={onOpenMobileHub}
                title="Quick Hub & Couple Tools"
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-2xl glass-card text-pink-300 hover:text-white hover:border-pink-400/60 active:scale-90 transition-all flex items-center justify-center border border-pink-500/30 shadow-sm shadow-pink-500/20"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent-pink animate-pulse" />
              </button>
            )}

            {/* Theme Selector */}
            {onOpenTheme && (
              <button
                onClick={onOpenTheme}
                title="Theme & Atmosphere"
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-2xl glass-card text-pink-300 hover:text-white hover:border-pink-400/60 active:scale-90 transition-all flex items-center justify-center border border-white/10 shadow-sm"
              >
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* User Profile & Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title="My Account"
                className="w-9 h-9 xs:w-10 xs:h-10 rounded-2xl border-2 border-pink-400/80 hover:border-pink-300 transition-all flex items-center justify-center active:scale-90 overflow-hidden shadow-md shadow-pink-500/20"
              >
                <img
                  src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'Me')}&background=ff70a6&color=fff`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-56 rounded-2xl glass-panel-glow border border-pink-500/30 p-2 shadow-2xl space-y-1 animate-slide-up"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="p-2.5 border-b border-white/10">
                    <p className="font-extrabold text-xs text-white truncate">{currentUser?.displayName || currentUser?.username}</p>
                    <p className="text-[10px] text-pink-300 truncate">@{currentUser?.username}</p>
                  </div>

                  {onOpenMobileHub && (
                    <button
                      onClick={onOpenMobileHub}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-pink-300 hover:text-white hover:bg-pink-500/15 flex items-center gap-2.5 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span>Quick Hub &amp; Tools</span>
                    </button>
                  )}

                  {onOpenProfile && (
                    <button
                      onClick={onOpenProfile}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-pink-400" />
                      <span>Account &amp; Settings</span>
                    </button>
                  )}

                  {onOpenPrivacy && (
                    <button
                      onClick={onOpenPrivacy}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Privacy &amp; Security</span>
                    </button>
                  )}

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
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
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 xs:px-4 transition-all duration-300 ease-in-out ${
          isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
      >
        <nav className="max-w-md mx-auto mobile-nav-dock rounded-[28px] p-1.5 shadow-2xl flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isBouncing = bouncingTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 relative min-h-[48px] ${
                  isActive
                    ? 'text-pink-300 font-black'
                    : 'text-slate-400 hover:text-slate-200 active:scale-90'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl mobile-nav-pill-active" />
                )}
                <div
                  className={`relative z-10 transition-transform duration-200 ${
                    isActive ? 'text-pink-400 drop-shadow-[0_0_10px_rgba(255,112,166,0.9)] scale-110' : 'scale-100'
                  } ${isBouncing ? 'animate-nav-bounce' : ''}`}
                >
                  {item.icon}
                  {item.id === 'chat' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[15px] h-4 bg-rose-500 text-white text-[7.5px] xs:text-[8px] font-black rounded-full flex items-center justify-center px-0.5 shadow-lg shadow-rose-500/50 border border-space-950 animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] xs:text-[10px] font-bold tracking-tight truncate max-w-[52px] xs:max-w-[60px] relative z-10 mt-0.5 ${
                  isActive ? 'text-pink-300 font-black text-glow-pink' : 'text-slate-400'
                }`}>
                  {item.shortLabel}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 absolute -bottom-0.5 shadow-sm shadow-pink-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

