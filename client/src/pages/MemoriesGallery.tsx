import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { Memory } from '../types';
import { toast } from '../lib/toast';
import {
  Heart, Image, FolderHeart, Lock, Plus, Star,
  Calendar, MapPin, Sparkles, X, Upload, ZoomIn
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

export const MemoriesGallery: React.FC = () => {
  const { currentUser, isVaultUnlocked, unlockVaultWithPin } = useAuth();
  const { memories, addMemory, toggleFavoriteMemory } = useUniverse();

  const [activeAlbum, setActiveAlbum] = useState<Memory['album'] | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [lightboxMem, setLightboxMem] = useState<Memory | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [album, setAlbum] = useState<Memory['album']>('Random');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const filePickerRef = useRef<HTMLInputElement | null>(null);

  const albumsList: (Memory['album'] | 'All')[] = [
    'All', 'Favorites', 'Vacations', 'Birthdays', 'Random', 'Hidden'
  ];

  const handleOpenAlbum = (albumName: Memory['album'] | 'All') => {
    if (albumName === 'Hidden' && !isVaultUnlocked) {
      setShowPinModal(true);
    } else {
      setActiveAlbum(albumName);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockVaultWithPin(enteredPin)) {
      setShowPinModal(false);
      setActiveAlbum('Hidden');
      setEnteredPin('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image too large! Max 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setUploadPreview(url);
      setMediaUrl(url);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    const url = uploadPreview || mediaUrl.trim();
    if (!title.trim() || !url) {
      toast.error('Title and image are required');
      return;
    }

    addMemory({
      title: title.trim(),
      description: description.trim(),
      mediaUrls: [url],
      type: 'photo',
      album,
      date: new Date().toISOString().split('T')[0],
      isFavorite: album === 'Favorites',
      createdBy: currentUser?.uid ?? 'naveen_uid_798933'
    });

    toast.love('Memory saved! 📸');
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setUploadPreview(null);
    setShowAddModal(false);
  };

  const filteredMemories = memories.filter(m => {
    if (activeAlbum === 'All') return m.album !== 'Hidden';
    if (activeAlbum === 'Favorites') return m.isFavorite;
    return m.album === activeAlbum;
  });

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FolderHeart className="w-6 h-6 text-accent-pink" />
            <span>Memories & Albums</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Our beautiful timeline of captured moments together ❤️
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Memory</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {albumsList.map((alb) => {
          const isActive = activeAlbum === alb;
          const isHidden = alb === 'Hidden';

          return (
            <button
              key={alb}
              onClick={() => handleOpenAlbum(alb)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 min-h-[44px] ${
                isActive
                  ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 scale-105'
                  : 'glass-card text-slate-300 hover:text-white active:scale-95'
              } ${isHidden ? 'border border-pink-500/40' : ''}`}
            >
              {isHidden && <Lock className="w-3.5 h-3.5 text-pink-300" />}
              <span>{alb}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredMemories.map((mem) => (
          <motion.div
            key={mem.id}
            className="glass-card rounded-3xl overflow-hidden border border-white/10 flex flex-col group"
          >
            <div className="relative h-56 overflow-hidden cursor-pointer" onClick={() => setLightboxMem(mem)}>
              <img
                src={mem.mediaUrls[0]}
                alt={mem.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="224" viewBox="0 0 400 224"><rect fill="%230b071a" width="400" height="224"/><text fill="%23a855f7" font-size="14" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">📷 Memory Image</text></svg>';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-80" />

              {/* Lightbox zoom hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <div className="p-3 rounded-full bg-black/50 backdrop-blur-sm">
                  <ZoomIn className="w-6 h-6 text-white" />
                </div>
              </div>

              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold bg-space-950/80 backdrop-blur-md text-pink-300 border border-white/10">
                {mem.album}
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); toggleFavoriteMemory(mem.id); }}
                className="absolute top-3 right-3 p-2 rounded-full bg-space-950/80 backdrop-blur-md text-amber-300 hover:scale-110 transition-transform"
              >
                <Star className={`w-4 h-4 ${mem.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-pink-300 transition-colors">
                  {mem.title}
                </h4>
                <p className="text-xs text-slate-300 italic mt-1 leading-relaxed">
                  "{mem.description}"
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-pink-400" />
                  {mem.date}
                </span>
                <span>Captured with ❤️</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div className="glass-panel-glow p-6 rounded-3xl max-w-md w-full border border-pink-400/40 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-pink" />
                  <span>Add New Memory</span>
                </h3>
                <button onClick={() => { setShowAddModal(false); setUploadPreview(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Memory Title:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Stargazing at the Beach"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    required
                  />
                </div>

                {/* File Upload Section */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Photo / Image:</label>
                  <input ref={filePickerRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  {uploadPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-pink-400/30">
                      <img src={uploadPreview} alt="Preview" className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setUploadPreview(null); setMediaUrl(''); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-500/80"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => filePickerRef.current?.click()}
                      className="w-full py-6 rounded-xl border-2 border-dashed border-pink-500/30 hover:border-pink-500/60 transition-colors flex flex-col items-center gap-2 text-slate-400 hover:text-pink-300"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-semibold">Upload from device</span>
                      <span className="text-[10px]">JPG, PNG, WEBP — max 8MB</span>
                    </button>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1.5 text-center">— or paste a URL —</p>
                  <input
                    type="url"
                    value={uploadPreview ? '' : mediaUrl}
                    onChange={(e) => { setMediaUrl(e.target.value); setUploadPreview(null); }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2 rounded-xl glass-input text-xs mt-1"
                    disabled={Boolean(uploadPreview)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Album Category:</label>
                  <select
                    value={album}
                    onChange={(e) => setAlbum(e.target.value as Memory['album'])}
                    className="w-full px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white"
                  >
                    <option value="Random">Random Moments</option>
                    <option value="Vacations">Vacations</option>
                    <option value="Birthdays">Birthdays</option>
                    <option value="Favorites">Favorites</option>
                    <option value="Hidden">Hidden (PIN Gated)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Love Note:</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What made this moment special?"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs h-20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Save to Memories ❤️
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPinModal && (
          <motion.div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div className="glass-panel-glow p-6 rounded-3xl max-w-sm w-full border border-pink-400/40 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">Hidden Album Protected</h3>
              <p className="text-xs text-slate-300">Enter your 4-digit Universe PIN to view private memories.</p>

              {pinError && (
                <p className="text-xs text-rose-400 font-semibold">Incorrect PIN. Please try again.</p>
              )}

              <form onSubmit={handleVerifyPin} className="space-y-4">
                <input
                  type="password"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center tracking-widest text-lg font-bold px-4 py-3 rounded-2xl glass-input"
                  required
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowPinModal(false)} className="flex-1 py-2.5 rounded-xl glass-card text-slate-300 font-bold text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs">
                    Unlock
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxMem && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setLightboxMem(null)}
          >
            <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setLightboxMem(null)}
                className="absolute -top-10 right-0 text-white/60 hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={lightboxMem.mediaUrls[0]}
                alt={lightboxMem.title}
                className="w-full max-h-[70vh] object-contain rounded-2xl"
              />
              <div className="mt-3 text-center">
                <p className="font-bold text-sm text-white">{lightboxMem.title}</p>
                {lightboxMem.description && <p className="text-xs text-slate-400 mt-1 italic">"{lightboxMem.description}"</p>}
                <p className="text-[10px] text-slate-500 mt-1">{lightboxMem.date}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
};
