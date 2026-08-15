import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { toast } from '../lib/toast';
import { sounds } from '../lib/soundEffects';
import { Memory } from '../types';
import confetti from 'canvas-confetti';
import {
  Heart, Sun, Moon, CloudSun, Smile, Sparkles,
  Send, Music, Gift, MapPin, Zap, MessageCircle, Image, Mic, BatteryCharging, Cookie
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

const DAILY_QUOTES = [
  "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
  "You are my sun, my moon, and all my stars.",
  "Every love story is beautiful, but ours is my absolute favorite.",
  "I loved you yesterday, love you still, always have, always will.",
  "Whatever our souls are made of, yours and mine are the same."
];

const LOVE_FORTUNES = [
  { fortune: "A deep, romantic conversation tonight will bring you both even closer than ever.", numbers: "14, 02, 26, 99" },
  { fortune: "Your bond with Jaanu grows stronger with every passing heartbeat.", numbers: "07, 11, 21, 30" },
  { fortune: "A spontaneous kiss or voice note will turn ordinary hours into magical memories.", numbers: "03, 14, 18, 24" },
  { fortune: "The universe is aligning to bring a dream trip or milestone celebration into reality soon!", numbers: "09, 15, 20, 33" },
  { fortune: "Every smile shared between Naveen & Humera creates ripples of joy across the cosmos.", numbers: "05, 14, 28, 77" }
];

export const HomeDashboard: React.FC = () => {
  const { currentUser, partnerUser, updateMood } = useAuth();
  const { anniversaryDate, setAnniversaryDate, sendQuickAction, memories, messages, recentNotification } = useUniverse();

  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [editingMood, setEditingMood] = useState(false);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [tempDate, setTempDate] = useState(anniversaryDate.slice(0, 10));
  const [moodEmoji, setMoodEmoji] = useState('💖');
  const [moodText, setMoodText] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [surpriseMemory, setSurpriseMemory] = useState<Memory | null>(null);

  // Love Battery State
  const [loveBattery, setLoveBattery] = useState(() => {
    try {
      const saved = localStorage.getItem('ou_love_battery');
      return saved ? parseInt(saved, 10) : 95;
    } catch {
      return 95;
    }
  });

  // Fortune Cookie State
  const [fortuneCracked, setFortuneCracked] = useState(false);
  const [currentFortune, setCurrentFortune] = useState(() => LOVE_FORTUNES[0]);

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
    setCurrentFortune(LOVE_FORTUNES[dayOfYear % LOVE_FORTUNES.length]);
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

  const handleBoostBattery = () => {
    setLoveBattery(100);
    try { localStorage.setItem('ou_love_battery', '100'); } catch (_) {}
    sounds.playKissSound();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    toast.love('⚡ Love Battery Charged to 100%! Maximum Love Power!');
  };

  const handleCrackFortune = () => {
    if (!fortuneCracked) {
      setFortuneCracked(true);
      sounds.playSecretBurnSound();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      toast.love('🥠 Fortune Cookie Cracked!');
    }
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
              {currentUser?.petName} &amp; {partnerUser?.petName}
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

          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto">
            {[
              { value: timeTogether.days, label: 'Days', color: 'text-white', glow: 'shadow-pink-500/30 border-pink-500/30', from: 'from-pink-500', to: 'to-purple-600' },
              { value: timeTogether.hours, label: 'Hours', color: 'text-pink-300', glow: 'shadow-purple-500/30 border-purple-500/30', from: 'from-purple-500', to: 'to-indigo-600' },
              { value: timeTogether.minutes, label: 'Mins', color: 'text-purple-300', glow: 'shadow-indigo-500/30 border-indigo-500/30', from: 'from-indigo-500', to: 'to-blue-600' },
              { value: timeTogether.seconds, label: 'Secs', color: 'text-rose-300', glow: 'shadow-rose-500/30 border-rose-500/30', from: 'from-rose-500', to: 'to-pink-600', pulse: true },
            ].map(({ value, label, color, glow, from, to, pulse }) => (
              <div key={label} className={`relative overflow-hidden glass-card p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border ${glow} shadow-lg text-center group`}>
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${from} ${to} opacity-80`} />
                <p className={`text-xl sm:text-4xl font-extrabold tracking-tight ${color} ${pulse ? 'animate-pulse' : ''} tabular-nums`}>
                  {String(value).padStart(2, '0')}
                </p>
                <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Love Battery & Daily Fortune Cookie Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Interactive Love Battery Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              <span>Couple Love Battery</span>
            </h4>
            <span className="text-xs font-extrabold text-emerald-300">{loveBattery}%</span>
          </div>

          <div className="h-4 bg-space-950 rounded-full p-1 border border-white/10 relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-pink-500 transition-all duration-1000 shadow-md shadow-emerald-500/40"
              style={{ width: `${loveBattery}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-300">
              {loveBattery >= 90 ? '⚡ Maximum charge & affection!' : '💖 Send a boost to recharge!'}
            </p>
            <button
              onClick={handleBoostBattery}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Recharge ⚡</span>
            </button>
          </div>
        </div>

        {/* Daily Love Fortune Cookie */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Cookie className="w-4 h-4 text-amber-400" />
              <span>Daily Love Fortune</span>
            </h4>
            <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
              {fortuneCracked ? 'Unlocked' : 'Tap to Crack'}
            </span>
          </div>

          {!fortuneCracked ? (
            <div
              onClick={handleCrackFortune}
              className="p-4 rounded-2xl glass-card border border-amber-500/30 hover:border-amber-500/60 cursor-pointer flex items-center justify-center gap-3 text-center transition-all hover:scale-[1.02]"
            >
              <span className="text-3xl animate-bounce">🥠</span>
              <div className="text-left">
                <p className="font-bold text-xs text-white">Crack Open Today's Love Cookie</p>
                <p className="text-[10px] text-amber-300">Reveal a romantic prophecy for you &amp; partner</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-1.5 animate-fade-in">
              <p className="text-xs text-amber-100 font-semibold italic">"{currentFortune.fortune}"</p>
              <p className="text-[10px] text-amber-300/80 font-bold">Lucky Love Numbers: {currentFortune.numbers}</p>
            </div>
          )}
        </div>
      </div>

      {/* "On This Day" Memory Throwback Feature */}
      {memories.length > 0 && (() => {
        const todayMD = new Date().toISOString().slice(5, 10);
        const throwback = memories.find(m => m.date && m.date.slice(5, 10) === todayMD) || memories[0];
        if (!throwback) return null;
        return (
          <div className="glass-panel-glow p-5 sm:p-6 rounded-3xl border border-pink-400/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-pink-400 shadow-md">
                <img
                  src={throwback.mediaUrls?.[0]}
                  alt={throwback.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%230b071a" width="100" height="100"/><text fill="%23ff70a6" font-size="30" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">📸</text></svg>';
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-pink-300">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>On This Day Throwback</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-500/30">{throwback.date}</span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white truncate mt-0.5">{throwback.title}</h4>
                <p className="text-xs text-slate-300 italic truncate max-w-md mt-0.5">"{throwback.description}"</p>
              </div>
            </div>
            <button
              onClick={() => setSurpriseMemory(throwback)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all shrink-0 w-full sm:w-auto"
            >
              Relive Memory ❤️
            </button>
          </div>
        );
      })()}

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

        {/* Couple Connection Card */}
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

      {/* Real-time Relationship Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Messages', value: messages.length, icon: <MessageCircle className="w-4 h-4" />, color: 'text-pink-300', bg: 'bg-pink-500/10 border-pink-500/20' },
          { label: 'Photos', value: messages.filter(m => m.type === 'image').length, icon: <Image className="w-4 h-4" />, color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'Voice Notes', value: messages.filter(m => m.type === 'audio').length, icon: <Mic className="w-4 h-4" />, color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Stars', value: messages.filter(m => m.isStarred).length, icon: <Sparkles className="w-4 h-4" />, color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(stat => (
          <div key={stat.label} className={`glass-panel glass-card-tilt p-4 rounded-2xl border ${stat.bg} flex flex-col items-center justify-center gap-1.5 text-center`}>
            <span className={stat.color}>{stat.icon}</span>
            <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>{stat.value.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{stat.label}</p>
          </div>
        ))}
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
                Close &amp; Relive Memory
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
