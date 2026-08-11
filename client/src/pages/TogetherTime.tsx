import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useRealtimeGame } from '../hooks/useRealtimeGame';
import { toast } from '../lib/toast';
import { sounds } from '../lib/soundEffects';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Play, Pause, 
  Gamepad2, Sparkles, Tv, Music, Palette, HelpCircle, Heart, Trophy, Check, X, Users, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

const TRUTH_OR_DARE_QUESTIONS = [
  { type: 'Truth', text: 'What was your very first thought when you first met me?' },
  { type: 'Truth', text: 'Which moment of ours was your favorite date ever?' },
  { type: 'Dare', text: 'Sing 30 seconds of your favorite romantic song right now!' },
  { type: 'Dare', text: 'Send me a 15-second voice note saying 3 things you love about me.' }
];

const WOULD_YOU_RATHER = [
  'Would you rather spend a cozy rainy weekend indoors or go on a surprise road trip?',
  'Would you rather watch romantic sunsets by the beach or stargaze on a mountain top?',
  'Would you rather have infinite breakfast in bed or late-night dessert dates forever?'
];

const NEVER_HAVE_I_EVER = [
  'Never have I ever stayed up until 4 AM talking to you on the phone.',
  'Never have I ever re-read our old chat messages when missing you.',
  'Never have I ever secretly saved a screenshot of your cute photo.',
  'Never have I ever planned our dream wedding destination in my mind!'
];

const COUPLE_TRIVIA = [
  { question: 'Where was our official first date spot?', options: ['Vijayawada Lake ☕', 'Medchal Park 🌸', 'Beach Resort 🏖️', 'Movie Theater 🍿'], answer: 0 },
  { question: 'What is Naveen\'s favorite pet name for Humera?', options: ['Jaanu ❤️', 'Sweetheart', 'Angel', 'Honey'], answer: 0 },
  { question: 'What is Humera\'s favorite pet name for Naveen?', options: ['Bangaram ❤️', 'Prince', 'Babe', 'Sunshine'], answer: 0 }
];

export const TogetherTime: React.FC = () => {
  const { currentUser, partnerUser } = useAuth();
  const { 
    isCallActive, callType, startCall, endCall, 
    syncedMediaUrl, setSyncedMediaUrl, isPlayingMedia, setIsPlayingMedia 
  } = useUniverse();

  const { isMicMuted, isCameraOff, initializeCall, toggleMic, toggleCamera, endCall: webrtcEndCall } = useWebRTC();

  const [activeTab, setActiveTab] = useState<'calls' | 'watch' | 'games'>('calls');
  const [activeGame, setActiveGame] = useState<'truth' | 'would' | 'never' | 'trivia' | 'tictactoe' | 'canvas'>('truth');

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
          <span>Voice & Video Calls</span>
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
                <p className="text-xs text-slate-300 mt-1">Start high-definition encrypted voice or video call with {partnerUser?.petName}.</p>
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
              Couple Trivia Quiz 🏆
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
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {TRUTH_OR_DARE_QUESTIONS[session.todIndex % TRUTH_OR_DARE_QUESTIONS.length].type}
              </span>
              <h3 className="text-xl font-extrabold text-white max-w-md mx-auto">
                "{TRUTH_OR_DARE_QUESTIONS[session.todIndex % TRUTH_OR_DARE_QUESTIONS.length].text}"
              </h3>
              <button
                onClick={nextTruthQuestion}
                className="px-6 py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-lg active:scale-95 transition-transform"
              >
                Next Question 🎲 (Syncs Live)
              </button>
            </div>
          )}

          {activeGame === 'would' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <h3 className="text-xl font-extrabold text-white max-w-md mx-auto">
                "{WOULD_YOU_RATHER[session.wyrIndex % WOULD_YOU_RATHER.length]}"
              </h3>
              <button
                onClick={nextWouldRather}
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
                onClick={nextNeverHaveIEver}
                className="px-6 py-2.5 rounded-xl bg-accent-rose text-white font-bold text-xs shadow-lg active:scale-95 transition-transform"
              >
                Next Card 🙈 (Syncs Live)
              </button>
            </div>
          )}

          {activeGame === 'trivia' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs text-pink-300 font-bold">
                <span>Couple Trivia Quiz</span>
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
                <span>{isMyTurn ? "👉 YOUR TURN (Tap square)" : `⏳ OPPONENT'S TURN (${session.currentTurn})`}</span>
                <span className="text-[10px] opacity-80">{isMyTurn ? 'Your move' : 'Waiting...'}</span>
              </div>

              <div className="flex items-center justify-around bg-white/5 p-3 rounded-2xl border border-white/10 text-xs font-bold">
                <span className="text-pink-300">Naveen ❤️: {session.xWins}</span>
                <span className="text-slate-500">|</span>
                <span className="text-purple-300">Humera 💖: {session.oWins}</span>
              </div>

              {session.winner ? (
                <p className="text-sm font-bold text-emerald-400 animate-bounce">
                  Winner: {session.winner === 'Draw' ? "It's a Draw!" : `${session.winner}`} 🎉
                </p>
              ) : null}

              {/* Interactive Synced 3x3 Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[256px] aspect-square mx-auto">
                {session.tictactoeBoard.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => makeTicTacToeMove(idx)}
                    disabled={!isMyTurn || Boolean(cell) || Boolean(session.winner)}
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
                  onClick={() => resetTicTacToe(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Board</span>
                </button>
                <button
                  onClick={() => resetTicTacToe(true)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 text-xs font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                >
                  Reset Scoreboard
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
    </div>
  );
};
