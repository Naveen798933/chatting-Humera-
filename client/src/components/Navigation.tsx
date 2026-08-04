import React from 'react';
import { Home, MessageCircle, Heart, Lock, Video, Sparkles, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabType = 'home' | 'chat' | 'memories' | 'vault' | 'together' | 'ai';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAdmin: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onOpenAdmin }) => {
  const { currentUser, logout } = useAuth();

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="w-5 h-5" /> },
    { id: 'memories', label: 'Memories', icon: <Heart className="w-5 h-5" /> },
    { id: 'vault', label: 'Vault & Hub', icon: <Lock className="w-5 h-5" /> },
    { id: 'together', label: 'Together', icon: <Video className="w-5 h-5" /> },
    { id: 'ai', label: 'Love AI', icon: <Sparkles className="w-5 h-5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-0.5 shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-space-950 rounded-[10px] flex items-center justify-center">
              <span className="text-xl animate-pulse-heart">❤️</span>
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
              OUR UNIVERSE
            </h1>
            <p className="text-[10px] text-pink-400 font-medium tracking-wide">
              NAVEEN & HUMERA PRIVATE
            </p>
          </div>
        </div>

        {/* Desktop Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1.5 glass-card p-1.5 rounded-full border border-white/10">
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

        {/* Admin / User Controls */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2">
              <img
                src={currentUser.photoURL}
                alt={currentUser.realName}
                className="w-9 h-9 rounded-full object-cover border-2 border-accent-pink/50 shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.realName)}&background=ff70a6&color=fff`;
                }}
              />
              <span className="hidden sm:inline text-xs font-bold text-pink-200">
                {currentUser.petName}
              </span>
            </div>
          )}

          {currentUser?.role === 'owner' && (
            <button
              onClick={onOpenAdmin}
              title="Admin Panel & Backup"
              className="p-2 rounded-xl glass-card hover:border-pink-400/40 text-slate-300 hover:text-pink-300 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          {/* Prominent Logout Button */}
          <button
            onClick={logout}
            title="Logout"
            className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500 hover:text-white transition-all shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 px-2 flex items-center justify-around"
        style={{ paddingTop: '8px', paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive
                  ? 'text-accent-pink scale-110'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
