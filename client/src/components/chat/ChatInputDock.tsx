import React, { useRef } from 'react';
import {
  Smile, Eye, Paperclip, Camera, Mic, StopCircle, Send, X, CornerUpLeft, Pin
} from 'lucide-react';
import { motion, AnimatePresence } from '../motion';
import { Message } from '../../types';
import { EmojiGifPicker } from '../EmojiGifPicker';

interface ChatInputDockProps {
  inputContent: string;
  isSecretMode: boolean;
  isViewOnceMode: boolean;
  replyingTo: Message | null;
  pinnedMsg: Message | null;
  showEmojiPicker: boolean;
  isRecording: boolean;
  recordingTime: number;
  partnerName: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onInputFocus: () => void;
  onSend: (e: React.FormEvent) => void;
  onToggleEmojiPicker: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker: (url: string) => void;
  onToggleViewOnce: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelReply: () => void;
  onUnpinMessage: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

export const ChatInputDock: React.FC<ChatInputDockProps> = ({
  inputContent,
  isSecretMode,
  isViewOnceMode,
  replyingTo,
  pinnedMsg,
  showEmojiPicker,
  isRecording,
  recordingTime,
  partnerName,
  onInputChange,
  onInputKeyDown,
  onInputFocus,
  onSend,
  onToggleEmojiPicker,
  onSelectEmoji,
  onSelectSticker,
  onToggleViewOnce,
  onFileUpload,
  onStartRecording,
  onStopRecording,
  onCancelReply,
  onUnpinMessage,
  inputRef: externalInputRef
}) => {
  const localInputRef = useRef<HTMLTextAreaElement | null>(null);
  const inputRef = externalInputRef || localInputRef;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="w-full shrink-0 z-20 relative">
      {/* Hidden File Input for Media Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={onFileUpload}
        className="hidden"
      />

      {/* Pinned Message Banner */}
      {pinnedMsg && (
        <div className="px-3 py-1.5 bg-space-900/90 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden text-amber-300">
            <Pin className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-[11px] truncate">Pinned: {pinnedMsg.content}</span>
          </div>
          <button
            onClick={onUnpinMessage}
            className="text-slate-400 hover:text-white p-1"
            title="Unpin message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Replying-To Quoted Message Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-3 py-2 bg-space-900/95 border-t border-white/10 flex items-center justify-between gap-2 text-xs backdrop-blur-md"
          >
            <div className="flex items-center gap-2 min-w-0 overflow-hidden border-l-2 border-pink-500 pl-2.5">
              <CornerUpLeft className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-pink-300 font-bold truncate">Replying to message</p>
                <p className="text-slate-300 truncate text-xs">{replyingTo.content || 'Media message'}</p>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              title="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji & Sticker Picker Popover */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 sm:left-4 sm:right-auto mb-2 z-50 flex justify-center sm:block max-w-full px-2 sm:px-0"
          >
            <EmojiGifPicker
              onSelectEmoji={onSelectEmoji}
              onSelectSticker={onSelectSticker}
              onClose={onToggleEmojiPicker}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer Form Bar */}
      <form
        onSubmit={onSend}
        className="px-2 py-2 sm:px-4 sm:py-3 bg-space-950/95 backdrop-blur-2xl border-t border-white/10 flex items-end gap-1.5 sm:gap-2"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
      >
        {/* Integrated Input Capsule: Emoji + Textarea + Attach + Camera */}
        <div className="flex-1 min-w-0 flex items-end bg-space-900/90 border border-white/15 rounded-3xl p-1.5 focus-within:border-pink-400/70 focus-within:ring-1 focus-within:ring-pink-400/40 transition-all shadow-inner">
          {/* Emoji Trigger Button */}
          <button
            type="button"
            onClick={onToggleEmojiPicker}
            className="p-2 text-slate-300 hover:text-amber-300 active:scale-95 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0 rounded-full"
            title="Emoji & Stickers"
            aria-label="Toggle emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Message Input Textarea */}
          <textarea
            ref={inputRef}
            value={inputContent}
            onChange={onInputChange}
            onFocus={onInputFocus}
            onKeyDown={onInputKeyDown}
            placeholder={
              isSecretMode
                ? '🔒 Disappearing secret message...'
                : `Message ${partnerName}...`
            }
            rows={1}
            className="flex-1 min-w-0 px-2 py-1.5 bg-transparent text-white placeholder-slate-400 text-xs sm:text-sm resize-none overflow-y-auto max-h-24 leading-relaxed focus:outline-none scrollbar-none"
            style={{ touchAction: 'manipulation', WebkitUserSelect: 'text', userSelect: 'text' }}
            autoComplete="off"
            autoCorrect="on"
            spellCheck={true}
            enterKeyHint="send"
            aria-label="Type a message"
          />

          {/* View Once Toggle Button */}
          <button
            type="button"
            onClick={onToggleViewOnce}
            className={`p-1.5 rounded-full transition-all min-w-[34px] min-h-[34px] flex items-center justify-center flex-shrink-0 ${
              isViewOnceMode
                ? 'bg-rose-500 text-white font-extrabold shadow-lg shadow-rose-500/40 animate-pulse'
                : 'text-slate-400 hover:text-pink-300'
            }`}
            title="View Once Photo (Burns after 5s)"
            aria-label="Toggle view once mode"
          >
            <div className="flex items-center gap-0.5 text-xs font-black">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[9px]">1</span>
            </div>
          </button>

          {/* Attachment Clip */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="p-2 text-slate-300 hover:text-pink-300 active:scale-95 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0 rounded-full"
            title="Attach Media"
            aria-label="Attach media"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Camera Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="p-2 text-slate-300 hover:text-purple-300 active:scale-95 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0 rounded-full hidden sm:flex"
            title="Take Photo"
            aria-label="Take photo"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: Dynamic Send or Voice Note Recorder */}
        <div className="flex-shrink-0">
          {inputContent.trim().length > 0 ? (
            <button
              type="submit"
              className="w-11 h-11 rounded-full bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-bold"
              title="Send Message"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : !isRecording ? (
            <button
              type="button"
              onClick={onStartRecording}
              className="w-11 h-11 rounded-full bg-space-900 border border-white/15 text-slate-200 hover:text-purple-300 hover:border-purple-400/40 active:scale-95 transition-all flex items-center justify-center shadow-md"
              title="Record Voice Note"
              aria-label="Record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopRecording}
              className="h-11 px-3.5 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center gap-2 animate-pulse shadow-lg shadow-rose-500/40"
              title="Stop & Send Voice Note"
              aria-label="Stop recording and send voice note"
            >
              <div className="flex items-center gap-0.5 h-4">
                <span className="w-0.5 h-3 bg-white rounded-full wave-bar-active" />
                <span className="w-0.5 h-4 bg-white rounded-full wave-bar-active" />
                <span className="w-0.5 h-2 bg-white rounded-full wave-bar-active" />
                <span className="w-0.5 h-4 bg-white rounded-full wave-bar-active" />
              </div>
              <StopCircle className="w-4 h-4" />
              <span>{recordingTime}s</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
