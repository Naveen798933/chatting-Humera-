import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { toast } from '../lib/toast';
import { sounds } from '../lib/soundEffects';
import { Memory } from '../types';
import confetti from 'canvas-confetti';
import {
  Heart, Sun, Moon, CloudSun, Smile, Sparkles,
  Send, Music, Gift, MapPin, Zap, MessageCircle, Image, Mic, BatteryCharging, Cookie,
  Flame, Target, Trophy, ChevronRight, BookHeart, Activity, Copy, Check
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

const LOVE_CHALLENGES = [
  { emoji: "📝", title: "Write a haiku", desc: "Write a 3-line haiku about something you love about your partner." },
  { emoji: "🎵", title: "Dedicate a song", desc: "Send your partner a song that reminds you of them right now." },
  { emoji: "📸", title: "Capture a moment", desc: "Share a photo of where you are right now — let them see your world." },
  { emoji: "💌", title: "Love letter", desc: "Write 5 sentences about why today reminded you of your love." },
  { emoji: "🌟", title: "Compliment blitz", desc: "Name 3 things you find incredibly beautiful about your partner." },
  { emoji: "🍕", title: "Plan a date", desc: "Plan your next virtual or in-person date together — right now!" },
  { emoji: "🔮", title: "Future vision", desc: "Describe one dream you have of your future together." },
];

const LOVE_LETTERS = [
  "My dearest love, every sunrise reminds me of you — warm, gentle, and impossibly beautiful. The distance between us is just a number; my heart has no miles. In every heartbeat I find your name, in every star I see your smile. You are the poetry the universe wrote just for me. Forever yours. ❤️",
  "To the one who makes ordinary days extraordinary — just thinking of your laugh fills my entire world with light. I carry you with me everywhere I go, like a secret too precious to share with anyone else. Until I hold you again, I hold you in every thought. All my love. 💕",
  "Jaanu, time apart only makes me realize how completely you've become my home. I don't need a map when I have you — you're the direction, the destination, and everything beautiful along the way. Today, tomorrow, and every day after, I choose you. With all that I am. 🌙",
  "My love, I've been thinking about the way you make me feel safe even from miles away. Your voice is my favourite sound, your name my favourite word. I am endlessly grateful the universe conspired to bring us together. Forever isn't long enough. Yours always. ✨",
  "To my person — on hard days I close my eyes and picture your smile, and everything feels lighter. You are my peace in a noisy world, my warmth in every cold moment. This love we have is the greatest adventure I've ever been on. Still falling for you every single day. 💖",
];

// ── RadialProgress Component ─────────────────────────────────────────────────
function RadialProgress({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="radial-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="radGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff70a6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle className="radial-progress-track" cx={size/2} cy={size/2} r={radius} strokeWidth="8" />
        <circle
          className="radial-progress-fill"
          cx={size/2} cy={size/2} r={radius}
          strokeWidth="8"
          stroke={score >= 80 ? 'url(#radGrad)' : color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-white leading-none">{score}</span>
        <span className="text-[8px] text-slate-400 uppercase tracking-wider">score</span>
      </div>
    </div>
  );
}

// ── Helper: days since a date ─────────────────────────────────────────────────
function daysSince(dateStr: string): number {
  const start = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

// ── Helper: days until next anniversary month marker ─────────────────────────
function getNextMilestone(anniversaryDate: string): { label: string; daysLeft: number } | null {
  const start = new Date(anniversaryDate);
  if (isNaN(start.getTime())) return null;
  const now = new Date();
  const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  
  // Look for next milestone at: 3, 6, 12, 18, 24, 36, 48, 60 months, etc.
  const milestones = [3, 6, 9, 12, 18, 24, 30, 36, 42, 48, 54, 60, 72, 84, 96, 108, 120];
  const nextMonths = milestones.find(m => m > totalMonths);
  if (!nextMonths) return null;

  const nextDate = new Date(start);
  nextDate.setMonth(nextDate.getMonth() + nextMonths);
  const daysLeft = Math.max(0, Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  const years = Math.floor(nextMonths / 12);
  const months = nextMonths % 12;
  const label = years > 0
    ? (months > 0 ? `${years}yr ${months}mo` : `${years} Year${years > 1 ? 's' : ''}`)
    : `${nextMonths} Month${nextMonths > 1 ? 's' : ''}`;

  return { label, daysLeft };
}

// ── Animated counter hook ─────────────────────────────────────────────────────
function useAnimatedCount(target: number, duration = 800): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.round(progress * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return count;
}

export const HomeDashboard: React.FC = () => {
  const { currentUser, partnerUser, updateMood } = useAuth();
  const { anniversaryDate, setAnniversaryDate, sendQuickAction, memories, messages, recentNotification } = useUniverse();

  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [prevSeconds, setPrevSeconds] = useState(0);
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
    } catch { return 95; }
  });

  // Fortune Cookie State
  const [fortuneCracked, setFortuneCracked] = useState(false);
  const [currentFortune, setCurrentFortune] = useState(() => LOVE_FORTUNES[0]);

  // ── NEW: Love Streak ─────────────────────────────────────────────────────
  const [loveStreak, setLoveStreak] = useState(() => {
    try {
      const saved = localStorage.getItem('ou_love_streak');
      if (saved) {
        const { streak, lastDate } = JSON.parse(saved);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastDate === today) return streak;
        if (lastDate === yesterday) {
          const newStreak = streak + 1;
          localStorage.setItem('ou_love_streak', JSON.stringify({ streak: newStreak, lastDate: today }));
          return newStreak;
        }
        // Streak broken
        localStorage.setItem('ou_love_streak', JSON.stringify({ streak: 1, lastDate: today }));
        return 1;
      }
      const init = { streak: 1, lastDate: new Date().toDateString() };
      localStorage.setItem('ou_love_streak', JSON.stringify(init));
      return 1;
    } catch { return 1; }
  });

  // ── NEW: Today's Love Challenge ──────────────────────────────────────────
  const [todayChallenge, setTodayChallenge] = useState(() => LOVE_CHALLENGES[0]);
  const [challengeDone, setChallengeDown] = useState(() => {
    try {
      const saved = localStorage.getItem('ou_challenge_done');
      if (saved) {
        const { date } = JSON.parse(saved);
        return date === new Date().toDateString();
      }
    } catch {}
    return false;
  });

  // ── NEW: Next Milestone ──────────────────────────────────────────────────
  const nextMilestone = getNextMilestone(anniversaryDate);

  const totalMessages = messages.length;
  const totalPhotos = messages.filter(m => m.type === 'image').length;
  const totalVoice = messages.filter(m => m.type === 'audio').length;
  const totalStars = messages.filter(m => m.isStarred).length;

  // Memoized computed values
  const { animMessages, animPhotos, animVoice, animStars } = {
    animMessages: useAnimatedCount(totalMessages, 1000),
    animPhotos:   useAnimatedCount(totalPhotos,   900),
    animVoice:    useAnimatedCount(totalVoice,    800),
    animStars:    useAnimatedCount(totalStars,    700),
  };

  // ── Relationship Health Score ─────────────────────────────────────────────
  const healthScore = useMemo(() => {
    const today = new Date().toDateString();
    const msgToday = messages.filter(m => new Date(m.createdAt).toDateString() === today).length;
    const msgScore  = Math.min(msgToday * 5, 30);   // up to 30pts
    const streakScore = Math.min(loveStreak * 3, 25); // up to 25pts
    const batteryScore = Math.round(loveBattery * 0.25); // up to 25pts
    const challengeScore = challengeDone ? 20 : 0;   // 20pts
    return Math.min(100, msgScore + streakScore + batteryScore + challengeScore);
  }, [messages, loveStreak, loveBattery, challengeDone]);

  // ── Love Letter State ─────────────────────────────────────────────────────
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterCopied, setLetterCopied] = useState(false);
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayLetter = LOVE_LETTERS[dayOfYear % LOVE_LETTERS.length];

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(anniversaryDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setPrevSeconds(prev => prev);
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
    setTodayChallenge(LOVE_CHALLENGES[dayOfYear % LOVE_CHALLENGES.length]);
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
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#ff70a6', '#a855f7', '#38bdf8', '#10b981'] });
    toast.love('⚡ Love Battery Charged to 100%! Maximum Love Power!');
  };

  const handleCrackFortune = () => {
    if (!fortuneCracked) {
      setFortuneCracked(true);
      sounds.playSecretBurnSound();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#f59e0b', '#fbbf24', '#ff70a6'] });
      toast.love('🥠 Fortune Cookie Cracked!');
    }
  };

  const handleMarkChallengeDone = () => {
    setChallengeDown(true);
    try {
      localStorage.setItem('ou_challenge_done', JSON.stringify({ date: new Date().toDateString() }));
    } catch (_) {}
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast.love('🎯 Challenge completed! You two are amazing! ❤️');
  };

  const handleCopyLetter = useCallback(() => {
    navigator.clipboard.writeText(todayLetter).then(() => {
      setLetterCopied(true);
      toast.love('Love letter copied to clipboard 💌');
      setTimeout(() => setLetterCopied(false), 2000);
    });
  }, [todayLetter]);

  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;

  const timerCells = [
    { value: timeTogether.days,    label: 'Days',  color: 'text-white',        from: 'from-pink-500',   to: 'to-purple-600',  glow: 'shadow-pink-500/30 border-pink-500/30' },
    { value: timeTogether.hours,   label: 'Hours', color: 'text-pink-300',     from: 'from-purple-500', to: 'to-indigo-600',  glow: 'shadow-purple-500/30 border-purple-500/30' },
    { value: timeTogether.minutes, label: 'Mins',  color: 'text-purple-300',   from: 'from-indigo-500', to: 'to-blue-600',    glow: 'shadow-indigo-500/30 border-indigo-500/30' },
    { value: timeTogether.seconds, label: 'Secs',  color: 'text-rose-300',     from: 'from-rose-500',   to: 'to-pink-600',    glow: 'shadow-rose-500/30 border-rose-500/30', pulse: true },
  ];

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto">

      {/* ── Floating Action Notification ── */}
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── HERO: Couple Profile + Anniversary Timer ────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="aurora-border glass-panel-aurora p-5 sm:p-8 rounded-2xl sm:rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Current user avatar */}
            <div className="relative flex-shrink-0">
              <div className={`rounded-full p-0.5 ${currentUser ? 'bg-gradient-to-tr from-pink-500 to-purple-600' : ''}`}>
                <img
                  src={currentUser?.photoURL}
                  alt={currentUser?.displayName}
                  loading="eager"
                  fetchPriority="high"
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-space-950"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'User')}&background=ff70a6&color=fff`;
                  }}
                />
              </div>
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-space-950 rounded-full animate-presence-glow" />
            </div>

            {/* Heartbeat center icon */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-purple p-0.5 shadow-lg shadow-pink-500/30 flex items-center justify-center animate-heartbeat">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white fill-current" />
              </div>
            </div>

            {/* Partner avatar + status */}
            <div className="relative flex-shrink-0">
              <div className={`rounded-full p-0.5 ${partnerUser?.online ? 'bg-gradient-to-tr from-emerald-400 to-teal-500' : 'bg-gradient-to-tr from-purple-500 to-indigo-600'}`}>
                <img
                  src={partnerUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser?.displayName || 'Partner')}&background=a855f7&color=fff`}
                  alt={partnerUser?.displayName}
                  loading="eager"
                  fetchPriority="high"
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-space-950"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser?.displayName || 'Partner')}&background=a855f7&color=fff`;
                  }}
                />
              </div>
              <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 sm:w-4 sm:h-4 border-2 border-space-950 rounded-full transition-all ${
                partnerUser?.online ? 'bg-emerald-500 animate-presence-glow' : 'bg-slate-500'
              }`} />
            </div>
          </div>

          <div className="text-center sm:text-right min-w-0">
            <h2 className="text-base sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 bg-clip-text text-transparent truncate text-balance">
              {currentUser?.displayName || currentUser?.petName || 'You'} & {partnerUser?.displayName || partnerUser?.petName || 'Partner'}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-1 flex flex-wrap items-center justify-center sm:justify-end gap-1">
              <span className="truncate max-w-[140px] sm:max-w-none">{currentUser?.city || 'Our Universe'}</span>
              <span>•</span>
              <span className="truncate max-w-[140px] sm:max-w-none">{partnerUser?.city || 'Online'}</span>
            </p>
            {/* Partner online status pill */}
            <div className="mt-1.5 flex items-center justify-center sm:justify-end gap-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                partnerUser?.online
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${partnerUser?.online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {partnerUser?.online ? 'Online now' : 'Away'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center sm:justify-end gap-2">
              <span className="tag-pill bg-pink-500/15 text-pink-300 border-pink-500/30">
                <Heart className="w-2.5 h-2.5 fill-current" />
                {daysSince(anniversaryDate)} days together
              </span>
            </div>
          </div>
        </div>

        {/* ── Anniversary Timer ── */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-pink-300">Together For</p>
            <button
              onClick={() => setShowDateEditor(!showDateEditor)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-full bg-white/5 border border-white/10 transition-colors"
              title="Edit Anniversary Date"
            >
              ✏️ {showDateEditor ? 'Close' : 'Edit'}
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

          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto" style={{ perspective: '600px' }}>
            {timerCells.map(({ value, label, color, from, to, glow, pulse }) => (
              <div
                key={label}
                className={`relative overflow-hidden glass-card p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border ${glow} shadow-lg text-center`}
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${from} ${to} opacity-80`} />
                <p
                  key={value}
                  className={`text-xl sm:text-4xl font-extrabold tracking-tight ${color} ${pulse ? 'animate-pulse' : ''} tabular-nums animate-flip-in`}
                >
                  {String(value).padStart(2, '0')}
                </p>
                <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── ROW: Love Streak + Today's Challenge + Next Milestone ──────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* 🔥 Love Streak */}
        <div className="glass-panel card-hover-lift p-5 rounded-3xl border border-orange-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between mb-3 relative z-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1">
                <Flame className="w-3 h-3 animate-streak-flicker" />
                Love Streak
              </p>
              <p className="text-3xl font-extrabold text-white mt-1 animate-count-up">
                {loveStreak}<span className="text-lg text-orange-300">🔥</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">consecutive days</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/25">
              <Flame className="w-6 h-6 text-orange-400 animate-streak-flicker" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex gap-1 mt-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    i < Math.min(loveStreak % 7 || 7, 7) ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <p className="text-[9px] text-orange-300/70 mt-1">7-day streak goal</p>
          </div>
        </div>

        {/* 🎯 Today's Love Challenge */}
        <div className={`glass-panel card-hover-lift p-5 rounded-3xl border relative overflow-hidden ${
          challengeDone ? 'border-emerald-500/30' : 'border-purple-500/20'
        }`}>
          <div className="challenge-shimmer absolute inset-0 pointer-events-none rounded-3xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1 mb-2">
              <Target className="w-3 h-3" />
              Today's Challenge
            </p>
            <div className="text-2xl mb-1">{todayChallenge.emoji}</div>
            <p className="text-xs font-bold text-white">{todayChallenge.title}</p>
            <p className="text-[10px] text-slate-300 leading-relaxed mt-1">{todayChallenge.desc}</p>
            <button
              onClick={handleMarkChallengeDone}
              disabled={challengeDone}
              className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                challengeDone
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 cursor-default'
                  : 'bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30'
              }`}
            >
              {challengeDone ? '✅ Completed!' : '✨ Mark Done'}
            </button>
          </div>
        </div>

        {/* 🏆 Next Milestone */}
        {nextMilestone ? (
          <div className="glass-panel card-hover-lift p-5 rounded-3xl border border-amber-500/20 relative overflow-hidden animate-milestone-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/6 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1 mb-2">
                <Trophy className="w-3 h-3" />
                Next Milestone
              </p>
              <p className="text-3xl font-extrabold text-white animate-count-up">
                {nextMilestone.daysLeft}<span className="text-base text-amber-300 ml-1">days</span>
              </p>
              <p className="text-[10px] text-amber-200/80 mt-0.5 font-semibold">until {nextMilestone.label} anniversary 🎊</p>
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-1000"
                  style={{ width: `${Math.max(5, 100 - Math.min(nextMilestone.daysLeft / 30 * 100, 100))}%` }}
                />
              </div>
              <p className="text-[9px] text-amber-400/70 mt-1">milestone progress</p>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-5 rounded-3xl border border-amber-500/20 flex items-center justify-center">
            <p className="text-xs text-amber-300 text-center">🏆 Set your anniversary date to unlock milestones!</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── Relationship Health Score + Love Letter of the Day ──────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 💚 Relationship Health Score */}
        <div className="glass-panel card-glow-hover p-5 rounded-3xl border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <RadialProgress score={healthScore} size={80} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Relationship Health</p>
              </div>
              <p className="text-sm font-bold text-white">
                {healthScore >= 80 ? '💚 Thriving Together!' : healthScore >= 60 ? '💛 Pretty Good!' : '❤️ Keep Nurturing!'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Based on messages, streak, battery & challenge
              </p>
              <div className="mt-2 flex gap-1">
                {['msgs','streak','battery','challenge'].map((k, i) => (
                  <div key={k} className={`h-1 flex-1 rounded-full ${
                    i === 0 ? 'bg-pink-500/60' :
                    i === 1 ? 'bg-orange-500/60' :
                    i === 2 ? 'bg-emerald-500/60' : 'bg-purple-500/60'
                  }`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 💌 Love Letter of the Day */}
        <div className="love-letter-card glass-panel card-glow-hover p-5 rounded-3xl relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <BookHeart className="w-3.5 h-3.5 text-pink-400" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-300">Love Letter of the Day</p>
              </div>
              <button
                onClick={() => setLetterOpen(!letterOpen)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 font-semibold hover:bg-pink-500/25 transition-all"
                aria-label={letterOpen ? 'Close love letter' : 'Open love letter'}
              >
                {letterOpen ? 'Close ✕' : 'Open 💌'}
              </button>
            </div>
            <AnimatePresence>
              {letterOpen ? (
                <motion.div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-pink-500/8 border border-pink-400/20">
                    <p className="text-xs text-pink-100 leading-relaxed italic font-serif">
                      "{todayLetter}"
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLetter}
                    className="flex items-center gap-1.5 text-[10px] text-pink-300 hover:text-white transition-colors font-semibold"
                    aria-label="Copy love letter"
                  >
                    {letterCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {letterCopied ? 'Copied!' : 'Copy to send'}
                  </button>
                </motion.div>
              ) : (
                <motion.div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-3xl animate-float-slow">💌</span>
                  <div>
                    <p className="text-xs font-bold text-white">Your daily love letter awaits</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tap to reveal today's romantic letter</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── Love Battery & Fortune Cookie ──────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ⚡ Love Battery */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 card-hover-lift">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              Couple Love Battery
            </h4>
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
              loveBattery >= 90 ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
            }`}>{loveBattery}%</span>
          </div>

          {/* Battery bar with animated fill */}
          <div className="h-5 bg-space-950 rounded-full p-1 border border-white/10 relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-pink-500 transition-all duration-1000 shadow-md shadow-emerald-500/40 relative overflow-hidden"
              style={{ width: `${loveBattery}%` }}
            >
              {/* Shimmer inside bar */}
              <div className="absolute inset-0 animate-shimmer" />
            </div>
            {/* Battery segments */}
            {[25, 50, 75].map(pct => (
              <div key={pct} className="absolute top-0 bottom-0 w-px bg-black/30" style={{ left: `${pct}%` }} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-300">
              {loveBattery >= 90 ? '⚡ Maximum charge & affection!' : '💖 Send a boost to recharge!'}
            </p>
            <button
              onClick={handleBoostBattery}
              className="btn-love px-3.5 py-1.5 text-xs rounded-xl"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Recharge
            </button>
          </div>
        </div>

        {/* 🥠 Fortune Cookie */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3 card-hover-lift">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Cookie className="w-4 h-4 text-amber-400" />
              Daily Love Fortune
            </h4>
            <span className="tag-pill bg-amber-500/20 text-amber-300 border-amber-500/30">
              {fortuneCracked ? '✅ Unlocked' : '🥠 Tap to Crack'}
            </span>
          </div>

          {!fortuneCracked ? (
            <div
              onClick={handleCrackFortune}
              className="p-4 rounded-2xl glass-card border border-amber-500/30 hover:border-amber-500/60 cursor-pointer flex items-center justify-center gap-3 text-center transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
            >
              <span className="text-4xl animate-bounce">🥠</span>
              <div className="text-left">
                <p className="font-bold text-xs text-white">Crack Open Today's Love Cookie</p>
                <p className="text-[10px] text-amber-300 mt-0.5">Reveal a romantic prophecy for you & partner</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-2 animate-fade-in">
              <div className="flex items-start gap-2">
                <span className="text-xl shrink-0">🥠</span>
                <p className="text-xs text-amber-100 font-semibold italic leading-relaxed">"{currentFortune.fortune}"</p>
              </div>
              <p className="text-[10px] text-amber-300/80 font-bold pl-7">Lucky Love Numbers: {currentFortune.numbers}</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── "On This Day" Memory Throwback ─────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {memories.length > 0 && (() => {
        const todayMD = new Date().toISOString().slice(5, 10);
        const throwback = memories.find(m => m.date && m.date.slice(5, 10) === todayMD) || memories[0];
        if (!throwback) return null;
        return (
          <div className="aurora-border glass-panel-aurora p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-pink-400 shadow-md shadow-pink-500/30">
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
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                  <span>On This Day Throwback</span>
                  <span className="tag-pill bg-pink-500/20 text-pink-200 border-pink-500/30">{throwback.date}</span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white truncate mt-0.5">{throwback.title}</h4>
                <p className="text-xs text-slate-300 italic truncate max-w-md mt-0.5">"{throwback.description}"</p>
              </div>
            </div>
            <button
              onClick={() => setSurpriseMemory(throwback)}
              className="btn-love shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              Relive Memory
            </button>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── Greeting + Distance Cards ───────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 flex items-center justify-between relative overflow-hidden card-hover-lift">
          <div className="absolute inset-0 challenge-shimmer pointer-events-none rounded-3xl" />
          <div className="space-y-2 max-w-md relative z-10">
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
          <div className="hidden sm:block text-6xl relative z-10">
            {isMorning ? '🌅' : isAfternoon ? '🌤️' : '🌙'}
          </div>
        </div>

        {/* Distance Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between gap-4 card-hover-lift">
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
          <p className="text-[10px] text-pink-300/70 italic text-center truncate" title="0 km apart in heart ❤️">
            0 km apart in heart ❤️
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── Moods + One-Tap Express ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Mood Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Smile className="w-4 h-4 text-accent-pink" />
              <span>Current Moods</span>
            </h4>
            <button
              onClick={() => setEditingMood(!editingMood)}
              className="text-xs font-semibold text-accent-pink hover:text-pink-300 transition-colors"
            >
              {editingMood ? 'Cancel' : 'Update Mood'}
            </button>
          </div>

          {!editingMood ? (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="glass-card p-4 rounded-2xl space-y-1 border border-pink-500/20 card-hover-lift">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">{currentUser?.mood?.emoji || '💖'}</span>
                  <span className="text-xs font-bold text-pink-200">{currentUser?.petName || currentUser?.displayName || 'You'}</span>
                </div>
                <p className="text-xs text-slate-300 italic">"{currentUser?.mood?.text || 'Thinking of you'}"</p>
              </div>
              <div className="glass-card p-4 rounded-2xl space-y-1 border border-purple-500/20 card-hover-lift">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>{partnerUser?.mood?.emoji || '💕'}</span>
                  <span className="text-xs font-bold text-purple-200">{partnerUser?.petName || partnerUser?.displayName || partnerUser?.username || 'Partner'}</span>
                </div>
                <p className="text-xs text-slate-300 italic">"{partnerUser?.mood?.text || 'Loving you always'}"</p>
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
                    onClick={() => { setMoodEmoji(preset.emoji); setMoodText(preset.label); }}
                    className="p-1.5 rounded-xl glass-card text-[10px] font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1 hover:border-pink-400/40 transition-all"
                  >
                    <span>{preset.emoji}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="btn-love w-full py-2.5 rounded-xl text-xs"
              >
                Save Mood Status
              </button>
            </form>
          )}
        </div>

        {/* One-Tap Love Express */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>One-Tap Love Express</span>
          </h4>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {[
              {
                action: 'miss_you', label: 'I Miss You', desc: 'Heartbeat sync',
                icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse-heart fill-current" />,
                iconBg: 'bg-pink-500/20 text-pink-400',
                border: 'border-pink-500/20 hover:border-pink-500/60 hover:shadow-pink-500/20'
              },
              {
                action: 'hug', label: 'Send Hug', desc: 'Warm embrace',
                icon: <span className="text-lg sm:text-xl">🤗</span>,
                iconBg: 'bg-purple-500/20',
                border: 'border-purple-500/20 hover:border-purple-500/60 hover:shadow-purple-500/20'
              },
              {
                action: 'kiss', label: 'Send Kiss', desc: 'Confetti explosion',
                icon: <span className="text-lg sm:text-xl">💋</span>,
                iconBg: 'bg-rose-500/20',
                border: 'border-rose-500/20 hover:border-rose-500/60 hover:shadow-rose-500/20'
              },
              {
                action: null, label: 'Surprise!', desc: 'Random memory',
                icon: <Gift className="w-4 h-4 sm:w-5 sm:h-5" />,
                iconBg: 'bg-amber-500/20 text-amber-400',
                border: 'border-amber-500/20 hover:border-amber-500/60 hover:shadow-amber-500/20',
                custom: handleSurpriseMode
              },
            ].map((btn, i) => (
              <button
                key={btn.label}
                onClick={btn.custom ?? (() => btn.action && sendQuickAction(btn.action as any))}
                className={`p-3 rounded-2xl glass-card border flex items-center gap-2.5 sm:gap-3 hover:scale-105 active:scale-95 transition-all text-left min-h-[56px] hover:shadow-lg ${btn.border}`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${btn.iconBg}`}>{btn.icon}</div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-white truncate">{btn.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{btn.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── Relationship Stats (with count-up animation) ────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Messages',    value: animMessages, icon: <MessageCircle className="w-4 h-4" />, color: 'text-pink-300',    bg: 'bg-pink-500/10 border-pink-500/20'   },
          { label: 'Photos',      value: animPhotos,   icon: <Image className="w-4 h-4" />,         color: 'text-purple-300',  bg: 'bg-purple-500/10 border-purple-500/20'},
          { label: 'Voice Notes', value: animVoice,    icon: <Mic className="w-4 h-4" />,           color: 'text-amber-300',   bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Stars',       value: animStars,    icon: <Sparkles className="w-4 h-4" />,      color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20'},
        ].map(stat => (
          <div key={stat.label} className={`glass-panel glass-card-tilt p-4 rounded-2xl border ${stat.bg} flex flex-col items-center justify-center gap-1.5 text-center card-hover-lift`}>
            <span className={stat.color}>{stat.icon}</span>
            <p className={`text-xl sm:text-2xl font-extrabold ${stat.color} animate-count-up`}>{stat.value.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Surprise Memory Modal ── */}
      <AnimatePresence>
        {surpriseMemory && (
          <motion.div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div className="aurora-border glass-panel-aurora p-6 rounded-3xl max-w-md w-full text-center space-y-4">
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
                className="btn-love w-full py-2.5 rounded-xl text-xs"
              >
                Close & Relive Memory ❤️
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
