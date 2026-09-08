import React from 'react';
import { ChevronLeft, Phone, Video, Lock, Search, MoreVertical, User, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from '../motion';
import { formatLastSeen } from '../../context/AuthContext';
import { UserProfile, Chat } from '../../types';

interface ChatHeaderProps {
  chatTitle: string;
  chatAvatar: string;
  chatSubtitle: string;
  isGroup: boolean;
  partnerUser: UserProfile | null;
  isPartnerTyping: boolean;
  isSecretMode: boolean;
  showSearch: boolean;
  showMoreMenu: boolean;
  onBackToSidebar: () => void;
  onOpenPartnerProfile?: () => void;
  onBackToHome?: () => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onToggleSecretMode: () => void;
  onToggleSearch: () => void;
  onToggleMoreMenu: () => void;
  onCloseMoreMenu: () => void;
  onExportChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatTitle,
  chatAvatar,
  chatSubtitle,
  isGroup,
  partnerUser,
  isPartnerTyping,
  isSecretMode,
  showSearch,
  showMoreMenu,
  onBackToSidebar,
  onOpenPartnerProfile,
  onBackToHome,
  onStartCall,
  onToggleSecretMode,
  onToggleSearch,
  onToggleMoreMenu,
  onCloseMoreMenu,
  onExportChat
}) => {
  return (
    <div
      className="w-full shrink-0 z-30 bg-space-900/98 backdrop-blur-2xl border-b border-white/10 shadow-md flex items-center justify-between px-2.5 xs:px-3 sm:px-5 py-2 xs:py-2.5 gap-2"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }}
    >
      {/* HeaderLeft: Back Button (mobile) + Chat Info */}
      <div className="flex-1 min-w-0 flex items-center gap-2 xs:gap-2.5 overflow-hidden">
        {/* Back to Conversations Button (Mobile Only) */}
        <button
          onClick={onBackToSidebar}
          className="w-[38px] h-[38px] min-w-[38px] max-w-[38px] rounded-2xl glass-card text-pink-300 hover:text-white md:hidden shrink-0 flex items-center justify-center active:scale-90 transition-all border border-pink-500/25 shadow-sm"
          title="All Conversations"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="w-5 h-5 text-pink-400" />
        </button>

        {/* Chat Info (Avatar + Title + Subtitle) */}
        <div
          onClick={() => { if (!isGroup && onOpenPartnerProfile) onOpenPartnerProfile(); }}
          className={`flex-1 min-w-0 flex items-center gap-2 xs:gap-2.5 overflow-hidden ${
            !isGroup && onOpenPartnerProfile ? 'cursor-pointer active:scale-98 transition-transform' : ''
          }`}
          title={!isGroup ? 'View Profile' : undefined}
        >
          {/* Avatar */}
          <div className="w-[38px] h-[38px] min-w-[38px] max-w-[38px] relative shrink-0">
            <img
              src={chatAvatar}
              alt={chatTitle}
              className="w-full h-full rounded-full object-cover border-2 border-accent-pink shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatTitle)}&background=a855f7&color=fff`;
              }}
            />
            {!isGroup && (
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-space-950 rounded-full ${
                partnerUser?.online ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            )}
          </div>

          {/* Title & Status */}
          <div className="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
            <h3 className="font-bold text-xs xs:text-sm text-white flex items-center gap-1.5 truncate leading-tight">
              <span className="truncate">{chatTitle}</span>
              {isGroup && (
                <span className="text-[8px] xs:text-[9px] px-1 py-0.2 bg-cyan-500/20 text-cyan-300 font-bold rounded-md shrink-0">
                  Group
                </span>
              )}
            </h3>
            {isPartnerTyping ? (
              <p className="text-[8.5px] xs:text-[9.5px] sm:text-[10px] text-pink-300 font-bold flex items-center gap-1 animate-pulse truncate leading-tight mt-0.5">
                <span className="flex gap-0.5 items-center shrink-0">
                  <span className="w-1 h-1 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span>Typing...</span>
              </p>
            ) : (
              <p className={`text-[8.5px] xs:text-[9.5px] sm:text-[10px] font-medium flex items-center gap-1 truncate leading-tight mt-0.5 ${
                partnerUser?.online && !isGroup ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                {!isGroup && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    partnerUser?.online ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`} />
                )}
                <span className="truncate">{isGroup ? chatSubtitle : formatLastSeen(partnerUser?.lastSeen, partnerUser?.online)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* HeaderActions: Compact 38x38px Action Buttons */}
      <div className="flex items-center gap-1.5 xs:gap-2 shrink-0">
        {/* Voice Call Button */}
        {!isGroup && (
          <button
            onClick={() => onStartCall('voice')}
            title="Start Voice Call"
            className="w-[38px] h-[38px] min-w-[38px] max-w-[38px] rounded-2xl glass-card text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/40 transition-all shrink-0 flex items-center justify-center active:scale-90 border border-emerald-500/25 shadow-sm"
          >
            <Phone className="w-4 h-4 xs:w-4.5 xs:h-4.5" />
          </button>
        )}

        {/* Video Call Button */}
        {!isGroup && (
          <button
            onClick={() => onStartCall('video')}
            title="Start Video Call"
            className="w-[38px] h-[38px] min-w-[38px] max-w-[38px] rounded-2xl glass-card text-pink-300 hover:text-pink-200 hover:border-pink-500/40 transition-all shrink-0 flex items-center justify-center active:scale-90 border border-pink-500/25 shadow-sm"
          >
            <Video className="w-4 h-4 xs:w-4.5 xs:h-4.5" />
          </button>
        )}

        {/* Desktop-Only Secret Mode Button */}
        <button
          onClick={onToggleSecretMode}
          className={`h-[38px] px-3 rounded-2xl text-xs font-semibold items-center gap-1.5 transition-all shrink-0 hidden md:flex ${
            isSecretMode
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse'
              : 'glass-card text-slate-300 hover:text-white'
          }`}
          title="Disappearing secret messages"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{isSecretMode ? 'Secret ON' : 'Secret'}</span>
        </button>

        {/* Desktop-Only Search Button */}
        <button
          onClick={onToggleSearch}
          className="w-[38px] h-[38px] min-w-[38px] max-w-[38px] rounded-2xl glass-card text-slate-300 hover:text-white shrink-0 items-center justify-center hidden md:flex active:scale-90 transition-all"
          title="Search in chat"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* More Options (3 Dots) Menu Button */}
        <div className="relative shrink-0">
          <button
            onClick={onToggleMoreMenu}
            className="w-[38px] h-[38px] min-w-[38px] max-w-[38px] rounded-2xl glass-card text-slate-300 hover:text-white shrink-0 flex items-center justify-center active:scale-90 transition-all border border-white/15 shadow-sm"
            title="More options"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4 xs:w-4.5 xs:h-4.5" />
          </button>

          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-12 z-50 w-52 rounded-2xl glass-panel-glow border border-pink-500/30 p-2 shadow-2xl space-y-1"
              >
                {/* View Profile */}
                {!isGroup && onOpenPartnerProfile && (
                  <button
                    onClick={() => {
                      onCloseMoreMenu();
                      onOpenPartnerProfile();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 font-semibold"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    <span>View Contact Info</span>
                  </button>
                )}

                {/* Mobile Video Call item */}
                {!isGroup && (
                  <button
                    onClick={() => {
                      onCloseMoreMenu();
                      onStartCall('video');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-pink-300 hover:text-pink-200 hover:bg-pink-500/15 flex items-center gap-2.5 font-semibold md:hidden"
                  >
                    <Video className="w-4 h-4 text-pink-400" />
                    <span>Start Video Call</span>
                  </button>
                )}

                {/* Mobile Search item */}
                <button
                  onClick={() => {
                    onCloseMoreMenu();
                    onToggleSearch();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 font-semibold md:hidden"
                >
                  <Search className="w-4 h-4 text-purple-400" />
                  <span>Search Messages</span>
                </button>

                {/* Secret Mode toggle */}
                <button
                  onClick={() => {
                    onCloseMoreMenu();
                    onToggleSecretMode();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 font-semibold"
                >
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>{isSecretMode ? 'Turn Off Secret Mode' : 'Secret Burn Mode'}</span>
                </button>

                {/* Export Chat */}
                <button
                  onClick={() => {
                    onCloseMoreMenu();
                    onExportChat();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/10 flex items-center gap-2.5 font-semibold"
                >
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Export Chat History</span>
                </button>

                {/* Return to Dashboard for mobile */}
                {onBackToHome && (
                  <button
                    onClick={() => {
                      onCloseMoreMenu();
                      onBackToHome();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-pink-300 hover:text-white hover:bg-pink-500/15 flex items-center gap-2.5 font-semibold md:hidden border-t border-white/10 mt-1"
                  >
                    <ArrowLeft className="w-4 h-4 text-pink-400" />
                    <span>Back to Dashboard</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop-Only Return to Home Arrow Button */}
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            title="Return to Home Dashboard"
            aria-label="Back to Home"
            className="w-[38px] h-[38px] min-w-[38px] max-w-[38px] rounded-2xl glass-card border border-pink-500/40 text-pink-300 hover:text-white hover:bg-pink-500/20 active:scale-90 transition-all items-center justify-center shadow-md shadow-pink-500/10 shrink-0 hidden md:flex"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
