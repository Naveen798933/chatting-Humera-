import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { Memory } from '../types';
import { toast } from '../lib/toast';
import {
  Heart, Image, FolderHeart, Lock, Plus, Star,
  Calendar, MapPin, Sparkles, X, Upload, ZoomIn, Trash2, Download, Play, Pause, ChevronLeft, ChevronRight, Search, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

export const MemoriesGallery: React.FC = () => {
  const { currentUser, isVaultUnlocked, unlockVaultWithPin } = useAuth();
  const { memories, addMemory, deleteMemory, toggleFavoriteMemory } = useUniverse();

  const [activeAlbum, setActiveAlbum] = useState<Memory['album'] | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [lightboxMem, setLightboxMem] = useState<Memory | null>(null);

  // Slideshow state
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowIdx, setSlideshowIdx] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(true);

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
      createdBy: currentUser?.uid || 'user_1'
    });

    toast.love('Memory saved! 📸');
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setImagePreview(null);
    setShowAddModal(false);
  };

  const filteredMemories = memories.filter(m => {
    const matchesAlbum = activeAlbum === 'All' 
      ? m.album !== 'Hidden' 
      : activeAlbum === 'Favorites' 
        ? m.isFavorite 
        : m.album === activeAlbum;

    if (!matchesAlbum) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Slideshow timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSlideshowOpen && isSlideshowPlaying && filteredMemories.length > 0) {
      interval = setInterval(() => {
        setSlideshowIdx(prev => (prev + 1) % filteredMemories.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isSlideshowOpen, isSlideshowPlaying, filteredMemories.length]);

  const currentSlideMem = filteredMemories[slideshowIdx % Math.max(1, filteredMemories.length)];

  return (
    <div className="space-y-6 px-3 sm:px-6 pb-28 sm:pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FolderHeart className="w-6 h-6 text-accent-pink" />
            <span>Memories &amp; Albums</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Our beautiful timeline of captured moments together ❤️
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {filteredMemories.length > 0 && (
            <button
              onClick={() => { setSlideshowIdx(0); setIsSlideshowPlaying(true); setIsSlideshowOpen(true); }}
              className="px-4 py-2.5 rounded-2xl glass-card border border-pink-500/30 text-pink-300 hover:text-white font-bold text-xs shadow-md flex items-center gap-2 min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Slideshow</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Album Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {albumsList.map((alb) => {
            const isActive = activeAlbum === alb;
            const isHidden = alb === 'Hidden';
            const count = alb === 'All'
              ? memories.filter(m => m.album !== 'Hidden').length
              : alb === 'Favorites'
                ? memories.filter(m => m.isFavorite).length
                : memories.filter(m => m.album === alb).length;

            return (
              <button
                key={alb}
                onClick={() => handleOpenAlbum(alb)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 min-h-[40px] ${
                  isActive
                    ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 scale-105'
                    : 'glass-card text-slate-300 hover:text-white active:scale-95'
                } ${isHidden ? 'border border-pink-500/40' : ''}`}
              >
                {isHidden && <Lock className="w-3.5 h-3.5 text-pink-300" />}
                <span>{alb}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredMemories.map((mem) => (
          <motion.div
            key={mem.id}
            className="glass-card rounded-3xl overflow-hidden border border-white/10 flex flex-col group hover:border-pink-400/40 transition-all"
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
                <button
                  onClick={() => { deleteMemory(mem.id); toast.info('Memory removed'); }}
                  className="text-slate-400 hover:text-rose-400 p-1"
                  title="Delete Memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Romantic Full-Screen Slideshow Modal */}
      <AnimatePresence>
        {isSlideshowOpen && currentSlideMem && (
          <motion.div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-fade-in">
            <div className="flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <span className="text-xs font-extrabold text-white">Memory Slideshow ({slideshowIdx + 1} / {filteredMemories.length})</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                  title={isSlideshowPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
                >
                  {isSlideshowPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button
                  onClick={() => setIsSlideshowOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Slide Image */}
            <div className="relative max-w-4xl max-h-[70vh] mx-auto my-auto flex items-center justify-center">
              <img
                src={currentSlideMem.mediaUrls[0]}
                alt={currentSlideMem.title}
                className="max-h-[65vh] w-auto max-w-full rounded-3xl object-contain shadow-2xl border border-white/20"
              />

              {/* Prev / Next controls */}
              <button
                onClick={() => setSlideshowIdx(prev => (prev - 1 + filteredMemories.length) % filteredMemories.length)}
                className="absolute left-2 sm:-left-12 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={() => setSlideshowIdx(prev => (prev + 1) % filteredMemories.length)}
                className="absolute right-2 sm:-right-12 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Slide Caption */}
            <div className="max-w-xl mx-auto text-center space-y-1 z-20">
              <h3 className="text-lg font-extrabold text-white">{currentSlideMem.title}</h3>
              <p className="text-xs text-pink-300 italic">"{currentSlideMem.description}"</p>
              <p className="text-[10px] text-slate-400">{currentSlideMem.date} • {currentSlideMem.album}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Memory Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div className="glass-panel-glow p-6 rounded-3xl max-w-md w-full border border-pink-400/40 space-y-4 max-h-[90dvh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent-pink" />
                  <span>Save New Memory</span>
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Memory Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Stargazing Night by the Lake"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Story / Note</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What made this moment magical?"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Album</label>
                  <select
                    value={album}
                    onChange={(e) => setAlbum(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white"
                  >
                    <option value="Random">Random Moments 📸</option>
                    <option value="Vacations">Vacations &amp; Trips ✈️</option>
                    <option value="Birthdays">Birthdays &amp; Parties 🎂</option>
                    <option value="Favorites">Top Favorites ⭐</option>
                    <option value="Hidden">Hidden Vault (PIN Protected) 🔒</option>
                  </select>
                </div>

                {/* Upload Image Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Photo</label>
                  <input
                    ref={memFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMemFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => memFileInputRef.current?.click()}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-pink-500/30 hover:border-pink-500/60 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-32 rounded-xl object-cover" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-pink-400" />
                        <span className="text-xs font-bold text-slate-300">Tap to upload photo from device</span>
                        <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition-transform"
                >
                  Save to Our Universe Gallery ✨
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Album PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div className="glass-panel p-6 rounded-3xl max-w-sm w-full border border-pink-400/40 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mx-auto text-pink-300">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-bold text-base text-white">Hidden Album Protected</h4>
            <p className="text-xs text-slate-300">Enter your 4-digit vault PIN to access hidden photos.</p>

            {pinError && <p className="text-xs text-rose-400 font-bold">Incorrect PIN. Try again.</p>}

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="****"
                className="w-full text-center tracking-widest text-lg font-bold px-4 py-2.5 rounded-xl glass-input"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2 rounded-xl glass-card text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-md"
                >
                  Unlock
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Lightbox Single Memory Modal */}
      {lightboxMem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxMem(null)}>
          <div className="max-w-3xl w-full glass-panel p-4 rounded-3xl border border-white/20 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white">{lightboxMem.title}</h3>
              <button onClick={() => setLightboxMem(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxMem.mediaUrls[0]}
              alt={lightboxMem.title}
              className="w-full max-h-[60vh] object-contain rounded-2xl"
            />
            <p className="text-xs text-slate-200 italic">{lightboxMem.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};
