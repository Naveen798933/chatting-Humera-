import React, { useState } from 'react';
import { X, Plus, Image, Sparkles, Send, Eye } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { UserProfile } from '../types';
import { toast } from '../lib/toast';

export interface StoryItem {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  mediaUrl?: string;
  text?: string;
  bgGradient?: string;
  createdAt: string;
}

interface WhatsAppStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  partnerUser: UserProfile | null;
  stories: StoryItem[];
  onAddStory: (story: Omit<StoryItem, 'id' | 'createdAt'>) => void;
}

export const WhatsAppStatusModal: React.FC<WhatsAppStatusModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  partnerUser,
  stories,
  onAddStory
}) => {
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyImage, setStoryImage] = useState('');
  const [selectedGradient, setSelectedGradient] = useState('from-pink-600 to-purple-800');
  const statusFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const gradients = [
    'from-pink-600 to-purple-800',
    'from-purple-900 to-indigo-800',
    'from-rose-600 to-amber-600',
    'from-emerald-700 to-teal-900',
    'from-indigo-900 to-slate-900'
  ];

  if (!isOpen) return null;

  const handlePostStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyText.trim() && !storyImage.trim()) {
      toast.error('Add text or an image for your status');
      return;
    }
    if (!currentUser) return;

    onAddStory({
      authorId: currentUser.uid,
      authorName: currentUser.petName || currentUser.realName,
      authorPhoto: currentUser.photoURL,
      text: storyText.trim() || undefined,
      mediaUrl: storyImage.trim() || undefined,
      bgGradient: selectedGradient
    });

    toast.love('Status posted! 🌸');
    setStoryText('');
    setStoryImage('');
    setShowCreateModal(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setStoryImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel max-w-md w-full rounded-3xl border border-white/10 p-4 sm:p-6 relative overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
            <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-pink" />
              <span>WhatsApp Status</span>
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-xl glass-card text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stories List */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-2">
            {/* My Status Card */}
            <div className="flex items-center justify-between p-3 rounded-2xl glass-card border border-pink-500/20">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-accent-pink to-accent-purple shrink-0">
                  <img src={currentUser?.photoURL} alt="Me" className="w-full h-full rounded-full object-cover border border-space-950" />
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-accent-pink text-white flex items-center justify-center shadow-md text-xs font-bold"
                  >
                    +
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-white truncate">My Status</p>
                  <p className="text-[10px] text-pink-300 truncate">Tap + to add status update</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-md shrink-0 active:scale-95 transition-all"
              >
                + Add
              </button>
            </div>

            {/* Recent Updates Title */}
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-1">Recent Updates</p>

            {stories.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic glass-card rounded-2xl p-4">
                No recent status updates from {partnerUser?.petName || 'partner'} yet 💕
              </div>
            ) : (
              stories.map((story, idx) => (
                <div
                  key={story.id}
                  onClick={() => setActiveStoryIdx(idx)}
                  className="flex items-center gap-3 p-3 rounded-2xl glass-card hover:border-pink-500/40 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 via-pink-500 to-purple-500 animate-pulse shrink-0">
                    <img src={story.authorPhoto} alt={story.authorName} className="w-full h-full rounded-full object-cover border border-space-950" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-white truncate">{story.authorName}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-pink-300 shrink-0" />
                </div>
              ))
            )}
          </div>

          {/* Post Status Action Button — 100% Visible & Tap-Friendly on Mobile */}
          <div className="pt-3 border-t border-white/10 shrink-0" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-accent-pink via-accent-purple to-indigo-600 text-white font-bold text-xs shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Post New Status Story</span>
            </button>
          </div>

          {/* Fullscreen Story Viewer Modal */}
          {activeStoryIdx !== null && stories[activeStoryIdx] && (
            <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
              {/* Progress bar line */}
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden mb-4 shrink-0">
                <div className="h-full bg-pink-500 animate-pulse w-full" />
              </div>

              {/* Story Header */}
              <div className="flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <img src={stories[activeStoryIdx].authorPhoto} className="w-10 h-10 rounded-full border border-pink-400 object-cover" />
                  <div>
                    <p className="font-bold text-sm text-white">{stories[activeStoryIdx].authorName}</p>
                    <p className="text-[10px] text-slate-300">{new Date(stories[activeStoryIdx].createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                <button onClick={() => setActiveStoryIdx(null)} className="p-2 rounded-full glass-card text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Story Body Content */}
              <div className={`flex-1 my-4 sm:my-6 rounded-3xl flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br ${stories[activeStoryIdx].bgGradient || 'from-pink-600 to-purple-900'} relative overflow-hidden shadow-2xl min-h-[300px]`}>
                {stories[activeStoryIdx].mediaUrl && (
                  <img src={stories[activeStoryIdx].mediaUrl} className="max-h-[60vh] max-w-full object-contain rounded-2xl shadow-2xl" />
                )}
                {stories[activeStoryIdx].text && (
                  <p className="text-lg sm:text-2xl font-extrabold text-white text-center drop-shadow-lg leading-relaxed">
                    "{stories[activeStoryIdx].text}"
                  </p>
                )}
              </div>

              <button
                onClick={() => setActiveStoryIdx(null)}
                className="w-full py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs shrink-0"
              >
                Close Viewer
              </button>
            </div>
          )}

          {/* Create Status Modal — Mobile Responsive Form */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
              <div className="flex items-center justify-between shrink-0 mb-3">
                <h4 className="font-extrabold text-white text-base">New Status Update</h4>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full glass-card text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePostStory} className="space-y-4 my-auto w-full max-w-md mx-auto">
                <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${selectedGradient} flex flex-col items-center justify-center gap-4 border border-white/20 min-h-[180px] sm:min-h-[220px]`}>
                  {storyImage && (
                    <img src={storyImage} className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-2xl border-2 border-white/40 shadow-xl" />
                  )}
                  <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="Type your status thought..."
                    className="w-full bg-transparent text-center text-base sm:text-lg font-bold text-white placeholder-white/60 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                {/* Gradient Selector */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {gradients.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGradient(g)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2 ${selectedGradient === g ? 'border-white scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}>
                  <button
                    type="button"
                    onClick={() => statusFileInputRef.current?.click()}
                    className="p-3.5 rounded-2xl glass-card text-white hover:border-pink-400 shrink-0"
                    title="Upload Photo for Status"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={statusFileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-accent-pink via-accent-purple to-indigo-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Share Status</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
