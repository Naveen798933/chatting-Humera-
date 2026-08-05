import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, FastForward, Volume2 } from 'lucide-react';

interface VoiceNotePlayerProps {
  src: string;
  isMe?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ src, isMe = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    const speeds = [1.0, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audio) {
      audio.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate 16 decorative waveform frequency height bars
  const barHeights = [40, 75, 55, 90, 60, 100, 45, 80, 65, 95, 50, 70, 85, 40, 60, 90];

  return (
    <div className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col gap-2 max-w-xs sm:max-w-sm ${
      isMe ? 'bg-black/20 border-white/20 text-white' : 'glass-panel border-white/10 text-white'
    }`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 flex-shrink-0 ${
            isMe
              ? 'bg-white text-purple-700 hover:bg-slate-100'
              : 'bg-gradient-to-r from-accent-pink to-accent-purple text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Waveform Visualization Bars */}
        <div className="flex-1 flex items-center gap-1 h-8 px-1 overflow-hidden">
          {barHeights.map((h, idx) => {
            const progress = duration > 0 ? currentTime / duration : 0;
            const barProgress = idx / barHeights.length;
            const isPassed = progress >= barProgress;

            return (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isPassed
                    ? isMe ? 'bg-pink-200' : 'bg-pink-400'
                    : 'bg-white/25'
                } ${isPlaying ? 'animate-pulse' : ''}`}
                style={{
                  height: `${h}%`,
                  animationDelay: `${idx * 60}ms`
                }}
              />
            );
          })}
        </div>

        {/* Speed Toggle Button */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-bold text-white tracking-wider flex items-center gap-0.5 flex-shrink-0"
          title="Playback Speed"
        >
          <span>{playbackSpeed.toFixed(1)}x</span>
        </button>
      </div>

      {/* Custom Seek Bar & Timer */}
      <div className="flex items-center gap-2 text-[10px] opacity-80 px-0.5">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-400"
        />
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
