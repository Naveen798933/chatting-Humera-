import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { Memory } from '../types';
import { toast } from '../lib/toast';
import {
  Heart, Image, FolderHeart, Lock, Plus, Star,
  Calendar, MapPin, Sparkles, X, Upload, ZoomIn, Trash2, Download
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

export const MemoriesGallery: React.FC = () => {
  const { currentUser, isVaultUnlocked, unlockVaultWithPin } = useAuth();
  const { memories, addMemory, deleteMemory, toggleFavoriteMemory } = useUniverse();

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const memFileInputRef = useRef<HTMLInputElement | null>(null);

  const compressMemoryImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleMemFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image file too large (max 15MB)');
      return;
    }
    toast.info('Compressing photo... 📸');
    const compressed = await compressMemoryImage(file);
    if (compressed) {
      setMediaUrl(compressed);
      setImagePreview(compressed);
      toast.success('Photo ready to save! ✨');
    }
  };

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



  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    const url = mediaUrl.trim();
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
            <motion.div className="glass-panel-glow p-6 rounded-3xl max-w-md w-full border border-pink-400/40 space-y-4 max-h-[90dvh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-pink" />
                  <span>Add New Memory</span>
                </h3>
                <button onClick={() => { setShowAddModal(false); }} className="text-slate-400 hover:text-white">
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

                {/* Photo Upload / URL Section */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Photo from Gallery or Enter Image URL:</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="file"
                      ref={memFileInputRef}
                      onChange={handleMemFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => memFileInputRef.current?.click()}
                      className="flex-1 py-2.5 px-3 rounded-xl glass-card border border-pink-500/30 text-pink-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-pink-500/10 min-h-[44px]"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose from Phone Gallery</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => { setMediaUrl(e.target.value); setImagePreview(e.target.value); }}
                    placeholder="Or paste image URL (https://...)"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    required
                  />
                  {(imagePreview || mediaUrl) && (
                    <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={imagePreview || mediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
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
              <div className="mt-3 text-center space-y-2">
                <p className="font-bold text-sm text-white">{lightboxMem.title}</p>
                {lightboxMem.description && <p className="text-xs text-slate-400 italic">"{lightboxMem.description}"</p>}
                <p className="text-[10px] text-slate-500">{lightboxMem.date}</p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <a
                    href={lightboxMem.mediaUrls[0]}
                    download={`memory_${lightboxMem.title}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl glass-card text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-pink-400" />
                    <span>Save Photo</span>
                  </a>

                  <button
                    onClick={() => {
                      deleteMemory(lightboxMem.id);
                      setLightboxMem(null);
                      toast.info('Memory deleted 🗑️');
                    }}
                    className="px-3 py-1.5 rounded-xl glass-card text-xs font-bold text-rose-300 hover:text-rose-200 hover:border-rose-500/40 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
};
