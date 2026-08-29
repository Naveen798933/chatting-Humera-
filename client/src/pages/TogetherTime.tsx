import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useRealtimeGame } from '../hooks/useRealtimeGame';
import { toast } from '../lib/toast';
import { sounds } from '../lib/soundEffects';
import confetti from 'canvas-confetti';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Play, Pause, 
  Gamepad2, Sparkles, Tv, Music, Palette, HelpCircle, Heart, Trophy, Check, X, Users, RefreshCw, Plus, KeyRound, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

const DEFAULT_TRUTH_OR_DARE = [
  { type: 'Truth', text: 'What was your very first thought when you first met me?' },
  { type: 'Truth', text: 'Which moment of ours was your favorite date ever?' },
  { type: 'Truth', text: 'What is your favorite thing about my personality?' },
  { type: 'Truth', text: 'What is a secret dream you want us to accomplish together?' },
  { type: 'Dare', text: 'Sing 30 seconds of your favorite romantic song right now!' },
  { type: 'Dare', text: 'Send me a 15-second voice note saying 3 things you love about me.' },
  { type: 'Dare', text: 'Do your best cute impression of me right now!' }
];

const WOULD_YOU_RATHER = [
  'Would you rather spend a cozy rainy weekend indoors or go on a surprise road trip?',
  'Would you rather watch romantic sunsets by the beach or stargaze on a mountain top?',
  'Would you rather have infinite breakfast in bed or late-night dessert dates forever?',
  'Would you rather slow dance in the rain or cook an elaborate dinner together by candlelight?',
  'Would you rather travel back in time to our first date or teleport 10 years into our dream future?'
];

const NEVER_HAVE_I_EVER = [
  'Never have I ever stayed up until 4 AM talking to you on the phone.',
  'Never have I ever re-read our old chat messages when missing you.',
  'Never have I ever secretly saved a screenshot of your cute photo.',
  'Never have I ever planned our dream wedding destination in my mind!',
  'Never have I ever smiled at my phone in public because of a text from you.'
];

const COUPLE_TRIVIA = [
  { question: 'Where would be our ultimate dream vacation spot?', options: ['Maldives Ocean Villa 🏝️', 'Paris Eiffel Tower 🗼', 'Swiss Alps 🏔️', 'Tokyo City 🌸'], answer: 0 },
  { question: 'What is the most memorable part of connecting online?', options: ['Late night conversations 🌙', 'Playing games together 🎮', 'Sharing photos & voice notes 📸', 'Surprise moments ✨'], answer: 0 },
  { question: 'What is the best way to spend a free weekend?', options: ['Cozy movie marathon 🍿', 'Outdoor road trip adventure 🚗', 'Cooking tasty food together 🍳', 'Exploring new cafés ☕'], answer: 0 },
  { question: 'What brings the biggest smile after a long day?', options: ['A sweet voice message 🎙️', 'A funny meme 😂', 'A sincere compliment 💖', 'All of the above! 🌟'], answer: 3 }
];

const ROMANTIC_WORDLE_WORDS = [
  { word: 'HEART', hint: 'The center of all our love ❤️' },
  { word: 'SWEET', hint: 'Like every message from you 🍯' },
  { word: 'ANGEL', hint: 'Heaven-sent partner 👼' },
  { word: 'CHARM', hint: 'What made me fall for you ✨' },
  { word: 'SMILE', hint: 'Your brightest feature that melts me 😊' },
  { word: 'DREAM', hint: 'Every night thinking of you 🌙' },
  { word: 'FLAME', hint: 'The eternal fire in our souls 🔥' },
  { word: 'HONEY', hint: 'Sweetest pet name for you 🍯' },
  { word: 'STARS', hint: 'What we gaze at together under night sky 🌌' },
  { word: 'SOULS', hint: 'Two halves of the same universe 💫' },
  { word: 'ADORE', hint: 'To love and cherish deeply 💖' },
  { word: 'MAGIC', hint: 'What happens every time we talk ✨' }
];

const COMPATIBILITY_QUESTIONS = [
  {
    q: 'Who takes longer getting ready before heading out?',
    opts: ['Me! 🤵', 'My partner / friend 👸', 'Equal time! ⏱️']
  },
  {
    q: 'Who is more likely to fall asleep during a movie night?',
    opts: ['Me 😴', 'Partner / Friend 💤', 'Neither, we stay up! 🍿']
  },
  {
    q: 'What is our ideal weekend activity?',
    opts: ['Cozy sleep-in & relaxing 🛌', 'Brunch & fresh coffee ☕', 'Spontaneous drive / travel 🚗']
  },
  {
    q: 'Who sends more cute emojis and voice notes in chat?',
    opts: ['Me 💕', 'Partner / Friend 💌', 'Both equal! 🌟']
  },
  {
    q: 'Who is the master chef in the kitchen?',
    opts: ['Me 👨‍🍳', 'Partner / Friend 👩‍🍳', 'We cook together as a team! 🍳']
  }
];

export const TogetherTime: React.FC = () => {
  const { currentUser, partnerUser } = useAuth();
  const { 
    isCallActive, callType, startCall, endCall, 
    syncedMediaUrl, setSyncedMediaUrl, isPlayingMedia, setIsPlayingMedia 
  } = useUniverse();

  const { isMicMuted, isCameraOff, initializeCall, toggleMic, toggleCamera, endCall: webrtcEndCall } = useWebRTC();

  const [activeTab, setActiveTab] = useState<'games' | 'watch' | 'calls'>('games');
  const [activeGame, setActiveGame] = useState<'truth' | 'would' | 'never' | 'trivia' | 'tictactoe' | 'wordle' | 'compat' | 'canvas'>('truth');

  // Supabase Realtime Multiplayer Session Hook
  const {
    session,
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
  } = useRealtimeGame(activeGame);

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
  const [showWordleHint, setShowWordleHint] = useState(false);

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
    setShowWordleHint(false);
  };

  // Compatibility Quiz State
  const [compatAnswers, setCompatAnswers] = useState<Record<number, number>>({});
  const [compatSubmitted, setCompatSubmitted] = useState(false);

  const handleCompatSelect = (qIdx: number, optIdx: number) => {
    setCompatAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleCompatFinish = () => {
    setCompatSubmitted(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast.love('Compatibility calculated! ❤️');
  };

  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardText.trim()) return;
    setCustomDeck(prev => [...prev, { type: newCardType, text: newCardText.trim() }]);
    setNewCardText('');
    setShowCustomModal(false);
    toast.love('Custom question added to deck! 💌');
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff70a6');
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Listen for remote canvas drawing strokes broadcasted via Supabase Realtime
  useEffect(() => {
    const handleRemoteStroke = (e: any) => {
      const { x1, y1, x2, y2, color } = e.detail;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color || '#ff70a6';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    const handleRemoteClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('ou_remote_canvas_stroke', handleRemoteStroke);
    window.addEventListener('ou_remote_canvas_clear', handleRemoteClear);

    return () => {
      window.removeEventListener('ou_remote_canvas_stroke', handleRemoteStroke);
      window.removeEventListener('ou_remote_canvas_clear', handleRemoteClear);
    };
  }, []);

  const handleStartVoiceCall = () => {
    startCall('voice');
    toast.love('Calling... 📞');
  };

  const handleStartVideoCall = () => {
    startCall('video');
    toast.love('Starting Video Call... 📹');
  };

  const handleHangUp = () => {
    endCall();
    toast.info('Call ended');
  };

  const handleTriviaAnswer = (optIdx: number) => {
    setSelectedOpt(optIdx);
    const currentQ = COUPLE_TRIVIA[session.triviaIdx % COUPLE_TRIVIA.length];
    const isCorrect = optIdx === currentQ.answer;
    const updatedScore = isCorrect ? session.triviaScore + 1 : session.triviaScore;
    
    setTimeout(() => {
      setSelectedOpt(null);
      nextTriviaQuestion(updatedScore);
    }, 1200);
  };

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

      // Broadcast stroke via Supabase Realtime
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
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      <div className="glass-panel p-2.5 sm:p-3 rounded-3xl border border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'calls'
              ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg scale-105'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Voice &amp; Video Calls</span>
        </button>

        <button
          onClick={() => setActiveTab('watch')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'watch'
              ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg scale-105'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Watch/Listen Together</span>
        </button>

        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'games'
              ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg scale-105'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Couple Mini-Games</span>
        </button>
      </div>

      {activeTab === 'calls' && (
        <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-6">
          {!isCallActive ? (
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-accent-pink to-accent-purple p-1 shadow-xl flex items-center justify-center animate-pulse-heart">
                <Video className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Private WebRTC Call</h3>
                <p className="text-xs text-slate-300 mt-1">Start high-definition encrypted voice or video call with {partnerUser?.petName || partnerUser?.displayName || partnerUser?.username || 'your friend'}.</p>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleStartVoiceCall}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 transition-all active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Voice Call</span>
                </button>
                <button
                  onClick={handleStartVideoCall}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 transition-all active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Video Call</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <button
                onClick={toggleMic}
                className={`p-4 rounded-full ${isMicMuted ? 'bg-rose-500 text-white' : 'glass-card text-slate-200'}`}
              >
                {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                onClick={handleHangUp}
                className="p-5 rounded-full bg-rose-600 text-white shadow-xl hover:scale-110 active:scale-95 transition-transform"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              <button
                onClick={toggleCamera}
                className={`p-4 rounded-full ${isCameraOff ? 'bg-rose-500 text-white' : 'glass-card text-slate-200'}`}
              >
                {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'watch' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-pink-300 font-extrabold text-sm">
            <Sparkles className="w-5 h-5" />
            <span>Synchronized Watch Party</span>
          </div>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Paste a YouTube or MP4 video URL below to stream in sync together!
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={syncedMediaUrl}
              onChange={(e) => setSyncedMediaUrl(e.target.value)}
              placeholder="Paste YouTube or video link..."
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs"
            />
            <button
              onClick={() => {
                setIsPlayingMedia(!isPlayingMedia);
                toast.love(isPlayingMedia ? 'Paused stream' : 'Syncing playback! 🎬');
              }}
              className="px-5 py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
            >
              {isPlayingMedia ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlayingMedia ? 'Pause' : 'Sync'}</span>
            </button>
          </div>

          <div className="aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden glass-card border border-white/10 flex items-center justify-center relative shadow-2xl">
            {syncedMediaUrl ? (
              <iframe
                src={syncedMediaUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Tv className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
                <p className="text-xs text-slate-400">Waiting for video stream URL...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div className="space-y-6">
          {/* Multiplayer Realtime Room Status Bar */}
          <div className="glass-panel p-3 rounded-2xl border border-white/10 flex items-center justify-between text-xs shadow-md">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${partnerConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
              <span className="font-bold text-white">
                Online Multiplayer: <span className="text-pink-300">Supabase Realtime</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 font-semibold hidden sm:inline">
                {partnerConnected ? 'Partner Connected 🟢' : 'Partner Standing By ⏳'}
              </span>
            </div>
          </div>

          {/* Game Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveGame('truth')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeGame === 'truth' ? 'bg-accent-pink text-white shadow-lg' : 'glass-card text-slate-300'}`}
            >
              Truth or Dare
            </button>
            <button
              onClick={() => setActiveGame('wordle')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeGame === 'wordle' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' : 'glass-card text-slate-300'}`}
            >
              Love Wordle 🔤
            </button>
            <button
              onClick={() => setActiveGame('compat')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeGame === 'compat' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' : 'glass-card text-slate-300'}`}
            >
              Who Knows Who? 💖
            </button>
            <button
              onClick={() => setActiveGame('would')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeGame === 'would' ? 'bg-accent-purple text-white shadow-lg' : 'glass-card text-slate-300'}`}
            >
              Would You Rather
            </button>
            <button
              onClick={() => setActiveGame('never')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeGame === 'never' ? 'bg-accent-rose text-white shadow-lg' : 'glass-card text-slate-300'}`}
            >
              Never Have I Ever
            </button>
            <button
              onClick={() => setActiveGame('trivia')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeGame === 'trivia' ? 'bg-accent-gold text-space-950 font-black shadow-lg' : 'glass-card text-slate-300'}`}
            >
              Couple Trivia 🏆
            </button>
            <button
              onClick={() => setActiveGame('tictactoe')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeGame === 'tictactoe' ? 'bg-accent-violet text-white shadow-lg' : 'glass-card text-slate-300'}`}
            >
              Tic-Tac-Toe ❤️
            </button>
            <button
              onClick={() => setActiveGame('canvas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeGame === 'canvas' ? 'bg-accent-cyan text-space-950 font-black shadow-lg' : 'glass-card text-slate-300'}`}
            >
              Drawing Canvas 🎨
            </button>
          </div>

          {activeGame === 'truth' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4 relative">
              <button
                onClick={() => setShowCustomModal(true)}
                className="absolute top-4 right-4 text-xs font-bold text-pink-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-white/10 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Card</span>
              </button>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {customDeck[session.todIndex % customDeck.length].type}
              </span>
              <h3 className="text-xl font-extrabold text-white max-w-md mx-auto">
                "{customDeck[session.todIndex % customDeck.length].text}"
              </h3>
              <button
                onClick={() => nextTruthQuestion(customDeck.length)}
                className="px-6 py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-lg active:scale-95 transition-transform"
              >
                Next Question 🎲 (Syncs Live)
              </button>
            </div>
          )}

          {/* Love Wordle Mode */}
          {activeGame === 'wordle' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5 max-w-lg mx-auto text-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-extrabold text-white">Love Wordle</h3>
                </div>
                <button
                  onClick={() => setShowWordleHint(!showWordleHint)}
                  className="text-xs text-amber-300 hover:text-amber-200 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 font-bold"
                >
                  💡 {showWordleHint ? 'Hide Hint' : 'Hint'}
                </button>
              </div>

              {showWordleHint && (
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold animate-fade-in">
                  Hint: "{ROMANTIC_WORDLE_WORDS[wordleWordIdx % ROMANTIC_WORDLE_WORDS.length].hint}"
                </div>
              )}

              {/* 6 Guesses Grid */}
              <div className="space-y-2 max-w-[280px] mx-auto">
                {Array.from({ length: 6 }).map((_, rowIdx) => {
                  const guess = wordleGuesses[rowIdx] || (rowIdx === wordleGuesses.length ? currentWordleInput : '');
                  return (
                    <div key={rowIdx} className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: 5 }).map((__, colIdx) => {
                        const letter = guess[colIdx] || '';
                        let tileBg = 'glass-card border-white/10 text-white';

                        if (rowIdx < wordleGuesses.length) {
                          if (letter === targetWordle[colIdx]) {
                            tileBg = 'bg-emerald-500 border-emerald-400 text-white font-extrabold shadow-lg shadow-emerald-500/30';
                          } else if (targetWordle.includes(letter)) {
                            tileBg = 'bg-amber-500 border-amber-400 text-white font-extrabold shadow-lg shadow-amber-500/30';
                          } else {
                            tileBg = 'bg-slate-800/80 border-slate-700 text-slate-400';
                          }
                        }

                        return (
                          <div
                            key={colIdx}
                            className={`w-11 h-11 rounded-xl border flex items-center justify-center font-extrabold text-base uppercase transition-all ${tileBg}`}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Guess Input & Controls */}
              {!wordleGameWon && wordleGuesses.length < 6 ? (
                <div className="space-y-3">
                  <form onSubmit={handleWordleSubmit} className="flex gap-2 max-w-xs mx-auto">
                    <input
                      type="text"
                      maxLength={5}
                      value={currentWordleInput}
                      onChange={(e) => setCurrentWordleInput(e.target.value.toUpperCase())}
                      placeholder="Type or tap below"
                      className="flex-1 px-4 py-2 rounded-xl glass-input text-center text-sm font-bold tracking-widest uppercase min-h-[44px]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md min-h-[44px]"
                    >
                      Guess
                    </button>
                  </form>

                  {/* On-screen Touch Keyboard for Phones */}
                  <div className="space-y-1.5 pt-1 max-w-md mx-auto">
                    {[
                      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
                    ].map((row, rIdx) => (
                      <div key={rIdx} className="flex justify-center gap-1">
                        {row.map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              if (k === 'ENTER') {
                                handleWordleSubmit();
                              } else if (k === '⌫') {
                                setCurrentWordleInput(prev => prev.slice(0, -1));
                              } else {
                                if (currentWordleInput.length < 5) {
                                  setCurrentWordleInput(prev => prev + k);
                                }
                              }
                            }}
                            className={`h-10 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center select-none active:scale-90 ${
                              k === 'ENTER' || k === '⌫'
                                ? 'px-2.5 bg-pink-500/20 border border-pink-500/40 text-pink-300 min-w-[42px]'
                                : 'w-8 sm:w-9 glass-card border-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <p className={`font-extrabold text-sm ${wordleGameWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {wordleGameWon ? '✨ Congratulations! You cracked the romantic password! 💕' : `Word was: "${targetWordle}"`}
                  </p>
                  <button
                    onClick={handleNextWordle}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg min-h-[44px]"
                  >
                    Play Next Word ➡️
                  </button>
                </div>
              )}
            </div>
          )}

          {/* "Who Knows Who Better?" Mode */}
          {activeGame === 'compat' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-white flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5 text-accent-pink fill-current" />
                  <span>Who Knows Who Better?</span>
                </h3>
                <p className="text-xs text-pink-300">Answer these 5 fun questions and calculate your relationship harmony!</p>
              </div>

              <div className="space-y-4">
                {COMPATIBILITY_QUESTIONS.map((q, qIdx) => (
                  <div key={qIdx} className="glass-card p-4 rounded-2xl border border-white/10 space-y-2.5">
                    <p className="text-xs font-bold text-white">{qIdx + 1}. {q.q}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {q.opts.map((opt, optIdx) => {
                        const isSelected = compatAnswers[qIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleCompatSelect(qIdx, optIdx)}
                            className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all text-center ${
                              isSelected
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-md'
                                : 'glass-card text-slate-300 hover:text-white border-white/10 hover:border-pink-400/40'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!compatSubmitted ? (
                <button
                  onClick={handleCompatFinish}
                  disabled={Object.keys(compatAnswers).length < COMPATIBILITY_QUESTIONS.length}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Calculate Compatibility Synergy ✨
                </button>
              ) : (
                <div className="p-5 rounded-2xl glass-panel-glow border border-pink-400/40 text-center space-y-2 animate-fade-in">
                  <span className="text-3xl">💖</span>
                  <h4 className="text-lg font-extrabold text-white">99.9% Synergy Match!</h4>
                  <p className="text-xs text-pink-300">
                    You and {partnerUser?.displayName || 'your partner'} are completely in tune with each other! 💕
                  </p>
                  <button
                    onClick={() => { setCompatAnswers({}); setCompatSubmitted(false); }}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          )}

          {activeGame === 'would' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <h3 className="text-xl font-extrabold text-white max-w-md mx-auto">
                "{WOULD_YOU_RATHER[session.wyrIndex % WOULD_YOU_RATHER.length]}"
              </h3>
              <button
                onClick={() => nextWouldRather(WOULD_YOU_RATHER.length)}
                className="px-6 py-2.5 rounded-xl bg-accent-purple text-white font-bold text-xs shadow-lg active:scale-95 transition-transform"
              >
                Next Scenario 🔮 (Syncs Live)
              </button>
            </div>
          )}

          {activeGame === 'never' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Never Have I Ever
              </span>
              <h3 className="text-xl font-extrabold text-white max-w-md mx-auto">
                "{NEVER_HAVE_I_EVER[session.nhieIndex % NEVER_HAVE_I_EVER.length]}"
              </h3>
              <button
                onClick={() => nextNeverHaveIEver(NEVER_HAVE_I_EVER.length)}
                className="px-6 py-2.5 rounded-xl bg-accent-rose text-white font-bold text-xs shadow-lg active:scale-95 transition-transform"
              >
                Next Card 🙈 (Syncs Live)
              </button>
            </div>
          )}

          {activeGame === 'trivia' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs text-pink-300 font-bold">
                <span>Trivia Quiz Challenge</span>
                <span className="flex items-center gap-1 text-amber-300"><Trophy className="w-4 h-4"/> Score: {session.triviaScore}</span>
              </div>
              <h3 className="text-lg font-extrabold text-white text-center">
                {COUPLE_TRIVIA[session.triviaIdx % COUPLE_TRIVIA.length].question}
              </h3>
              <div className="space-y-2 pt-2">
                {COUPLE_TRIVIA[session.triviaIdx % COUPLE_TRIVIA.length].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleTriviaAnswer(i)}
                    className={`w-full p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      selectedOpt === i
                        ? i === COUPLE_TRIVIA[session.triviaIdx % COUPLE_TRIVIA.length].answer
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                          : 'bg-rose-500/30 border-rose-400 text-rose-200'
                        : 'glass-card border-white/10 hover:border-pink-400/40 text-white'
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedOpt === i && (
                      i === COUPLE_TRIVIA[session.triviaIdx % COUPLE_TRIVIA.length].answer ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeGame === 'tictactoe' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-white">Online 2-Player Tic-Tac-Toe</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  Live Synced
                </span>
              </div>

              {/* Turn Indicator Banner */}
              <div className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                isMyTurn
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-amber-500/20 border-amber-400/60 text-amber-300'
              }`}>
                <span>{isMyTurn ? "👉 YOUR TURN (Tap square)" : `⏳ OPPONENT'S TURN (${session.player2Name})`}</span>
                <span className="text-[10px] opacity-80">{isMyTurn ? 'Your move' : 'Waiting...'}</span>
              </div>

              <div className="flex items-center justify-around bg-white/5 p-3 rounded-2xl border border-white/10 text-xs font-bold">
                <span className="text-pink-300">{session.player1Name} ❤️: {session.p1Wins}</span>
                <span className="text-slate-500">|</span>
                <span className="text-purple-300">{session.player2Name} ⭐: {session.p2Wins}</span>
              </div>

              {session.winnerUid ? (
                <p className="text-sm font-bold text-emerald-400 animate-bounce">
                  Winner: {session.winnerUid === 'draw' ? "It's a Draw!" : `${session.winnerUid === session.player1Uid ? session.player1Name : session.player2Name}`} 🎉
                </p>
              ) : null}

              {/* Interactive Synced 3x3 Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[256px] aspect-square mx-auto">
                {session.tictactoeBoard.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => makeTicTacToeMove(idx)}
                    disabled={!isMyTurn || Boolean(cell) || Boolean(session.winnerUid)}
                    className={`glass-card rounded-2xl text-2xl flex items-center justify-center transition-all ${
                      !cell && isMyTurn ? 'hover:bg-white/20 hover:scale-105 cursor-pointer border-pink-400/40' : 'cursor-default'
                    }`}
                  >
                    {cell}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => resetTicTacToe()}
                  className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Board</span>
                </button>
              </div>
            </div>
          )}

          {activeGame === 'canvas' && (
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">Live Collaborative Couple Canvas</h4>
                  <p className="text-[10px] text-pink-300">Strokes stream live to partner's screen in real-time!</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
                  />
                  <button onClick={clearCanvas} className="px-3 py-1 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20">
                    Clear Canvas
                  </button>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={700}
                height={350}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full bg-space-950 rounded-2xl border border-white/10 cursor-crosshair touch-none shadow-2xl"
              />
            </div>
          )}
        </div>
      )}

      {/* Add Custom Truth or Dare Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-pink-400/40 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white">Add Custom Card</h4>
              <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomCard} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewCardType('Truth')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border ${newCardType === 'Truth' ? 'bg-pink-500/30 border-pink-400 text-white' : 'glass-card text-slate-300'}`}
                >
                  Truth 💭
                </button>
                <button
                  type="button"
                  onClick={() => setNewCardType('Dare')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border ${newCardType === 'Dare' ? 'bg-rose-500/30 border-rose-400 text-white' : 'glass-card text-slate-300'}`}
                >
                  Dare 🔥
                </button>
              </div>

              <textarea
                value={newCardText}
                onChange={(e) => setNewCardText(e.target.value)}
                placeholder="Write your custom romantic question or dare..."
                rows={3}
                className="w-full p-3 rounded-2xl glass-input text-xs"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-md"
              >
                Add to Active Deck
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
