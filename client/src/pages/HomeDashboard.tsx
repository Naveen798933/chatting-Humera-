import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { toast } from '../lib/toast';
import {
  Heart, Sun, Moon, CloudSun, Smile, Sparkles,
  Send, Music, Gift, MapPin, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

const DAILY_QUOTES = [
  "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
  "You are my sun, my moon, and all my stars.",
  "Every love story is beautiful, but ours is my absolute favorite.",
  "I loved you yesterday, love you still, always have, always will.",
  "Whatever our souls are made of, yours and mine are the same."
];

export const HomeDashboard: React.FC = () => {
  const { currentUser, partnerUser, updateMood } = useAuth();
  const { anniversaryDate, setAnniversaryDate, sendQuickAction, memories, recentNotification } = useUniverse();

  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [editingMood, setEditingMood] = useState(false);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [tempDate, setTempDate] = useState(anniversaryDate);
  const [moodEmoji, setMoodEmoji] = useState('💖');
  const [moodText, setMoodText] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [surpriseMemory, setSurpriseMemory] = useState<any | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(anniversaryDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeTogether({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [anniversaryDate]);

  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setQuoteIndex(dayOfYear % DAILY_QUOTES.length);
  }, []);

  const handleSaveMood = (e: React.FormEvent) => {
    e.preventDefault();
    if (moodText.trim()) {
      updateMood(moodEmoji, moodText.trim());
      setEditingMood(false);
    }
  };

  const handleSurpriseMode = () => {
    sendQuickAction('surprise');
    if (memories.length > 0) {
      const random = memories[Math.floor(Math.random() * memories.length)];
      setSurpriseMemory(random);
    }
    toast.love('Surprise sent! 🎉');
  };

  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <AnimatePresence>
        {recentNotification && (
          <motion.div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-panel-glow px-4 sm:px-6 py-3 rounded-full border border-pink-400/40 text-white font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 sm:gap-3 max-w-[calc(100vw-2rem)] w-max">
            <span className="text-xl animate-bounce">
              {recentNotification.type === 'kiss' ? '💋' : recentNotification.type === 'hug' ? '🤗' : recentNotification.type === 'miss_you' ? '❤️' : '🎉'}
            </span>
            <span>
              {recentNotification.senderId === currentUser?.uid ? 'You sent a' : 'Partner sent a'} {recentNotification.type.replace('_', ' ').toUpperCase()}!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <img
                src={currentUser?.photoURL}
                alt={currentUser?.realName}
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-3 sm:border-4 border-accent-pink shadow-xl shadow-pink-500/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.realName || 'Naveen')}&background=ff70a6&color=fff`;
                }}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-space-950 rounded-full" />
            </div>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-purple p-0.5 shadow-lg flex items-center justify-center animate-heartbeat flex-shrink-0">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current" />
            </div>

            <div className="relative">
              <img
                src={partnerUser?.photoURL}
                alt={partnerUser?.realName}
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-3 sm:border-4 border-accent-purple shadow-xl shadow-purple-500/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser?.realName || 'Humera')}&background=a855f7&color=fff`;
                }}
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-2 border-space-950 rounded-full ${
                partnerUser?.online ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            </div>
          </div>

          <div className="text-center sm:text-right min-w-0">
            <h2 className="text-base sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 bg-clip-text text-transparent truncate">
              {currentUser?.petName} & {partnerUser?.petName}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1 flex flex-wrap items-center justify-center sm:justify-end gap-1">
              <span className="truncate max-w-[140px] sm:max-w-none">{currentUser?.city}</span>
              <span>•</span>
              <span className="truncate max-w-[140px] sm:max-w-none">{partnerUser?.city}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2.5 sm:mb-3">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-pink-300">
              Together For
            </p>
            <button
              onClick={() => setShowDateEditor(!showDateEditor)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
              title="Edit Anniversary Date"
            >
              ✏️ {showDateEditor ? 'Close' : 'Edit Date'}
            </button>
          </div>

          {showDateEditor && (
            <div className="max-w-xs mx-auto mb-4 p-3 rounded-2xl glass-card border border-pink-500/30 flex items-center gap-2">
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl glass-input text-xs"
              />
              <button
                onClick={() => {
                  if (tempDate) {
                    setAnniversaryDate(tempDate);
                    setShowDateEditor(false);
                    toast.love('Anniversary date updated! ❤️');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-md"
              >
                Save
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto">
            <div className="glass-card p-2.5 sm:p-4 rounded-xl sm:rounded-2xl">
              <p className="text-xl sm:text-4xl font-extrabold text-white tracking-tight">{timeTogether.days}</p>
              <p className="text-[9px] sm:text-xs text-slate-400 font-medium uppercase mt-0.5 sm:mt-1">Days</p>
            </div>
            <div className="glass-card p-2.5 sm:p-4 rounded-xl sm:rounded-2xl">
              <p className="text-xl sm:text-4xl font-extrabold text-pink-300 tracking-tight">{timeTogether.hours}</p>
              <p className="text-[9px] sm:text-xs text-slate-400 font-medium uppercase mt-0.5 sm:mt-1">Hours</p>
            </div>
            <div className="glass-card p-2.5 sm:p-4 rounded-xl sm:rounded-2xl">
              <p className="text-xl sm:text-4xl font-extrabold text-purple-300 tracking-tight">{timeTogether.minutes}</p>
              <p className="text-[9px] sm:text-xs text-slate-400 font-medium uppercase mt-0.5 sm:mt-1">Mins</p>
            </div>
            <div className="glass-card p-2.5 sm:p-4 rounded-xl sm:rounded-2xl">
              <p className="text-xl sm:text-4xl font-extrabold text-rose-300 tracking-tight animate-pulse">{timeTogether.seconds}</p>
              <p className="text-[9px] sm:text-xs text-slate-400 font-medium uppercase mt-0.5 sm:mt-1">Secs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-2 max-w-md">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-pink-300 border border-white/10">
              {isMorning ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : isAfternoon ? <CloudSun className="w-3.5 h-3.5 text-orange-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
              {isMorning ? 'Good Morning' : isAfternoon ? 'Good Afternoon' : 'Good Night'}
            </span>
            <h3 className="text-lg font-bold text-white">
              {isMorning ? 'A brand new day to love you more ☀️' : isAfternoon ? 'Hope your day is going wonderfully 💕' : 'Sweet dreams my love 🌌'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{DAILY_QUOTES[quoteIndex]}"
            </p>
          </div>
          <div className="hidden sm:block text-5xl">
            {isMorning ? '🌅' : isAfternoon ? '🌤️' : '🌙'}
          </div>
        </div>

        {/* Couple Connection Card — replaces fake weather */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between gap-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-pink-400" />
            <span>Our Distance</span>
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏙️</span>
              <div>
                <p className="text-xs font-bold text-white">{currentUser?.realName}</p>
                <p className="text-[10px] text-slate-400">{currentUser?.city}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <div className="w-px h-4 bg-pink-500/30" />
                <Heart className="w-4 h-4 text-pink-400 fill-current animate-heartbeat" />
                <div className="w-px h-4 bg-pink-500/30" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🌆</span>
              <div>
                <p className="text-xs font-bold text-white">{partnerUser?.realName}</p>
                <p className="text-[10px] text-slate-400">{partnerUser?.city}</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-pink-300/70 italic text-center truncate" title="Vijayawada ↔ Medchal • 0 km apart in heart ❤️">Vijayawada ↔ Medchal • 0 km apart in heart ❤️</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Smile className="w-4 h-4 text-accent-pink" />
              <span>Current Moods</span>
            </h4>
            <button
              onClick={() => setEditingMood(!editingMood)}
              className="text-xs font-semibold text-accent-pink hover:underline"
            >
              {editingMood ? 'Cancel' : 'Update Mood'}
            </button>
          </div>

          {!editingMood ? (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="glass-card p-4 rounded-2xl space-y-1 border border-pink-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">{currentUser?.mood.emoji || '💖'}</span>
                  <span className="text-xs font-bold text-pink-200">{currentUser?.petName}</span>
                </div>
                <p className="text-xs text-slate-300 italic">"{currentUser?.mood.text || 'Thinking of you'}"</p>
              </div>

              <div className="glass-card p-4 rounded-2xl space-y-1 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">{partnerUser?.mood.emoji || '💕'}</span>
                  <span className="text-xs font-bold text-purple-200">{partnerUser?.petName}</span>
                </div>
                <p className="text-xs text-slate-300 italic">"{partnerUser?.mood.text || 'Loving you always'}"</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveMood} className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={moodEmoji}
                  onChange={(e) => setMoodEmoji(e.target.value)}
                  className="w-12 text-center py-2 rounded-xl glass-input text-lg font-bold"
                  placeholder="💖"
                />
                <input
                  type="text"
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                  placeholder="What's on your heart?"
                  className="flex-1 px-4 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              {/* Quick Mood Presets */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { emoji: '💖', label: 'Loving' },
                  { emoji: '🥺', label: 'Missing You' },
                  { emoji: '😊', label: 'Happy' },
                  { emoji: '😴', label: 'Tired' },
                  { emoji: '☕', label: 'Busy' },
                  { emoji: '🎉', label: 'Excited' }
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setMoodEmoji(preset.emoji);
                      setMoodText(preset.label);
                    }}
                    className="p-1.5 rounded-xl glass-card text-[10px] font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1 hover:border-pink-400/40"
                  >
                    <span>{preset.emoji}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-transform"
              >
                Save Mood Status
              </button>
            </form>
          )}
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>One-Tap Love Express</span>
          </h4>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              onClick={() => sendQuickAction('miss_you')}
              className="p-3 rounded-2xl glass-card border border-pink-500/20 hover:border-pink-500/50 flex items-center gap-2.5 sm:gap-3 hover:scale-105 active:scale-95 transition-all text-left min-h-[56px]"
            >
              <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 flex-shrink-0">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse-heart fill-current" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-white truncate">I Miss You</p>
                <p className="text-[10px] text-slate-400 truncate">Heartbeat sync</p>
              </div>
            </button>

            <button
              onClick={() => sendQuickAction('hug')}
              className="p-3 rounded-2xl glass-card border border-purple-500/20 hover:border-purple-500/50 flex items-center gap-2.5 sm:gap-3 hover:scale-105 active:scale-95 transition-all text-left min-h-[56px]"
            >
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 flex-shrink-0">
                <span className="text-lg sm:text-xl">🤗</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-white truncate">Send Hug</p>
                <p className="text-[10px] text-slate-400 truncate">Warm hug effect</p>
              </div>
            </button>

            <button
              onClick={() => sendQuickAction('kiss')}
              className="p-3 rounded-2xl glass-card border border-rose-500/20 hover:border-rose-500/50 flex items-center gap-2.5 sm:gap-3 hover:scale-105 active:scale-95 transition-all text-left min-h-[56px]"
            >
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0">
                <span className="text-lg sm:text-xl">💋</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-white truncate">Send Kiss</p>
                <p className="text-[10px] text-slate-400 truncate">Confetti explosion</p>
              </div>
            </button>

            <button
              onClick={handleSurpriseMode}
              className="p-3 rounded-2xl glass-card border border-amber-500/20 hover:border-amber-500/50 flex items-center gap-2.5 sm:gap-3 hover:scale-105 active:scale-95 transition-all text-left min-h-[56px]"
            >
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-white truncate">Surprise</p>
                <p className="text-[10px] text-slate-400 truncate">Random memory</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {surpriseMemory && (
          <motion.div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div className="glass-panel-glow p-6 rounded-3xl max-w-md w-full border border-pink-400/50 text-center space-y-4">
              <span className="text-3xl">🎉</span>
              <h3 className="text-lg font-extrabold text-white">Surprise Memory Unlocked!</h3>
              
              {surpriseMemory.mediaUrls?.[0] && (
                <img
                  src={surpriseMemory.mediaUrls[0]}
                  alt={surpriseMemory.title}
                  className="w-full h-48 rounded-2xl object-cover border border-white/20"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect fill="%230b071a" width="400" height="200"/><text fill="%23ff70a6" font-size="14" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">❤️ Surprise Memory</text></svg>';
                  }}
                />
              )}

              <p className="font-bold text-sm text-pink-300">{surpriseMemory.title}</p>
              <p className="text-xs text-slate-300 italic">"{surpriseMemory.description}"</p>

              <button
                onClick={() => setSurpriseMemory(null)}
                className="w-full py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs"
              >
                Close & Relive Memory
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
