import React, { useState } from 'react';
import { X, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { Message, UserProfile } from '../types';

interface CallHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  partnerUser: UserProfile | null;
  onStartCall: (type: 'voice' | 'video') => void;
}

export const CallHistoryModal: React.FC<CallHistoryModalProps> = ({
  isOpen,
  onClose,
  messages,
  partnerUser,
  onStartCall
}) => {
  const [filter, setFilter] = useState<'all' | 'missed'>('all');

  // Filter messages that represent calls or missed calls
  const callLogs = messages.filter(m =>
    m.content.includes('Call') || m.content.includes('Missed')
  );

  const filteredLogs = callLogs.filter(m => {
    if (filter === 'missed') return m.content.includes('Missed');
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel max-w-md w-full rounded-3xl border border-white/10 p-6 relative flex flex-col max-h-[85dvh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-white text-lg">Call Log History</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl glass-card text-slate-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4 bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'all' ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-md' : 'text-slate-400'
              }`}
            >
              All Calls ({callLogs.length})
            </button>
            <button
              onClick={() => setFilter('missed')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'missed' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md' : 'text-slate-400'
              }`}
            >
              Missed ({callLogs.filter(m => m.content.includes('Missed')).length})
            </button>
          </div>

          {/* Log List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs italic">
                No {filter === 'missed' ? 'missed' : ''} call history logged yet
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isMissed = log.content.includes('Missed');
                const isVideo = log.content.includes('Video');

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl glass-card border border-white/10 hover:border-pink-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl flex items-center justify-center ${
                        isMissed ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {isMissed ? (
                          <PhoneMissed className="w-5 h-5" />
                        ) : isVideo ? (
                          <Video className="w-5 h-5" />
                        ) : (
                          <Phone className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <p className={`font-bold text-xs ${isMissed ? 'text-rose-300' : 'text-white'}`}>
                          {log.content}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartCall(isVideo ? 'video' : 'voice')}
                      className="p-2.5 rounded-xl glass-card hover:border-emerald-400/50 text-emerald-400 hover:text-emerald-300 transition-colors"
                      title="Call Back"
                    >
                      {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs mt-4"
          >
            Close History
          </button>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
