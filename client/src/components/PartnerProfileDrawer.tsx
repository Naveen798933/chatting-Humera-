import React from 'react';
import { X, Phone, Video, MapPin, Heart, Lock, Star, Image, BellOff, Bell, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { UserProfile, Memory } from '../types';

interface PartnerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partnerUser: UserProfile | null;
  memories: Memory[];
  starredCount: number;
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
}

export const PartnerProfileDrawer: React.FC<PartnerProfileDrawerProps> = ({
  isOpen,
  onClose,
  partnerUser,
  memories,
  starredCount,
  onStartVoiceCall,
  onStartVideoCall
}) => {
  const [isMuted, setIsMuted] = React.useState(false);

  if (!isOpen || !partnerUser) return null;

  const sharedPhotos = memories.flatMap(m => m.mediaUrls || []).slice(0, 6);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="w-full max-w-md bg-space-950 h-full border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto"
        >
          <div className="space-y-6">
            {/* Header Close */}
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base">Contact Info</h3>
              <button onClick={onClose} className="p-2 rounded-xl glass-card text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar & Info */}
            <div className="text-center space-y-3">
              <div className="relative w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-accent-pink to-accent-purple shadow-2xl">
                <img src={partnerUser.photoURL} alt={partnerUser.realName} className="w-full h-full rounded-full object-cover border-4 border-space-950" />
                <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-space-950 ${partnerUser.online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white">{partnerUser.petName}</h2>
                <p className="text-xs text-pink-300 font-medium">({partnerUser.realName})</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  <span>{partnerUser.city}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={onStartVoiceCall}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl glass-card hover:border-emerald-400/40 min-w-[70px]"
                >
                  <Phone className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-200">Audio</span>
                </button>

                <button
                  onClick={onStartVideoCall}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl glass-card hover:border-pink-400/40 min-w-[70px]"
                >
                  <Video className="w-5 h-5 text-pink-400" />
                  <span className="text-[10px] font-bold text-slate-200">Video</span>
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl glass-card hover:border-amber-400/40 min-w-[70px]"
                >
                  {isMuted ? <BellOff className="w-5 h-5 text-amber-400" /> : <Bell className="w-5 h-5 text-slate-300" />}
                  <span className="text-[10px] font-bold text-slate-200">{isMuted ? 'Muted' : 'Mute'}</span>
                </button>
              </div>
            </div>

            {/* Current Mood Status */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">About & Mood</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-2xl">{partnerUser.mood?.emoji || '💕'}</span>
                <p className="text-xs font-semibold text-white italic">"{partnerUser.mood?.text || 'Loving you always'}"</p>
              </div>
            </div>

            {/* Shared Media Gallery Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-pink-400" />
                  <span>Shared Media</span>
                </span>
                <span className="text-pink-300 text-[11px]">{sharedPhotos.length} Photos</span>
              </div>

              {sharedPhotos.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No shared photos yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {sharedPhotos.map((url, idx) => (
                    <img key={idx} src={url} className="w-full h-20 rounded-xl object-cover border border-white/10" />
                  ))}
                </div>
              )}
            </div>

            {/* Encryption & Starred Messages */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between p-3 rounded-2xl glass-card text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Star className="w-4 h-4 text-amber-300" />
                  <span>Starred Messages</span>
                </div>
                <span className="font-bold text-amber-300">{starredCount}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Messages and calls are end-to-end encrypted in Our Universe.</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs mt-6"
          >
            Close Contact Info
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
