import React, { useState } from 'react';
import {
  User, AtSign, Shield, LogOut, Check, X,
  MapPin, Palette, Sparkles, Lock, Bell, Smartphone, Key
} from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { useAuth } from '../context/AuthContext';
import { UserProfile, PrivacySettings } from '../types';
import { toast } from '../lib/toast';
import { AppTheme } from './ThemeSelectorModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
  currentTheme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  currentTheme = 'cosmic',
  onSelectTheme
}) => {
  const { currentUser, updateProfile, logout } = useAuth();
  const targetUser = user || currentUser;
  const isOwnProfile = !user || user.uid === currentUser?.uid;

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'privacy' | 'security'>('profile');

  // Profile Form State
  const [displayName, setDisplayName] = useState(targetUser?.displayName || '');
  const [bio, setBio] = useState(targetUser?.bio || '');
  const [city, setCity] = useState(targetUser?.city || '');
  const [photoURL, setPhotoURL] = useState(targetUser?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => {
    return (
      currentUser?.privacySettings || {
        whoCanMessage: 'everyone',
        whoCanAdd: 'everyone',
        showOnline: true,
        showReadReceipts: true,
        showLastSeen: true,
        whoCanSeeProfile: 'everyone'
      }
    );
  });

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
      id: 'galaxy',
      name: 'Deep Galaxy',
      gradient: 'from-indigo-950 via-purple-950 to-black',
      accentColor: '#818cf8',
      desc: 'Starlit nebula indigo & cosmos blue'
    },
    {
      id: 'amoled',
      name: 'AMOLED Pure Black',
      gradient: 'from-black via-zinc-950 to-black',
      accentColor: '#e4e4e7',
      desc: 'Pure OLED black battery saver'
    }
  ];

  if (!isOpen || !targetUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    setIsSaving(true);
    await updateProfile({
      displayName: displayName.trim() || targetUser.displayName,
      bio: bio.trim(),
      city: city.trim(),
      photoURL: photoURL.trim() || targetUser.photoURL,
      privacySettings
    });
    setIsSaving(false);
    toast.success('Settings & Profile updated! ✨');
    onClose();
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    await updateProfile({ privacySettings });
    setIsSaving(false);
    toast.success('Privacy preferences saved! 🛡️');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                <User className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">
                  {isOwnProfile ? 'Account & Settings' : `${targetUser.displayName}'s Profile`}
                </h3>
                <p className="text-[10px] text-pink-300">@{targetUser.username}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl glass-card text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs (if own profile) */}
          {isOwnProfile && (
            <div className="flex items-center gap-1.5 py-3 border-b border-white/10 overflow-x-auto scrollbar-none shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'appearance'
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Appearance</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'privacy'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Privacy</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Security</span>
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4 scrollbar-none">
            {/* 1. Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Preview */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <img
                      src={photoURL || targetUser.photoURL}
                      alt={targetUser.displayName}
                      className="w-20 h-20 rounded-full object-cover border-2 border-pink-400 shadow-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.displayName)}&background=ff70a6&color=fff`;
                      }}
                    />
                    {targetUser.online && (
                      <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-space-950 rounded-full" />
                    )}
                  </div>
                  <p className="font-extrabold text-sm text-white">{targetUser.displayName}</p>
                  <p className="text-xs text-pink-300 flex items-center gap-0.5">
                    <AtSign className="w-3 h-3" />
                    <span>{targetUser.username}</span>
                  </p>
                </div>

                {isOwnProfile ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        Bio / Status
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        placeholder="Tell friends about yourself..."
                        className="w-full px-3.5 py-2 rounded-xl glass-input text-xs resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        City / Location
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-love flex-1 py-2.5 rounded-xl text-xs font-bold"
                      >
                        {isSaving ? 'Saving...' : 'Save Profile'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { logout(); onClose(); }}
                        className="px-4 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30 text-xs font-bold flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-2 text-xs">
                    {targetUser.bio && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">About</span>
                        <p className="text-white mt-0.5">{targetUser.bio}</p>
                      </div>
                    )}
                    {targetUser.city && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-pink-400" />
                        <span>{targetUser.city}</span>
                      </div>
                    )}
                    <div className="pt-2 text-[10px] text-slate-400">
                      {targetUser.online ? '🟢 Currently online' : `Last active ${new Date(targetUser.lastSeen || '').toLocaleDateString()}`}
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* 2. Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Select your luxury visual theme for Our Universe:
                </p>
                <div className="space-y-2">
                  {themes.map((t) => {
                    const isSelected = currentTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (onSelectTheme) onSelectTheme(t.id);
                          toast.love(`Theme set to ${t.name}! ✨`);
                        }}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
                          isSelected
                            ? 'bg-white/12 border-pink-400/80 shadow-md ring-1 ring-pink-400/40'
                            : 'glass-card border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${t.gradient} border border-white/20 flex items-center justify-center`}>
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-white">{t.name}</p>
                            <p className="text-[10px] text-slate-400">{t.desc}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Who can send me messages?</label>
                  <select
                    value={privacySettings.whoCanMessage}
                    onChange={(e) => setPrivacySettings(s => ({ ...s, whoCanMessage: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="everyone" className="bg-space-950">Everyone on platform</option>
                    <option value="friends" className="bg-space-950">Only accepted friends</option>
                    <option value="nobody" className="bg-space-950">Nobody (paused)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Who can send friend requests?</label>
                  <select
                    value={privacySettings.whoCanAdd}
                    onChange={(e) => setPrivacySettings(s => ({ ...s, whoCanAdd: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl glass-input"
                  >
                    <option value="everyone" className="bg-space-950">Everyone</option>
                    <option value="friends_of_friends" className="bg-space-950">Friends of friends</option>
                    <option value="nobody" className="bg-space-950">Nobody</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-200">Show Online Status</span>
                    <input
                      type="checkbox"
                      checked={privacySettings.showOnline}
                      onChange={(e) => setPrivacySettings(s => ({ ...s, showOnline: e.target.checked }))}
                      className="w-4 h-4 accent-pink-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-200">Show Read Receipts (Blue ticks)</span>
                    <input
                      type="checkbox"
                      checked={privacySettings.showReadReceipts}
                      onChange={(e) => setPrivacySettings(s => ({ ...s, showReadReceipts: e.target.checked }))}
                      className="w-4 h-4 accent-pink-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-200">Show Last Seen Timestamp</span>
                    <input
                      type="checkbox"
                      checked={privacySettings.showLastSeen}
                      onChange={(e) => setPrivacySettings(s => ({ ...s, showLastSeen: e.target.checked }))}
                      className="w-4 h-4 accent-pink-500 rounded"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSavePrivacy}
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-600/40 transition-all"
                >
                  {isSaving ? 'Saving...' : 'Update Privacy Settings'}
                </button>
              </div>
            )}

            {/* 4. Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>Stealth Panic Disguise</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Instantly disguises Our Universe as a scientific calculator when in public.
                  </p>
                  <div className="text-[10px] text-rose-200/90 font-mono space-y-1 pt-1 border-t border-rose-500/20">
                    <p>• Mobile: Shake your phone firmly</p>
                    <p>• Desktop: Press <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/20">Alt + L</kbd></p>
                    <p>• Unlock code in calculator: <span className="text-white font-bold">1402</span> or <span className="text-white font-bold">7989</span> followed by =</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl glass-card border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-pink-300 font-bold">
                    <Key className="w-4 h-4" />
                    <span>End-to-End Privacy</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    All direct messages, disappearing secret messages, voice notes, and media in Our Universe are encrypted and privately scoped.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
