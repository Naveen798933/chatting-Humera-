import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { toast } from '../lib/toast';
import { sounds } from '../lib/soundEffects';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Play, Pause, 
  Gamepad2, Sparkles, Tv, Music, Palette, HelpCircle, Heart, Trophy, Check, X
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

  const [activeTab, setActiveTab] = useState<'calls' | 'watch' | 'games'>('calls');

  const [activeGame, setActiveGame] = useState<'truth' | 'would' | 'never' | 'trivia' | 'tictactoe' | 'canvas'>('truth');
  const [todIndex, setTodIndex] = useState(0);
  const [wyrIndex, setWyrIndex] = useState(0);
  const [nhieIndex, setNhieIndex] = useState(0);

  // Trivia state
  const [triviaIdx, setTriviaIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  const [board, setBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [xWins, setXWins] = useState(0);
  const [oWins, setOWins] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff70a6');

  const handleCellClick = (idx: number) => {
    if (board[idx] || calculateWinner(board)) return;
    const newBoard = [...board];
    const symbol = isXNext ? '❤️' : '💖';
    newBoard[idx] = symbol;
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const win = calculateWinner(newBoard);
    if (win === '❤️') setXWins(p => p + 1);
    if (win === '💖') setOWins(p => p + 1);
  };

  const resetTicTacToe = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const calculateWinner = (squares: Array<string | null>) => {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (let l of lines) {
      const [a, b, c] = l;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleTriviaAnswer = (optIdx: number) => {
    setSelectedOpt(optIdx);
    if (optIdx === COUPLE_TRIVIA[triviaIdx].answer) {
      setScore(prev => prev + 1);
    }
    setTimeout(() => {
      setSelectedOpt(null);
      setTriviaIdx((prev) => (prev + 1) % COUPLE_TRIVIA.length);
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

    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = drawColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getCanvasPos(e);
    drawAt(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
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
  };

  const winner = calculateWinner(board);

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
            <div className="space-y-6">
              <div className="relative w-full h-[50vh] bg-space-950 rounded-3xl overflow-hidden border border-pink-400/40 shadow-2xl">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-space-900 to-space-950">
                  {!isCameraOff ? (
                    <img
                      src={partnerUser?.photoURL}
                      alt={partnerUser?.realName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser?.realName || 'Partner')}&background=a855f7&color=fff`;
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <img
                        src={partnerUser?.photoURL}
                        alt={partnerUser?.realName}
                        className="w-24 h-24 rounded-full mx-auto border-4 border-pink-400 mb-2 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser?.realName || 'Partner')}&background=a855f7&color=fff`;
                        }}
                      />
                      <p className="font-bold text-white text-sm">{partnerUser?.petName}</p>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 right-4 w-32 h-44 rounded-2xl overflow-hidden border-2 border-accent-pink shadow-xl bg-space-900">
                  <img
                    src={currentUser?.photoURL}
                    alt={currentUser?.realName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.realName || 'User')}&background=ff70a6&color=fff`;
                    }}
                  />
                </div>
              </div>

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
            </div>
          )}
        </div>
      )}

      {activeTab === 'watch' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-accent-pink" />
              <span>Watch & Listen Together Sync Room</span>
            </h3>
          </div>

          {/* YouTube Video URL Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={syncedMediaUrl}
              onChange={(e) => setSyncedMediaUrl(e.target.value)}
              placeholder="Paste YouTube Video URL e.g. https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs"
            />
            <button
              onClick={() => toast.love('Video synced for both of you! 🍿')}
              className="px-4 py-2.5 rounded-xl bg-accent-pink text-white text-xs font-bold shadow-md"
            >
              Sync Video
            </button>
          </div>

          <div className="relative w-full h-[45vh] bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
            <iframe
              src={
                syncedMediaUrl.includes('youtube.com/watch?v=')
                  ? `https://www.youtube.com/embed/${syncedMediaUrl.split('v=')[1]?.split('&')[0]}?autoplay=1`
                  : syncedMediaUrl.includes('youtu.be/')
                  ? `https://www.youtube.com/embed/${syncedMediaUrl.split('youtu.be/')[1]?.split('?')[0]}?autoplay=1`
                  : "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=0"
              }
              title="Watch Together Video"
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlayingMedia(!isPlayingMedia)}
                className="p-3 rounded-xl bg-accent-pink text-white font-bold"
              >
                {isPlayingMedia ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <span className="text-xs font-bold text-white">Synced Stream Playing</span>
            </div>
            <span className="text-2xl animate-bounce">💖 🎉 🍿</span>
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveGame('truth')}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${activeGame === 'truth' ? 'bg-accent-pink text-white' : 'glass-card text-slate-300'}`}
            >
              Truth or Dare
            </button>
            <button
              onClick={() => setActiveGame('would')}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${activeGame === 'would' ? 'bg-accent-purple text-white' : 'glass-card text-slate-300'}`}
            >
              Would You Rather
            </button>
            <button
              onClick={() => setActiveGame('never')}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${activeGame === 'never' ? 'bg-accent-rose text-white' : 'glass-card text-slate-300'}`}
            >
              Never Have I Ever
            </button>
            <button
              onClick={() => setActiveGame('trivia')}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${activeGame === 'trivia' ? 'bg-accent-gold text-space-950 font-black' : 'glass-card text-slate-300'}`}
            >
              Couple Trivia Quiz 🏆
            </button>
            <button
              onClick={() => setActiveGame('tictactoe')}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${activeGame === 'tictactoe' ? 'bg-accent-violet text-white' : 'glass-card text-slate-300'}`}
            >
              Tic-Tac-Toe ❤️
            </button>
            <button
              onClick={() => setActiveGame('canvas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${activeGame === 'canvas' ? 'bg-accent-cyan text-space-950 font-black' : 'glass-card text-slate-300'}`}
            >
              Drawing Canvas 🎨
            </button>
          </div>

          {activeGame === 'truth' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300">
                {TRUTH_OR_DARE_QUESTIONS[todIndex].type}
              </span>
              <h3 className="text-xl font-extrabold text-white max-w-md mx-auto">
                "{TRUTH_OR_DARE_QUESTIONS[todIndex].text}"
              </h3>
              <button
                onClick={() => setTodIndex((todIndex + 1) % TRUTH_OR_DARE_QUESTIONS.length)}
                className="px-6 py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs"
              >
                Next Question 🎲
              </button>
            </div>
          )}

          {activeGame === 'would' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <h3 className="text-xl font-extrabold text-white max-w-md mx-auto">
                "{WOULD_YOU_RATHER[wyrIndex]}"
              </h3>
              <button
                onClick={() => setWyrIndex((wyrIndex + 1) % WOULD_YOU_RATHER.length)}
                className="px-6 py-2.5 rounded-xl bg-accent-purple text-white font-bold text-xs"
              >
                Next Scenario 🔮
              </button>
            </div>
          )}

          {activeGame === 'never' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300">
                Never Have I Ever
              </span>
              <h3 className="text-xl font-extrabold text-white max-w-md mx-auto">
                "{NEVER_HAVE_I_EVER[nhieIndex]}"
              </h3>
              <button
                onClick={() => setNhieIndex((nhieIndex + 1) % NEVER_HAVE_I_EVER.length)}
                className="px-6 py-2.5 rounded-xl bg-accent-rose text-white font-bold text-xs"
              >
                Next Card 🙈
              </button>
            </div>
          )}

          {activeGame === 'trivia' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs text-pink-300 font-bold">
                <span>Couple Trivia Quiz</span>
                <span className="flex items-center gap-1 text-amber-300"><Trophy className="w-4 h-4"/> Score: {score}</span>
              </div>
              <h3 className="text-lg font-extrabold text-white text-center">
                {COUPLE_TRIVIA[triviaIdx].question}
              </h3>
              <div className="space-y-2 pt-2">
                {COUPLE_TRIVIA[triviaIdx].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleTriviaAnswer(i)}
                    className={`w-full p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      selectedOpt === i
                        ? i === COUPLE_TRIVIA[triviaIdx].answer
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                          : 'bg-rose-500/30 border-rose-400 text-rose-200'
                        : 'glass-card border-white/10 hover:border-pink-400/40 text-white'
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedOpt === i && (
                      i === COUPLE_TRIVIA[triviaIdx].answer ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeGame === 'tictactoe' && (
            <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-4 max-w-md mx-auto">
              <h3 className="font-extrabold text-base text-white">Couple Tic-Tac-Toe</h3>

              <div className="flex items-center justify-around bg-white/5 p-3 rounded-2xl border border-white/10 text-xs font-bold">
                <span className="text-pink-300">Naveen ❤️: {xWins}</span>
                <span className="text-slate-500">|</span>
                <span className="text-purple-300">Humera 💖: {oWins}</span>
              </div>

              {winner ? (
                <p className="text-sm font-bold text-emerald-400">Winner: {winner} 🎉</p>
              ) : (
                <p className="text-xs text-slate-300">Next turn: {isXNext ? 'Naveen ❤️' : 'Humera 💖'}</p>
              )}

              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[256px] aspect-square mx-auto">
                {board.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    className="glass-card rounded-2xl text-2xl flex items-center justify-center hover:bg-white/10"
                  >
                    {cell}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button onClick={resetTicTacToe} className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20">
                  Reset Board
                </button>
                <button
                  onClick={() => { resetTicTacToe(); setXWins(0); setOWins(0); toast.info('Scoreboard reset 🔄'); }}
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
                <h4 className="font-bold text-sm text-white">Collaborative Couple Canvas</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
                  />
                  <button onClick={clearCanvas} className="px-3 py-1 rounded-lg bg-white/10 text-xs font-bold text-white">
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
                className="w-full bg-space-950 rounded-2xl border border-white/10 cursor-crosshair touch-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
