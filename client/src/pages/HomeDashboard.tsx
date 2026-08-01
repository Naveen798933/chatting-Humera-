import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { 
  Heart, Sun, Moon, CloudSun, Smile, Sparkles, 
  Send, Music, Gift, Volume2 
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
  const { anniversaryDate, sendQuickAction, memories, recentNotification } = useUniverse();

  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [editingMood, setEditingMood] = useState(false);
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
  };

  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <AnimatePresence>
        {recentNotification && (
          <motion.div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-panel-glow px-6 py-3 rounded-full border border-pink-400/40 text-white font-bold text-sm shadow-2xl flex items-center gap-3">
            <span className="text-xl animate-bounce">
              {recentNotification.type === 'kiss' ? '💋' : recentNotification.type === 'hug' ? '🤗' : recentNotification.type === 'miss_you' ? '❤️' : '🎉'}
            </span>
            <span>
              {recentNotification.senderId === currentUser?.uid ? 'You sent a' : 'Partner sent a'} {recentNotification.type.replace('_', ' ').toUpperCase()}!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser?.photoURL}
                alt={currentUser?.realName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-accent-pink shadow-xl shadow-pink-500/30"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-space-950 rounded-full" />
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-purple p-0.5 shadow-lg flex items-center justify-center animate-heartbeat">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>

            <div className="relative">
              <img
                src={partnerUser?.photoURL}
                alt={partnerUser?.realName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-accent-purple shadow-xl shadow-purple-500/30"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-space-950 rounded-full" />
            </div>
          </div>

          <div className="text-center sm:text-right">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 bg-clip-text text-transparent">
              {currentUser?.petName} & {partnerUser?.petName}
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1 flex items-center justify-center sm:justify-end gap-1.5">
              <span>{currentUser?.city}</span>
              <span>•</span>
              <span>{partnerUser?.city}</span>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-pink-300 mb-3">
            Together For
          </p>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl mx-auto">
            <div className="glass-card p-3 sm:p-4 rounded-2xl">
              <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{timeTogether.days}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase mt-1">Days</p>
            </div>
            <div className="glass-card p-3 sm:p-4 rounded-2xl">
              <p className="text-2xl sm:text-4xl font-extrabold text-pink-300 tracking-tight">{timeTogether.hours}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase mt-1">Hours</p>
            </div>
            <div className="glass-card p-3 sm:p-4 rounded-2xl">
              <p className="text-2xl sm:text-4xl font-extrabold text-purple-300 tracking-tight">{timeTogether.minutes}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase mt-1">Mins</p>
            </div>
            <div className="glass-card p-3 sm:p-4 rounded-2xl">
              <p className="text-2xl sm:text-4xl font-extrabold text-rose-300 tracking-tight animate-pulse">{timeTogether.seconds}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase mt-1">Secs</p>
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

        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CloudSun className="w-4 h-4 text-sky-400" />
            <span>Couple Weather</span>
          </h4>
          <div className="space-y-3 my-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Naveen (Hyd):</span>
              <span className="font-bold text-amber-300">28°C ☀️ Sunny</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Humera (Blr):</span>
              <span className="font-bold text-sky-300">24°C 🌤️ Pleasant</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic">280 km away, 0 km apart in heart ❤️</p>
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
              <div className="glass-card p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentUser?.mood.emoji}</span>
                  <span className="text-xs font-bold text-pink-200">{currentUser?.petName}</span>
                </div>
                <p className="text-xs text-slate-300 italic">"{currentUser?.mood.text}"</p>
              </div>

              <div className="glass-card p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{partnerUser?.mood.emoji}</span>
                  <span className="text-xs font-bold text-purple-200">{partnerUser?.petName}</span>
                </div>
                <p className="text-xs text-slate-300 italic">"{partnerUser?.mood.text}"</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveMood} className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={moodEmoji}
                  onChange={(e) => setMoodEmoji(e.target.value)}
                  className="w-12 text-center py-2 rounded-xl glass-input text-lg"
                  placeholder="💖"
                />
                <input
                  type="text"
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                  placeholder="What's on your mind?"
                  className="flex-1 px-4 py-2 rounded-xl glass-input text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-md"
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

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => sendQuickAction('miss_you')}
              className="p-3.5 rounded-2xl glass-card border border-pink-500/20 hover:border-pink-500/50 flex items-center gap-3 hover:scale-105 transition-all text-left"
            >
              <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
                <Heart className="w-5 h-5 animate-pulse-heart fill-current" />
              </div>
              <div>
                <p className="font-bold text-xs text-white">I Miss You</p>
                <p className="text-[10px] text-slate-400">Heartbeat sync</p>
              </div>
            </button>

            <button
              onClick={() => sendQuickAction('hug')}
              className="p-3.5 rounded-2xl glass-card border border-purple-500/20 hover:border-purple-500/50 flex items-center gap-3 hover:scale-105 transition-all text-left"
            >
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                <span className="text-xl">🤗</span>
              </div>
              <div>
                <p className="font-bold text-xs text-white">Send Hug</p>
                <p className="text-[10px] text-slate-400">Warm hug effect</p>
              </div>
            </button>

            <button
              onClick={() => sendQuickAction('kiss')}
              className="p-3.5 rounded-2xl glass-card border border-rose-500/20 hover:border-rose-500/50 flex items-center gap-3 hover:scale-105 transition-all text-left"
            >
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <span className="text-xl">💋</span>
              </div>
              <div>
                <p className="font-bold text-xs text-white">Send Kiss</p>
                <p className="text-[10px] text-slate-400">Confetti explosion</p>
              </div>
            </button>

            <button
              onClick={handleSurpriseMode}
              className="p-3.5 rounded-2xl glass-card border border-amber-500/20 hover:border-amber-500/50 flex items-center gap-3 hover:scale-105 transition-all text-left"
            >
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Surprise Mode</p>
                <p className="text-[10px] text-slate-400">Random memory</p>
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
