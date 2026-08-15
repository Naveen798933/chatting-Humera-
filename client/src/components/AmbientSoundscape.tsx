import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Sparkles, CloudRain, Flame, Waves, Moon, Music, X } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { toast } from '../lib/toast';

export type SoundscapeType = 'rain' | 'fireplace' | 'ocean' | 'night' | 'lofi';

interface SoundscapeTrack {
  id: SoundscapeType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const TRACKS: SoundscapeTrack[] = [
  {
    id: 'rain',
    title: 'Cozy Rain',
    subtitle: 'Gentle raindrops on the window',
    icon: <CloudRain className="w-5 h-5 text-cyan-300" />,
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'fireplace',
    title: 'Cozy Fireplace',
    subtitle: 'Warm crackling fireplace embers',
    icon: <Flame className="w-5 h-5 text-amber-400" />,
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'ocean',
    title: 'Gentle Waves',
    subtitle: 'Rhythmic calming ocean tides',
    icon: <Waves className="w-5 h-5 text-emerald-300" />,
    color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30',
    gradient: 'from-teal-500 to-emerald-600'
  },
  {
    id: 'night',
    title: 'Starry Night',
    subtitle: 'Crickets & peaceful night breeze',
    icon: <Moon className="w-5 h-5 text-indigo-300" />,
    color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
    gradient: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'lofi',
    title: 'Cosmic Lo-Fi',
    subtitle: 'Soft romantic relaxing chimes',
    icon: <Music className="w-5 h-5 text-pink-300" />,
    color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    gradient: 'from-pink-500 to-purple-600'
  }
];

export const AmbientSoundscapeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<SoundscapeType>('rain');
  const [volume, setVolume] = useState(0.5);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const generatorNodesRef = useRef<any[]>([]);
  const loFiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAllAudio = () => {
    if (loFiIntervalRef.current) {
      clearInterval(loFiIntervalRef.current);
      loFiIntervalRef.current = null;
    }
    generatorNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (_) {}
    });
    generatorNodesRef.current = [];
  };

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
        const gainNode = audioCtxRef.current.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(audioCtxRef.current.destination);
        gainNodeRef.current = gainNode;
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Web Audio Synthesizer for Ambient Soundscapes
  const startSoundscape = (type: SoundscapeType) => {
    const ctx = initAudioContext();
    if (!ctx || !gainNodeRef.current) return;

    stopAllAudio();

    const masterGain = gainNodeRef.current;

    if (type === 'rain') {
      // Pink/White noise filtered for soft raindrops
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.15;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();
      generatorNodesRef.current.push(whiteNoise, filter);
    } else if (type === 'fireplace') {
      // Brown noise + crackles
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Crackle spikes
        const crackle = Math.random() > 0.998 ? (Math.random() * 2 - 1) * 0.8 : 0;
        output[i] = ((lastOut + (0.02 * white)) / 1.02) * 0.7 + crackle;
        lastOut = output[i];
      }

      const fireNoise = ctx.createBufferSource();
      fireNoise.buffer = noiseBuffer;
      fireNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      fireNoise.connect(filter);
      filter.connect(masterGain);
      fireNoise.start();
      generatorNodesRef.current.push(fireNoise, filter);
    } else if (type === 'ocean') {
      // Modulated pink noise simulating wave cycles
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        output[i] = (b0 + b1) * 0.12;
      }

      const oceanNoise = ctx.createBufferSource();
      oceanNoise.buffer = noiseBuffer;
      oceanNoise.loop = true;

      const waveGain = ctx.createGain();
      waveGain.gain.value = 0.4;

      // LFO for wave swelling
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12; // wave cycle ~8 seconds
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.35;

      lfo.connect(lfoGain);
      lfoGain.connect(waveGain.gain);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 550;

      oceanNoise.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(masterGain);

      oceanNoise.start();
      lfo.start();
      generatorNodesRef.current.push(oceanNoise, lfo, lfoGain, waveGain, filter);
    } else if (type === 'night') {
      // High frequency crickets + warm drone
      const drone = ctx.createOscillator();
      drone.type = 'sine';
      drone.frequency.value = 110;

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.08;
      drone.connect(droneGain);
      droneGain.connect(masterGain);
      drone.start();

      // High frequency cricket oscillator
      const cricket = ctx.createOscillator();
      cricket.type = 'triangle';
      cricket.frequency.value = 4500;

      const cricketMod = ctx.createOscillator();
      cricketMod.frequency.value = 14;
      const cricketModGain = ctx.createGain();
      cricketModGain.gain.value = 0.05;

      cricketMod.connect(cricketModGain);
      const cricketGain = ctx.createGain();
      cricketGain.gain.value = 0.04;
      cricketModGain.connect(cricketGain.gain);

      cricket.connect(cricketGain);
      cricketGain.connect(masterGain);

      cricket.start();
      cricketMod.start();
      generatorNodesRef.current.push(drone, droneGain, cricket, cricketMod, cricketModGain, cricketGain);
    } else if (type === 'lofi') {
      // Pentatonic warm electric piano chimes
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33]; // C Pentatonic + Major
      const playChime = () => {
        if (!audioCtxRef.current || !gainNodeRef.current) return;
        const noteCtx = audioCtxRef.current;
        const freq = scale[Math.floor(Math.random() * scale.length)];
        
        const osc = noteCtx.createOscillator();
        const noteGain = noteCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteCtx.currentTime);

        noteGain.gain.setValueAtTime(0, noteCtx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.12, noteCtx.currentTime + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteCtx.currentTime + 2.4);

        osc.connect(noteGain);
        noteGain.connect(gainNodeRef.current);

        osc.start();
        osc.stop(noteCtx.currentTime + 2.5);
      };

      playChime();
      loFiIntervalRef.current = setInterval(playChime, 1800);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAllAudio();
      setIsPlaying(false);
      toast.info('Soundscape paused');
    } else {
      startSoundscape(activeTrack);
      setIsPlaying(true);
      toast.love(`Playing ${TRACKS.find(t => t.id === activeTrack)?.title} 🎶`);
    }
  };

  const handleSelectTrack = (trackId: SoundscapeType) => {
    setActiveTrack(trackId);
    if (isPlaying) {
      startSoundscape(trackId);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVol;
    }
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <motion.div className="glass-panel-glow max-w-lg w-full rounded-3xl border border-pink-400/40 p-6 sm:p-7 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-pink to-accent-purple p-0.5 shadow-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">Ambient Soundscapes</h3>
            <p className="text-xs text-pink-300">Cozy background audio for chatting &amp; relaxing together</p>
          </div>
        </div>

        {/* Track Selector List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TRACKS.map((track) => {
            const isCurrent = activeTrack === track.id;
            return (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  isCurrent
                    ? `bg-gradient-to-r ${track.gradient} text-white shadow-lg scale-[1.02] border-white/30`
                    : `glass-card border-white/10 text-slate-300 hover:text-white hover:border-pink-400/30`
                }`}
              >
                <div className={`p-2 rounded-xl ${isCurrent ? 'bg-white/20' : 'bg-white/5'}`}>
                  {track.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate">{track.title}</p>
                  <p className={`text-[10px] truncate ${isCurrent ? 'text-white/80' : 'text-slate-400'}`}>{track.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Player Controls Bar */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleTogglePlay}
              className={`p-3.5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-rose-500/30'
                  : 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-pink-500/30'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span className="text-xs font-extrabold">{isPlaying ? 'Pause Ambient' : 'Play Soundscape'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-48">
            <button
              onClick={() => handleVolumeChange(volume === 0 ? 0.5 : 0)}
              className="text-slate-400 hover:text-white p-1"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-pink-300" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-pink-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 font-bold w-7 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Animated Sound Wave Indicator */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-1 py-1">
            {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 35, 75].map((height, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-accent-pink to-accent-purple rounded-full animate-pulse"
                style={{
                  height: `${height}%`,
                  maxHeight: '24px',
                  animationDelay: `${i * 90}ms`,
                  animationDuration: '800ms'
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
