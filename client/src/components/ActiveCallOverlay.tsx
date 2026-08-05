import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
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
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onSwitchCamera?: () => void;
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
  onToggleMic,
  onToggleCamera,
  onSwitchCamera,
  onEndCall
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Call duration counter
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

  // Bind local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isOpen, isCameraOff]);

  // Bind remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isOpen]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen || !callType) return null;

  return (
    <AnimatePresence>
      {isMinimized ? (
        /* Minimized Floating Call Bubble */
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
        /* Full-Screen Call Experience Overlay */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-space-950 flex flex-col justify-between p-4 sm:p-6 overflow-hidden"
        >
          {/* Top Header Controls */}
          <div className="flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <img
                src={partnerUser?.photoURL}
                alt={partnerUser?.realName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-pink-400 shadow-lg"
              />
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base">{partnerUser?.petName || partnerUser?.realName}</h3>
                <p className="text-xs text-pink-300 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{formatDuration(callDuration)}</span>
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

          {/* Video Stream Main View Area */}
          <div className="relative flex-1 my-4 rounded-3xl overflow-hidden glass-panel border border-white/10 flex items-center justify-center bg-black/40">
            {/* Remote Stream Video or Placeholder Avatar */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : callType === 'video' && !isCameraOff ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
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
                  <p className="text-xs text-slate-300 mt-1">Encrypted End-to-End {callType === 'video' ? 'Video' : 'Voice'} Call</p>
                </div>
              </div>
            )}

            {/* Self Video View Picture-in-Picture (PiP) Overlay */}
            {callType === 'video' && (
              <div className="absolute bottom-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-accent-pink shadow-2xl bg-space-900 z-30">
                {!isCameraOff ? (
                  <video
                    ref={localVideoRef}
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

          {/* Bottom WhatsApp-Style Control Action Bar */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 py-2 z-20">
            {/* Toggle Mic Button */}
            <button
              onClick={onToggleMic}
              className={`p-4 rounded-full shadow-xl transition-transform active:scale-95 ${
                isMicMuted ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'glass-panel text-white hover:bg-white/20'
              }`}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={onEndCall}
              className="p-5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-2xl shadow-rose-600/50 hover:scale-110 active:scale-95 transition-transform"
              title="End Call"
            >
              <PhoneOff className="w-8 h-8 fill-current" />
            </button>

            {/* Toggle Camera Button */}
            {callType === 'video' && (
              <button
                onClick={onToggleCamera}
                className={`p-4 rounded-full shadow-xl transition-transform active:scale-95 ${
                  isCameraOff ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'glass-panel text-white hover:bg-white/20'
                }`}
                title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            {/* Switch Camera Button (Mobile) */}
            {callType === 'video' && onSwitchCamera && (
              <button
                onClick={onSwitchCamera}
                className="p-4 rounded-full glass-panel text-slate-200 hover:text-white shadow-xl transition-transform active:scale-95"
                title="Switch Camera"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
