import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { useRealtimeGame, GameType } from '../hooks/useRealtimeGame';
import { toast } from '../lib/toast';
import { sounds } from '../lib/soundEffects';
import confetti from 'canvas-confetti';
import {
  Video, Mic, Tv, Gamepad2, Sparkles, RefreshCw,
  Plus, Edit3, Trash2, Heart, Users, Check, X,
  Palette, Play, Pause, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

const DEFAULT_TRUTH_OR_DARE = [
  { type: 'Truth', text: 'What was the exact moment you realized you loved me?' },
  { type: 'Dare', text: 'Send me a 10-second voice note singing my favourite romantic song!' },
  { type: 'Truth', text: 'If we could travel anywhere together right now with no budget, where would you take me?' },
  { type: 'Dare', text: 'Send me your favourite unedited photo of yourself from today.' },
  { type: 'Truth', text: 'What is one cute habit of mine that always makes you smile?' },
  { type: 'Dare', text: 'Call me right now and tell me 3 reasons why I am your universe.' }
];

const WOULD_YOU_RATHER = [
  { opt1: 'Stargazing on a quiet mountain cabin 🏔️', opt2: 'Candlelit dinner in a bustling Italian piazza 🍝' },
  { opt1: 'Binge-watch our favourite series all night 🍿', opt2: 'Go on a spontaneous 2 AM midnight drive 🚗' },
  { opt1: 'Cook an elaborate 5-course meal together 👨‍🍳', opt2: 'Order our absolute favourite comfort takeout 🍕' },
  { opt1: 'Live by a tranquil ocean beach 🌊', opt2: 'Live in a cozy penthouse with skyline city lights 🏙️' }
];

const NEVER_HAVE_I_EVER = [
  'Never have I ever re-read our chat messages while smiling like a fool.',
  'Never have I ever taken a screenshot of you looking cute on video call.',
  'Never have I ever stayed up past 3 AM just talking to you about nothing and everything.',
  'Never have I ever planned our dream wedding or future house in my head.',
  'Never have I ever listened to a love song and instantly thought of you.'
];

const TRIVIA_QUESTIONS = [
  {
    q: 'Where did we have our very first conversation?',
    opts: ['Instagram / DM', 'College / Work', 'Through mutual friends', 'Coffee Shop'],
    ansIdx: 0
  },
  {
    q: 'What is our ultimate comfort food as a couple?',
    opts: ['Pizza & Garlic Bread 🍕', 'Biryani & Kebabs 🍗', 'Chocolate Ice Cream 🍨', 'Street Food & Chaat 🥟'],
    ansIdx: 0
  },
  {
    q: 'What is our dream travel destination together?',
    opts: ['Maldives Water Villa 🏝️', 'Switzerland Snow Mountains 🏔️', 'Tokyo & Kyoto Japan 🌸', 'Paris & Venice 🗼'],
    ansIdx: 0
  }
];

const ROMANTIC_WORDLE_WORDS = [
  { word: 'HEART', hint: 'The core of affection' },
  { word: 'LOVER', hint: 'Your soul companion' },
  { word: 'SWEET', hint: 'Like sugar and romance' },
  { word: 'ANGEL', hint: 'Pure heaven sent' },
  { word: 'KISSY', hint: 'A tender touch on lips' },
  { word: 'DREAM', hint: 'What you see asleep' }
];

const COMPATIBILITY_QUIZ = [
  {
    q: 'What is our ideal weekend plan?',
    opts: ['Cozy movie marathon at home 🎬', 'Outdoor road trip adventure 🚗', 'Exploring cafes & foodie spots ☕']
  },
  {
    q: 'How do we resolve small differences best?',
    opts: ['Talking it through gently right away 💬', 'A warm tight hug first, words second 🤗', 'Surprise treats & humor 🧁']
  },
  {
    q: 'Who is the master chef in the kitchen?',
    opts: ['Me 👨‍🍳', 'Partner / Friend 👩‍🍳', 'We cook together as a team! 🍳']
  }
];

export const TogetherTime: React.FC = () => {
  const { currentUser, partnerUser } = useAuth();
  const { 
    isCallActive, startCall, 
    syncedMediaUrl, setSyncedMediaUrl, isPlayingMedia, setIsPlayingMedia 
  } = useUniverse();

  // Primary Activities Selector
  const [primaryActivity, setPrimaryActivity] = useState<'calls' | 'watch' | 'trivia' | 'tictactoe' | 'canvas' | 'cards'>('calls');
  // Sub-card game selector
  const [cardGame, setCardGame] = useState<'truth' | 'wordle' | 'compat' | 'would' | 'never'>('truth');

  const activeGameType: GameType = primaryActivity === 'cards'
    ? cardGame
    : (primaryActivity === 'trivia' || primaryActivity === 'tictactoe' || primaryActivity === 'canvas' ? primaryActivity : 'trivia');

  // Supabase Realtime Multiplayer Session Hook
  const {
    partnerConnected,
    isMyTurn,
    makeTicTacToeMove,
    resetTicTacToe,
    nextTriviaQuestion,
    nextTruthQuestion,
    nextWouldRather,
    nextNeverHaveIEver,
    broadcastCanvasStroke,
    broadcastCanvasClear,
  } = useRealtimeGame(activeGameType);

  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  // Custom Truth/Dare Form State
  const [customDeck, setCustomDeck] = useState(DEFAULT_TRUTH_OR_DARE);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [newCardType, setNewCardType] = useState<'Truth' | 'Dare'>('Truth');
  const [newCardText, setNewCardText] = useState('');

  // Love Wordle State
  const [wordleWordIdx, setWordleWordIdx] = useState(0);
  const [wordleGuesses, setWordleGuesses] = useState<string[]>([]);
  const [currentWordleInput, setCurrentWordleInput] = useState('');
  const [wordleGameWon, setWordleGameWon] = useState(false);

  const targetWordle = ROMANTIC_WORDLE_WORDS[wordleWordIdx % ROMANTIC_WORDLE_WORDS.length].word;

  const handleWordleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const guess = currentWordleInput.trim().toUpperCase();
    if (guess.length !== 5) {
      toast.info('Enter a 5-letter romantic word');
      return;
    }
    if (wordleGuesses.length >= 6 || wordleGameWon) return;

    const newGuesses = [...wordleGuesses, guess];
    setWordleGuesses(newGuesses);
    setCurrentWordleInput('');

    if (guess === targetWordle) {
      setWordleGameWon(true);
      sounds.playKissSound();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      toast.love(`🎉 Correct! You unlocked "${targetWordle}"!`);
    } else if (newGuesses.length >= 6) {
      toast.info(`Game over! The word was "${targetWordle}"`);
    }
  };

  const handleNextWordle = () => {
    setWordleWordIdx(prev => prev + 1);
    setWordleGuesses([]);
    setCurrentWordleInput('');
    setWordleGameWon(false);
  };

  // Tic-Tac-Toe local state fallback
  const [tttBoard, setTttBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
  const [tttWinner, setTttWinner] = useState<string | null>(null);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleTttClick = (idx: number) => {
    if (tttBoard[idx] || tttWinner) return;
    const nextBoard = [...tttBoard];
    nextBoard[idx] = tttTurn;
    setTttBoard(nextBoard);
    const win = checkWinner(nextBoard);
    if (win) {
      setTttWinner(win);
      sounds.playKissSound();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (nextBoard.every(Boolean)) {
      setTttWinner('draw');
    } else {
      setTttTurn(tttTurn === 'X' ? 'O' : 'X');
    }
    makeTicTacToeMove(idx);
  };

  const handleResetTtt = () => {
    setTttBoard(Array(9).fill(null));
    setTttTurn('X');
    setTttWinner(null);
    resetTicTacToe();
  };

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff70a6');
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;

    if ('touches' in e && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: ((e as React.MouseEvent<HTMLCanvasElement>).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent<HTMLCanvasElement>).clientY - rect.top) * scaleY
    };
  };

  const drawAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (lastPosRef.current) {
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = drawColor;
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      broadcastCanvasStroke({
        x1: lastPosRef.current.x,
        y1: lastPosRef.current.y,
        x2: x,
        y2: y,
        color: drawColor
      });
    }
    lastPosRef.current = { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e && e.cancelable) e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCanvasPos(e);
    lastPosRef.current = { x, y };
    drawAt(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) e.preventDefault();
    const { x, y } = getCanvasPos(e);
    drawAt(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    broadcastCanvasClear();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">

      {/* ── 5 Primary Activity Selector Tabs + Mini-Games ── */}
      <div className="glass-panel p-2 rounded-2xl border border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setPrimaryActivity('calls')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            primaryActivity === 'calls'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Calls</span>
        </button>

        <button
          onClick={() => setPrimaryActivity('watch')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            primaryActivity === 'watch'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Watch Together</span>
        </button>

        <button
          onClick={() => setPrimaryActivity('trivia')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            primaryActivity === 'trivia'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Couple Trivia</span>
        </button>

        <button
          onClick={() => setPrimaryActivity('tictactoe')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            primaryActivity === 'tictactoe'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Tic-Tac-Toe</span>
        </button>

        <button
          onClick={() => setPrimaryActivity('canvas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            primaryActivity === 'canvas'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Couple Canvas</span>
        </button>

        <button
          onClick={() => setPrimaryActivity('cards')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            primaryActivity === 'cards'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Mini-Games &amp; Cards</span>
        </button>
      </div>

      {/* ── 1. Voice & Video Calls View ── */}
      {primaryActivity === 'calls' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5 shadow-xl flex items-center justify-center animate-pulse-heart">
            <div className="w-full h-full bg-space-950 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-pink-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">Private WebRTC Calling</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
              End-to-end encrypted high definition voice and video communication with {partnerUser?.displayName || 'your partner'}.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => { startCall('voice'); toast.love('Starting Voice Call... 📞'); }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>Audio Call</span>
            </button>
            <button
              onClick={() => { startCall('video'); toast.love('Starting Video Call... 📹'); }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Video Call</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Watch Together View ── */}
      {primaryActivity === 'watch' && (
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-accent-pink" />
                <span>Synced Watch Party</span>
              </h3>
              <p className="text-[11px] text-slate-400">Stream YouTube or video simultaneously across both devices</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={syncedMediaUrl}
              onChange={(e) => setSyncedMediaUrl(e.target.value)}
              placeholder="Paste YouTube video link..."
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs"
            />
            <button
              onClick={() => {
                setIsPlayingMedia(!isPlayingMedia);
                toast.love(isPlayingMedia ? 'Paused stream' : 'Syncing playback! 🎬');
              }}
              className="px-4 py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
            >
              {isPlayingMedia ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlayingMedia ? 'Pause' : 'Play'}</span>
            </button>
          </div>

          <div className="aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden glass-card border border-white/10 flex items-center justify-center relative shadow-2xl">
            {syncedMediaUrl ? (
              <iframe
                src={syncedMediaUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Tv className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <p className="text-xs text-slate-400">Paste any YouTube URL above to start watch party</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Couple Trivia View ── */}
      {primaryActivity === 'trivia' && (
        <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-white/10 space-y-5 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <span className="text-3xl">🏆</span>
            <h3 className="text-lg font-extrabold text-white">Couple Romance Trivia</h3>
            <p className="text-xs text-slate-300">{TRIVIA_QUESTIONS[0].q}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto">
            {TRIVIA_QUESTIONS[0].opts.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedOpt(idx);
                  if (idx === TRIVIA_QUESTIONS[0].ansIdx) {
                    sounds.playKissSound();
                    toast.love('✨ Perfect match! Both know each other so well!');
                  }
                }}
                className={`p-3.5 rounded-2xl border text-xs font-bold transition-all text-left ${
                  selectedOpt === idx
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-200'
                    : 'glass-card border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedOpt(null);
              nextTriviaQuestion();
              toast.love('Next trivia question loaded! ✨');
            }}
            className="btn-love px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            Next Question ➔
          </button>
        </div>
      )}

      {/* ── 4. Tic-Tac-Toe View ── */}
      {primaryActivity === 'tictactoe' && (
        <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-white/10 space-y-5 text-center">
          <div className="flex items-center justify-between max-w-xs mx-auto border-b border-white/10 pb-3">
            <h3 className="font-extrabold text-white text-base">Couple Tic-Tac-Toe</h3>
            <span className="text-xs text-pink-300 font-bold">
              {tttWinner ? (tttWinner === 'draw' ? 'Draw!' : `Winner: ${tttWinner}! 🎉`) : `Turn: ${tttTurn}`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
            {tttBoard.map((val, idx) => (
              <button
                key={idx}
                onClick={() => handleTttClick(idx)}
                className="w-20 h-20 rounded-2xl glass-card border border-white/15 text-2xl font-extrabold flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white"
              >
                {val === 'X' ? <span className="text-pink-400">❌</span> : val === 'O' ? <span className="text-purple-400">⭕</span> : null}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetTtt}
            className="px-4 py-2 rounded-xl glass-card text-xs font-bold text-slate-300 hover:text-white"
          >
            Reset Game 🔄
          </button>
        </div>
      )}

      {/* ── 5. Couple Canvas View ── */}
      {primaryActivity === 'canvas' && (
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" />
                <span>Collaborative Canvas</span>
              </h3>
              <p className="text-[10px] text-slate-400">Draw together in real-time on shared whiteboarding canvas</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {['#ff70a6', '#a855f7', '#38bdf8', '#34d399', '#ffffff'].map(c => (
                  <button
                    key={c}
                    onClick={() => setDrawColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${drawColor === c ? 'scale-125 border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={clearCanvas}
                className="px-3 py-1.5 rounded-xl glass-card text-xs font-bold text-rose-300 hover:bg-rose-500/20"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="w-full h-80 rounded-2xl bg-space-950 border border-white/10 overflow-hidden shadow-inner touch-none">
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={draw}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="w-full h-full cursor-crosshair"
            />
          </div>
        </div>
      )}

      {/* ── 6. Mini-Games & Cards View ── */}
      {primaryActivity === 'cards' && (
        <div className="space-y-4">
          {/* Sub tabs for cards */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'truth', label: 'Truth or Dare' },
              { id: 'wordle', label: 'Love Wordle 🔤' },
              { id: 'compat', label: 'Who Knows Who? 💖' },
              { id: 'would', label: 'Would You Rather' },
              { id: 'never', label: 'Never Have I Ever' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCardGame(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  cardGame === tab.id
                    ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40'
                    : 'glass-card text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Truth or Dare */}
          {cardGame === 'truth' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <span className="text-3xl">🎭</span>
              <h4 className="font-extrabold text-white text-base">Couple Truth or Dare</h4>
              <p className="text-xs text-pink-200 italic max-w-md mx-auto">"{customDeck[0].text}"</p>
              <button
                onClick={() => {
                  setCustomDeck(prev => [...prev.slice(1), prev[0]]);
                  nextTruthQuestion(customDeck.length);
                  toast.love('Next card drawn! ✨');
                }}
                className="btn-love px-5 py-2 rounded-xl text-xs font-bold"
              >
                Draw Next Card 🃏
              </button>
            </div>
          )}

          {/* Love Wordle */}
          {cardGame === 'wordle' && (
            <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center space-y-4">
              <h4 className="font-extrabold text-white text-base">Romantic Password Wordle</h4>
              <p className="text-xs text-slate-300">Guess the 5-letter romantic keyword together</p>

              <form onSubmit={handleWordleSubmit} className="flex max-w-xs mx-auto gap-2">
                <input
                  type="text"
                  maxLength={5}
                  value={currentWordleInput}
                  onChange={(e) => setCurrentWordleInput(e.target.value.toUpperCase())}
                  placeholder="GUESS"
                  className="flex-1 px-3 py-2 rounded-xl glass-input text-center font-mono font-bold tracking-widest text-sm uppercase"
                />
                <button type="submit" className="btn-love px-4 py-2 rounded-xl text-xs font-bold">
                  Submit
                </button>
              </form>

              {wordleGuesses.length > 0 && (
                <div className="space-y-1 max-w-xs mx-auto">
                  {wordleGuesses.map((g, idx) => (
                    <div key={idx} className="flex justify-center gap-1">
                      {g.split('').map((letter, lIdx) => {
                        const isCorrect = targetWordle[lIdx] === letter;
                        const isPresent = targetWordle.includes(letter);
                        return (
                          <span
                            key={lIdx}
                            className={`w-8 h-8 rounded-lg font-extrabold text-xs flex items-center justify-center ${
                              isCorrect ? 'bg-emerald-500 text-white' : isPresent ? 'bg-amber-500 text-white' : 'bg-white/10 text-slate-300'
                            }`}
                          >
                            {letter}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {wordleGameWon && (
                <button onClick={handleNextWordle} className="btn-love px-4 py-2 rounded-xl text-xs font-bold">
                  Next Wordle ➔
                </button>
              )}
            </div>
          )}

          {/* Who Knows Who */}
          {cardGame === 'compat' && (
            <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center space-y-4">
              <span className="text-3xl">💖</span>
              <h4 className="font-extrabold text-white text-base">Compatibility Challenge</h4>
              <p className="text-xs text-slate-200">{COMPATIBILITY_QUIZ[0].q}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-lg mx-auto">
                {COMPATIBILITY_QUIZ[0].opts.map((o, idx) => (
                  <button key={idx} onClick={() => toast.love('Answer locked in!')} className="p-3 rounded-xl glass-card text-xs font-semibold text-slate-300 hover:text-white">
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Would You Rather */}
          {cardGame === 'would' && (
            <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center space-y-4">
              <h4 className="font-extrabold text-white text-base">Would You Rather</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                <button onClick={() => toast.love('Option 1 picked! 🌟')} className="p-4 rounded-2xl glass-card border border-pink-500/30 text-xs font-bold text-pink-200 hover:bg-pink-500/20">
                  {WOULD_YOU_RATHER[0].opt1}
                </button>
                <button onClick={() => toast.love('Option 2 picked! 🌟')} className="p-4 rounded-2xl glass-card border border-purple-500/30 text-xs font-bold text-purple-200 hover:bg-purple-500/20">
                  {WOULD_YOU_RATHER[0].opt2}
                </button>
              </div>
            </div>
          )}

          {/* Never Have I Ever */}
          {cardGame === 'never' && (
            <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center space-y-4">
              <h4 className="font-extrabold text-white text-base">Never Have I Ever</h4>
              <p className="text-sm font-semibold text-pink-200 italic max-w-md mx-auto">"{NEVER_HAVE_I_EVER[0]}"</p>
              <button
                onClick={() => {
                  nextNeverHaveIEver(NEVER_HAVE_I_EVER.length);
                  toast.love('Next confession drawn! ✨');
                }}
                className="btn-love px-4 py-2 rounded-xl text-xs font-bold"
              >
                Next Statement ➔
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
