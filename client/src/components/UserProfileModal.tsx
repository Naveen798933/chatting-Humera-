import React, { useState } from 'react';
import { User, AtSign, Mail, Edit3, Shield, LogOut, Check, X, Camera, MapPin, Heart } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { toast } from '../lib/toast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null; // If provided, view/edit that user; otherwise currentUser
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const { currentUser, updateProfile, logout } = useAuth();
  const targetUser = user || currentUser;
  const isOwnProfile = !user || user.uid === currentUser?.uid;

  const [displayName, setDisplayName] = useState(targetUser?.displayName || '');
  const [bio, setBio] = useState(targetUser?.bio || '');
  const [city, setCity] = useState(targetUser?.city || '');
  const [photoURL, setPhotoURL] = useState(targetUser?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    setIsSaving(true);
    await updateProfile({
      displayName: displayName.trim() || targetUser.displayName,
      bio: bio.trim(),
      city: city.trim(),
      photoURL: photoURL.trim() || targetUser.photoURL
    });
    setIsSaving(false);
    toast.success('Profile updated successfully! ✨');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-6 shadow-2xl space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                <User className="w-4 h-4 text-pink-400" />
              </div>
              <h3 className="font-extrabold text-white text-base">
                {isOwnProfile ? 'My Profile' : `${targetUser.displayName}'s Profile`}
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl glass-card text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Avatar */}
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
                    Save Changes
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
