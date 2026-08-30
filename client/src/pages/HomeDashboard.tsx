import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { toast } from '../lib/toast';
import { sounds } from '../lib/soundEffects';
import { Memory } from '../types';
import confetti from 'canvas-confetti';
import {
  Heart, Sun, Moon, CloudSun, Sparkles,
  Send, MapPin, Zap, MessageCircle, Image, Mic,
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
function RadialProgress({ score, size = 84 }: { score: number; size?: number }) {
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
        <span className="text-xl font-extrabold text-white leading-none">{score}</span>
        <span className="text-[8px] text-pink-300 font-bold uppercase tracking-wider mt-0.5">Synergy</span>
      </div>
    </div>
  );
}

// ── Helper: days until next anniversary marker ─────────────────────────────────
function getNextMilestone(anniversaryDate: string): { label: string; daysLeft: number } | null {
  const start = new Date(anniversaryDate);
  if (isNaN(start.getTime())) return null;
  const now = new Date();
  const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  
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

export const HomeDashboard: React.FC = () => {
  const { currentUser, partnerUser, updateMood } = useAuth();
  const { anniversaryDate, setAnniversaryDate, sendQuickAction, memories, messages } = useUniverse();

  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [editingMood, setEditingMood] = useState(false);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [tempDate, setTempDate] = useState(anniversaryDate.slice(0, 10));
  const [moodEmoji, setMoodEmoji] = useState('💖');
  const [moodText, setMoodText] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [surpriseMemory, setSurpriseMemory] = useState<Memory | null>(null);

  // Love Streak State
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
        localStorage.setItem('ou_love_streak', JSON.stringify({ streak: 1, lastDate: today }));
        return 1;
      }
      const init = { streak: 1, lastDate: new Date().toDateString() };
      localStorage.setItem('ou_love_streak', JSON.stringify(init));
      return 1;
    } catch { return 1; }
  });

  // Today's Love Challenge
  const [todayChallenge, setTodayChallenge] = useState(() => LOVE_CHALLENGES[0]);
  const [challengeDone, setChallengeDone] = useState(() => {
    try {
      const saved = localStorage.getItem('ou_challenge_done');
      if (saved) {
        const { date } = JSON.parse(saved);
        return date === new Date().toDateString();
      }
    } catch {}
    return false;
  });

  // Next Milestone
  const nextMilestone = getNextMilestone(anniversaryDate);

  // Love Letter State
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterCopied, setLetterCopied] = useState(false);
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayLetter = LOVE_LETTERS[dayOfYear % LOVE_LETTERS.length];

  // ── Unified Relationship Health & Insight Score ────────────────────────────
  const healthScore = useMemo(() => {
    const today = new Date().toDateString();
    const msgToday = messages.filter(m => new Date(m.createdAt).toDateString() === today).length;
    const msgScore = Math.min(msgToday * 6, 35);       // up to 35pts from active chat
    const streakScore = Math.min(loveStreak * 4, 30);   // up to 30pts from consistency
    const memoriesScore = Math.min(memories.length * 3, 20); // up to 20pts from shared vault
    const challengeScore = challengeDone ? 15 : 0;      // 15pts from daily challenge
    return Math.min(100, msgScore + streakScore + memoriesScore + challengeScore);
  }, [messages, loveStreak, memories, challengeDone]);

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
    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setQuoteIndex(day % DAILY_QUOTES.length);
    setTodayChallenge(LOVE_CHALLENGES[day % LOVE_CHALLENGES.length]);
  }, []);

  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodText.trim()) return;
    await updateMood(moodEmoji, moodText.trim());
    setEditingMood(false);
    toast.love('Mood updated for partner! ✨');
  };

  const handleMarkChallengeDone = useCallback(() => {
    if (challengeDone) return;
    setChallengeDone(true);
    try {
      localStorage.setItem('ou_challenge_done', JSON.stringify({ date: new Date().toDateString() }));
    } catch {}
    sounds.playKissSound();
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    toast.love("Daily romantic challenge completed! 🌟 +15 Synergy Points");
  }, [challengeDone]);

  const handleCopyLetter = useCallback(() => {
    navigator.clipboard?.writeText(todayLetter).catch(() => {});
    setLetterCopied(true);
    toast.love('Love letter copied to clipboard! 💌');
    setTimeout(() => setLetterCopied(false), 2500);
  }, [todayLetter]);

  const handleSaveAnniversary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempDate) return;
    setAnniversaryDate(tempDate);
    setShowDateEditor(false);
    toast.love('Anniversary date updated! 💍');
  };

  const timerCells = [
    { value: timeTogether.days,    label: 'Days',  color: 'text-rose-300',    from: 'from-rose-500',   to: 'to-pink-500',   glow: 'border-rose-500/30' },
    { value: timeTogether.hours,   label: 'Hours', color: 'text-pink-300',    from: 'from-pink-500',   to: 'to-purple-500', glow: 'border-pink-500/30' },
    { value: timeTogether.minutes, label: 'Mins',  color: 'text-purple-300',  from: 'from-purple-500', to: 'to-indigo-500', glow: 'border-purple-500/30' },
    { value: timeTogether.seconds, label: 'Secs',  color: 'text-emerald-300', from: 'from-indigo-500', to: 'to-teal-500',   glow: 'border-emerald-500/30', pulse: true },
  ];

  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── 1. HERO CARD: Anniversary Countdown & Connected Partner ────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="aurora-border glass-panel-aurora p-5 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-pink-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-5">
          {/* Top Pill: Streak & Anniversary Tag */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-200 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
              <span>{loveStreak} Day Connection Streak</span>
            </span>

            <button
              onClick={() => setShowDateEditor(!showDateEditor)}
              className="px-3 py-1 rounded-full glass-card hover:border-pink-400/50 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>💍 Since {new Date(anniversaryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </button>
          </div>

          {/* Connected Couple Avatars */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 py-1">
            {/* Current User */}
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 to-purple-500 shadow-xl">
                <img
                  src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'Me')}&background=ff70a6&color=fff`}
                  alt={currentUser?.displayName || 'Me'}
                  className="w-full h-full rounded-full object-cover border-2 border-space-950"
                />
                {currentUser?.online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-space-950 rounded-full" />
                )}
              </div>
              <p className="font-extrabold text-xs text-white mt-1.5 truncate max-w-[90px]">
                {currentUser?.petName || currentUser?.displayName || 'Me'}
              </p>
            </div>

            {/* Pulsing Love Heart Link */}
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-xl sm:text-2xl animate-heartbeat">❤️</span>
              <span className="text-[9px] text-pink-300 font-extrabold uppercase tracking-wider mt-0.5">Connected</span>
            </div>

            {/* Partner User */}
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-xl">
                <img
                  src={partnerUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser?.displayName || 'Partner')}&background=a855f7&color=fff`}
                  alt={partnerUser?.displayName || 'Partner'}
                  className="w-full h-full rounded-full object-cover border-2 border-space-950"
                />
                {partnerUser?.online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-space-950 rounded-full" />
                )}
              </div>
              <p className="font-extrabold text-xs text-white mt-1.5 truncate max-w-[90px]">
                {partnerUser?.petName || partnerUser?.displayName || 'Partner'}
              </p>
            </div>
          </div>

          {/* Anniversary Date Editor (Expandable) */}
          {showDateEditor && (
            <form onSubmit={handleSaveAnniversary} className="flex items-center justify-center gap-2 max-w-xs mx-auto p-3 rounded-2xl glass-panel border border-pink-500/30 animate-fade-in">
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl glass-input text-xs text-white flex-1"
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-md"
              >
                Save
              </button>
            </form>
          )}

          {/* 4-Cell Countdown Timer */}
          <div className="grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-3 max-w-xl mx-auto" style={{ perspective: '600px' }}>
            {timerCells.map(({ value, label, color, from, to, glow, pulse }) => (
              <div
                key={label}
                className={`relative overflow-hidden glass-card p-1.5 xs:p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border ${glow} shadow-lg text-center hero-timer-cell`}
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${from} ${to} opacity-80`} />
                <p
                  key={value}
                  className={`text-base xs:text-xl sm:text-4xl font-extrabold tracking-tight ${color} ${pulse ? 'animate-pulse' : ''} tabular-nums animate-flip-in hero-timer-number`}
                >
                  {String(value).padStart(2, '0')}
                </p>
                <p className="text-[7.5px] xs:text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1 hero-timer-label">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── 2. DAILY MOMENT & LOVE LETTER OF THE DAY ────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Greeting & Daily Quote */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex items-center justify-between relative overflow-hidden card-hover-lift">
          <div className="space-y-2 max-w-md relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-pink-300 border border-white/10">
              {isMorning ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : isAfternoon ? <CloudSun className="w-3.5 h-3.5 text-orange-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
              {isMorning ? 'Good Morning' : isAfternoon ? 'Good Afternoon' : 'Good Night'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {isMorning ? 'A brand new day to love you more ☀️' : isAfternoon ? 'Hope your day is going wonderfully 💕' : 'Sweet dreams in our universe 🌌'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{DAILY_QUOTES[quoteIndex]}"
            </p>
          </div>
          <div className="hidden sm:block text-5xl relative z-10">
            {isMorning ? '🌅' : isAfternoon ? '🌤️' : '🌙'}
          </div>
        </div>

        {/* Love Letter of the Day */}
        <div className="glass-panel card-glow-hover p-5 rounded-3xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <BookHeart className="w-4 h-4 text-pink-400" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-300">Daily Love Letter</p>
              </div>
              <button
                onClick={() => setLetterOpen(!letterOpen)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 font-semibold hover:bg-pink-500/25 transition-all"
              >
                {letterOpen ? 'Close ✕' : 'Read 💌'}
              </button>
            </div>

            <AnimatePresence>
              {letterOpen ? (
                <motion.div className="space-y-3 animate-fade-in">
                  <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-400/20">
                    <p className="text-xs text-pink-100 leading-relaxed italic font-serif">
                      "{todayLetter}"
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLetter}
                    className="flex items-center gap-1.5 text-[10px] text-pink-300 hover:text-white transition-colors font-semibold"
                  >
                    {letterCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{letterCopied ? 'Copied to clipboard!' : 'Copy to send in chat'}</span>
                  </button>
                </motion.div>
              ) : (
                <div
                  onClick={() => setLetterOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                >
                  <span className="text-3xl animate-float-slow">💌</span>
                  <div>
                    <p className="text-xs font-bold text-white">Your romantic letter awaits</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tap to reveal today's private letter</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ─── 3. RELATIONSHIP INSIGHT & MILESTONES ────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* 💚 Health & Synergy Score */}
        <div className="glass-panel card-hover-lift p-5 rounded-3xl border border-emerald-500/20 flex items-center gap-4">
          <RadialProgress score={healthScore} size={78} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Relationship Insight</span>
            </div>
            <p className="text-xs font-bold text-white mt-1">
              {healthScore >= 80 ? '💚 Deeply Bonded' : healthScore >= 60 ? '💛 Growing Beautifully' : '❤️ Nurture Connection'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              {messages.length} msgs • {memories.length} memories
            </p>
          </div>
        </div>

        {/* 🎯 Today's Love Challenge */}
        <div className={`glass-panel card-hover-lift p-5 rounded-3xl border relative overflow-hidden ${
          challengeDone ? 'border-emerald-500/30' : 'border-purple-500/20'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1 mb-1">
            <Target className="w-3 h-3 text-purple-400" />
            <span>Daily Challenge</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl">{todayChallenge.emoji}</span>
            <p className="text-xs font-bold text-white truncate">{todayChallenge.title}</p>
          </div>
          <p className="text-[10px] text-slate-300 mt-1 line-clamp-2">{todayChallenge.desc}</p>
          <button
            onClick={handleMarkChallengeDone}
            disabled={challengeDone}
            className={`mt-2.5 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              challengeDone
                ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                : 'bg-purple-500/20 text-purple-200 hover:bg-purple-500/30'
            }`}
          >
            {challengeDone ? '✅ Completed' : '✨ Mark Done'}
          </button>
        </div>

        {/* 🏆 Next Milestone */}
        <div className="glass-panel card-hover-lift p-5 rounded-3xl border border-amber-500/20 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1 mb-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Next Milestone</span>
            </p>
            {nextMilestone ? (
              <>
                <p className="text-2xl font-extrabold text-white mt-1">
                  {nextMilestone.daysLeft} <span className="text-xs text-amber-300">days left</span>
                </p>
                <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                  until {nextMilestone.label} anniversary 🎊
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-2">Milestone tracker active</p>
            )}
          </div>
        </div>
      </div>

      {/* ── "On This Day" Throwback (If Memories Exist) ── */}
      {memories.length > 0 && (() => {
        const throwback = memories[0];
        if (!throwback) return null;
        return (
          <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-pink-400 shrink-0">
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
                <p className="text-[10px] font-extrabold text-pink-300 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Featured Memory</span>
                </p>
                <p className="font-bold text-xs text-white truncate mt-0.5">{throwback.title}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{throwback.date}</p>
              </div>
            </div>

            <button
              onClick={() => {
                sendQuickAction('kiss');
                toast.love('Sent love for this memory! ❤️');
              }}
              className="btn-love px-3.5 py-2 rounded-xl text-[11px] shrink-0"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Send Love</span>
            </button>
          </div>
        );
      })()}

    </div>
  );
};
