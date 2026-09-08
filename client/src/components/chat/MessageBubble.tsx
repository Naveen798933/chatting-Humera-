import React, { useState, useRef } from 'react';
import {
  Lock, Flame, Star, Check, CheckCheck, CornerUpLeft, Edit3, Trash2, Pin, Phone, Forward
} from 'lucide-react';
import { motion, AnimatePresence } from '../motion';
import { Message, UserProfile } from '../../types';
import { VoiceNotePlayer } from '../VoiceNotePlayer';

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😍', '👏', '💋'];

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  partnerUser: UserProfile | null;
  activeReactionMsgId: string | null;
  pinnedMsgId?: string | null;
  onBubbleClick: (msg: Message) => void;
  onAddReaction: (msgId: string, emoji: string) => void;
  onReply: (msg: Message) => void;
  onPin: (msg: Message) => void;
  onStartEdit: (msg: Message) => void;
  onForward: (msg: Message) => void;
  onDelete: (msgId: string) => void;
  onOpenLightbox: (url: string) => void;
  onOpenViewOnce: (id: string, url: string) => void;
  onStartCall: (type: 'voice' | 'video') => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isMe,
  partnerUser,
  activeReactionMsgId,
  pinnedMsgId,
  onBubbleClick,
  onAddReaction,
  onReply,
  onPin,
  onStartEdit,
  onForward,
  onDelete,
  onOpenLightbox,
  onOpenViewOnce,
  onStartCall
}) => {
  // Mobile touch swipe-to-reply gesture
  const touchStartXRef = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.touches[0].clientX - touchStartXRef.current;
    if (diff > 0 && diff < 80) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 40) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(25); } catch (_) {}
      }
      onReply(msg);
    }
    touchStartXRef.current = null;
    setSwipeOffset(0);
  };

  return (
    <div
      className={`flex items-end gap-2 max-w-[90%] sm:max-w-[75%] relative transition-transform duration-100 ${
        isMe ? 'flex-row-reverse' : 'flex-row'
      }`}
      style={{ transform: `translateX(${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe Reply Icon Indicator (visible while dragging right) */}
      {swipeOffset > 15 && (
        <div
          className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs shadow-md transition-opacity"
          style={{ opacity: Math.min(1, swipeOffset / 40) }}
        >
          <CornerUpLeft className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Partner Avatar for Incoming Messages */}
      {!isMe && (
        <img
          src={partnerUser?.photoURL}
          alt={partnerUser?.displayName || partnerUser?.realName || 'Partner'}
          className="w-7 h-7 rounded-full object-cover mb-1 border border-pink-400/40 flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Partner&background=a855f7&color=fff`;
          }}
        />
      )}

      <div className="flex flex-col gap-1 min-w-0 max-w-full">
        {/* Message Bubble Card */}
        <div
          className={`p-3 sm:p-3.5 rounded-2xl relative shadow-lg cursor-pointer transition-all active:scale-[0.98] animate-bubble-pop select-none ${
            isMe
              ? 'chat-bubble-sender rounded-tr-sm'
              : 'chat-bubble-receiver rounded-tl-sm'
          } ${msg.isSecret ? 'border-2 border-dashed border-rose-400/80 shadow-rose-500/20' : ''}`}
          onClick={() => onBubbleClick(msg)}
        >
          {/* Disappearing Secret Mode Badge */}
          {msg.isSecret && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-rose-300 mb-1.5">
              <Lock className="w-3 h-3" />
              <span>Self-Destructing Secret</span>
            </div>
          )}

          {/* View Once Photo */}
          {msg.isViewOnce && msg.mediaUrl ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenViewOnce(msg.id, msg.mediaUrl!);
              }}
              className="p-3 rounded-2xl bg-black/40 border border-rose-500/40 text-rose-200 flex items-center gap-3 cursor-pointer hover:bg-black/60 transition-all my-1 active:scale-95 shadow-md"
            >
              <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                1
              </div>
              <div>
                <p className="font-extrabold text-xs text-white flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>View Once Photo</span>
                </p>
                <p className="text-[10px] text-rose-300">Tap to view (Burns after 5s)</p>
              </div>
            </div>
          ) : msg.type === 'image' && msg.mediaUrl ? (
            <img
              src={msg.mediaUrl}
              alt="Shared photo"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(msg.mediaUrl!);
              }}
              className="w-full max-h-56 object-cover rounded-xl mb-2 border border-white/10 cursor-zoom-in hover:opacity-95 transition-opacity"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}

          {/* Video Attachment */}
          {msg.type === 'video' && msg.mediaUrl && (
            <video src={msg.mediaUrl} controls className="w-full max-h-56 rounded-xl mb-2 border border-white/10" />
          )}

          {/* Voice Note Player */}
          {msg.type === 'audio' && msg.mediaUrl && (
            <div className="my-1">
              <VoiceNotePlayer src={msg.mediaUrl} isMe={isMe} />
            </div>
          )}

          {/* Missed Call Notice */}
          {msg.content.includes('Missed') && msg.content.includes('Call') ? (
            <div className="flex items-center justify-between gap-3 p-1 text-rose-200">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-400 animate-bounce" />
                <span className="font-bold text-xs">{msg.content}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartCall(msg.content.includes('Video') ? 'video' : 'voice');
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-[10px] font-extrabold text-white border border-rose-400/40 transition-colors"
              >
                Call Back
              </button>
            </div>
          ) : (
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          )}

          {/* Timestamp & Read Receipts */}
          <div className={`flex items-center gap-1.5 mt-1.5 text-[9px] opacity-70 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {msg.isEdited && <span className="italic">(edited)</span>}
            {isMe && (
              msg.seen ? (
                <span className="flex items-center text-cyan-300 font-bold gap-0.5 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" title="Seen">
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                </span>
              ) : msg.delivered ? (
                <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-slate-300" /></span>
              ) : (
                <span title="Sent"><Check className="w-3.5 h-3.5 text-slate-400" /></span>
              )
            )}
            {msg.isStarred && <Star className="w-3 h-3 text-amber-300 fill-current" />}
          </div>

          {/* Reactions Pill */}
          {Object.keys(msg.reactions || {}).length > 0 && (
            <div className="absolute -bottom-3 right-2 flex items-center gap-0.5 bg-space-950 border border-white/10 px-1.5 py-0.5 rounded-full shadow-md text-xs">
              {Object.entries(msg.reactions || {}).map(([emoji, uids]) => (
                <span key={emoji}>{emoji}{uids.length > 1 ? <sup className="text-[8px]">{uids.length}</sup> : ''}</span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Reaction & Action Popover Menu */}
        <AnimatePresence>
          {activeReactionMsgId === msg.id && (
            <motion.div
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className={`flex items-center gap-1 bg-space-900/95 border border-white/10 rounded-2xl px-2 py-1.5 shadow-xl backdrop-blur-md flex-wrap max-w-[min(280px,82vw)] overflow-hidden ${
                isMe ? 'self-end' : 'self-start'
              }`}
            >
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddReaction(msg.id, emoji);
                  }}
                  className="text-base hover:scale-125 transition-transform active:scale-95 p-1 min-w-[34px] min-h-[34px] flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(msg);
                }}
                className="p-1.5 text-slate-300 hover:text-amber-300 min-w-[34px] min-h-[34px] flex items-center justify-center"
                title={pinnedMsgId === msg.id ? 'Unpin' : 'Pin'}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(msg);
                }}
                className="p-1.5 text-slate-300 hover:text-pink-300 min-w-[34px] min-h-[34px] flex items-center justify-center"
                title="Reply"
              >
                <CornerUpLeft className="w-4 h-4" />
              </button>
              {isMe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(msg);
                  }}
                  className="p-1.5 text-slate-300 hover:text-sky-300 min-w-[34px] min-h-[34px] flex items-center justify-center"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onForward(msg);
                }}
                className="p-1.5 text-slate-300 hover:text-indigo-300 min-w-[34px] min-h-[34px] flex items-center justify-center"
                title="Forward"
              >
                <Forward className="w-4 h-4" />
              </button>
              {isMe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(msg.id);
                  }}
                  className="p-1.5 text-slate-300 hover:text-rose-400 min-w-[34px] min-h-[34px] flex items-center justify-center"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
