import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCw, Maximize2, Minimize2, MonitorUp, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { UserProfile } from '../types';

interface ActiveCallOverlayProps {
  isOpen: boolean;
  callType: 'voice' | 'video' | null;
  partnerUser: UserProfile | null;
  currentUser: UserProfile | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onSwitchCamera?: () => void;
  onToggleScreenShare?: () => void;
  onEndCall: () => void;
}

export const ActiveCallOverlay: React.FC<ActiveCallOverlayProps> = ({
  isOpen,
  callType,
  partnerUser,
  currentUser,
  localStream,
  remoteStream,
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onToggleScreenShare,
  onEndCall
}) => {
  const localMainVideoRef = useRef<HTMLVideoElement | null>(null);
  const localPipVideoRef  = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef    = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef    = useRef<HTMLAudioElement | null>(null);

  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized]   = useState(false);

  // Call duration timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isOpen) {
      setCallDuration(0);
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen]);

  // Bind local stream to both main and PiP refs
  useEffect(() => {
    if (localStream) {
      if (localMainVideoRef.current) {
        localMainVideoRef.current.srcObject = localStream;
        localMainVideoRef.current.play().catch(() => {});
      }
      if (localPipVideoRef.current) {
        localPipVideoRef.current.srcObject = localStream;
        localPipVideoRef.current.play().catch(() => {});
      }
    }
  }, [localStream, isOpen, isCameraOff, remoteStream]);

  // Bind remote stream to video and audio elements
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, isOpen]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen || !callType) return null;

  // Check if remote stream has active video track
  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live');

  return (
    <AnimatePresence>
      {isMinimized ? (
        /* Floating Minimized Call Card */
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="fixed bottom-24 right-4 z-50 glass-panel p-3 rounded-2xl border border-pink-500/40 shadow-2xl flex items-center gap-3 bg-space-950/90 backdrop-blur-md cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-pink-400">
            <img src={partnerUser?.photoURL} alt={partnerUser?.realName} className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{partnerUser?.petName}</p>
            <p className="text-[10px] text-pink-300 font-mono">{formatDuration(callDuration)}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
            className="p-1 text-slate-300 hover:text-white"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        /* Full-Screen Calling Overlay */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-space-950 flex flex-col justify-between p-4 sm:p-6 overflow-hidden"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <img
                src={partnerUser?.photoURL}
                alt={partnerUser?.realName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-pink-400 shadow-lg"
              />
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base">{partnerUser?.petName || partnerUser?.realName}</h3>
                <p className="text-xs text-pink-300 font-mono flex items-center gap-1.5 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{formatDuration(callDuration)}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    Full HD 1080p • 48kHz Stereo
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-2.5 rounded-full glass-card text-slate-300 hover:text-white"
              title="Minimize Call"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Video / Audio Main Display */}
          <div className="relative flex-1 my-4 rounded-3xl overflow-hidden glass-panel border border-white/10 flex items-center justify-center bg-black/50">
            {/* 1. Remote Video Stream (if partner has video) */}
            {hasRemoteVideo ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : callType === 'video' && localStream && !isCameraOff ? (
              /* 2. Self Camera Preview (before partner connects video) */
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={localMainVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              </div>
            ) : (
              /* 3. Voice Call / Camera Off Avatar Placeholder */
              <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-accent-pink to-accent-purple shadow-2xl animate-pulse-heart">
                  <img
                    src={partnerUser?.photoURL}
                    alt={partnerUser?.realName}
                    className="w-full h-full rounded-full object-cover border-4 border-space-950"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-white">{partnerUser?.petName}</h4>
                  <p className="text-xs text-slate-300 mt-1">Encrypted {callType === 'video' ? 'Video' : 'Voice'} Call</p>
                </div>
              </div>
            )}

            {/* Picture-in-Picture Self Video Window */}
            {callType === 'video' && hasRemoteVideo && (
              <div className="absolute bottom-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-accent-pink shadow-2xl bg-space-900 z-30">
                {!isCameraOff ? (
                  <video
                    ref={localPipVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-space-950">
                    <img src={currentUser?.photoURL} className="w-12 h-12 rounded-full border border-pink-400 mb-1" />
                    <span className="text-[10px] text-slate-400">Cam Off</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Control Bar — Responsive to all phone sizes */}
          <div
            className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-6 py-2 z-20 flex-wrap"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
          >
            <button
              onClick={onToggleMic}
              className={`p-3 sm:p-4 rounded-full shadow-xl transition-transform active:scale-95 ${
                isMicMuted ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'glass-panel text-white hover:bg-white/20'
              }`}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              className="p-4 sm:p-5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-2xl shadow-rose-600/50 hover:scale-110 active:scale-95 transition-transform"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
            </button>

            {/* Camera Toggle */}
            {callType === 'video' && (
              <button
                onClick={onToggleCamera}
                className={`p-3 sm:p-4 rounded-full shadow-xl transition-transform active:scale-95 ${
                  isCameraOff ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'glass-panel text-white hover:bg-white/20'
                }`}
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            )}

            {/* Switch Camera */}
            {callType === 'video' && onSwitchCamera && (
              <button
                onClick={onSwitchCamera}
                className="p-3 sm:p-4 rounded-full glass-panel text-slate-200 hover:text-white shadow-xl transition-transform active:scale-95"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Screen Share Toggle */}
            {callType === 'video' && onToggleScreenShare && (
              <button
                onClick={onToggleScreenShare}
                className={`p-3 sm:p-4 rounded-full shadow-xl transition-transform active:scale-95 ${
                  isScreenSharing ? 'bg-sky-500/40 text-sky-200 border border-sky-400/50 animate-pulse' : 'glass-panel text-slate-200 hover:text-white'
                }`}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <MonitorUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Hidden AutoPlay Remote Audio Stream */}
            <audio ref={remoteAudioRef} autoPlay controls={false} className="hidden" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
