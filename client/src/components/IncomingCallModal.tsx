import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { sounds } from '../lib/soundEffects';

interface IncomingCallModalProps {
  incomingCall: {
    callerId: string;
    callerName: string;
    callerPhoto: string;
    callType: 'voice' | 'video';
  } | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCall,
  onAccept,
  onDecline
}) => {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (incomingCall) {
      // Play incoming call ringtone repeat
      sounds.playCallRingtone();
      interval = setInterval(() => {
        sounds.playCallRingtone();
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [incomingCall]);

  return (
    <AnimatePresence>
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/90 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="glass-panel p-8 sm:p-10 rounded-3xl border border-pink-500/40 shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
          >
            {/* Ambient Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

            {/* Caller Photo with Pulsing Ring */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent-pink to-accent-purple animate-ping opacity-30" />
              <img
                src={incomingCall.callerPhoto}
                alt={incomingCall.callerName}
                className="w-full h-full rounded-full object-cover border-4 border-accent-pink shadow-xl relative z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.callerName)}&background=ff70a6&color=fff`;
                }}
              />
            </div>

            <h3 className="text-2xl font-extrabold text-white tracking-tight mb-1">
              {incomingCall.callerName}
            </h3>
            <p className="text-xs text-pink-300 font-semibold uppercase tracking-wider mb-8 flex items-center justify-center gap-1.5">
              {incomingCall.callType === 'video' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>Incoming {incomingCall.callType === 'video' ? 'Video' : 'Voice'} Call...</span>
            </p>

            {/* WhatsApp Action Buttons */}
            <div className="flex items-center justify-center gap-8 relative z-10">
              {/* Decline (Red) Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={onDecline}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xl shadow-rose-600/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                  title="Decline Call"
                >
                  <PhoneOff className="w-7 h-7 fill-current" />
                </button>
                <span className="text-xs text-rose-300 font-bold">Decline</span>
              </div>

              {/* Accept (Green) Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={onAccept}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform animate-bounce"
                  title="Accept Call"
                >
                  <Phone className="w-7 h-7 fill-current" />
                </button>
                <span className="text-xs text-emerald-300 font-bold">Accept</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
