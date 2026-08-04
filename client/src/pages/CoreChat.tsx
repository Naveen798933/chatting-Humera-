import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { Message } from '../types';
import { EmojiGifPicker } from '../components/EmojiGifPicker';
import { 
  Send, Image, Mic, Flame, Heart, Smile, Lock, 
  Trash2, Star, Search, CornerUpLeft, Clock, 
  CheckCheck, ShieldAlert, Sparkles, X, StopCircle, MapPin, User, Forward, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

export const CoreChat: React.FC = () => {
  const { currentUser, partnerUser } = useAuth();
  const { messages, sendMessage, deleteMessage, toggleStarMessage, addReaction, isPartnerTyping, setTypingStatus } = useUniverse();

  const [inputContent, setInputContent] = useState('');
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [secretTimeout, setSecretTimeout] = useState<number>(60);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isPartnerTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingStatus(false);
    };
  }, [setTypingStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputContent(text);

    if (text.trim().length > 0) {
      setTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(false);
      }, 2500);
    } else {
      setTypingStatus(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    setTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    sendMessage(
      inputContent.trim(),
      'text',
      undefined,
      replyingTo?.id,
      isSecretMode,
      secretTimeout
    );

    setInputContent('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleSendLocation = () => {
    sendMessage(
      `📍 Shared live location: ${currentUser?.city}`,
      'location',
      undefined,
      replyingTo?.id,
      isSecretMode,
      secretTimeout
    );
  };

  const handleSendContact = () => {
    sendMessage(
      `👤 Shared Contact: ${currentUser?.realName} (${currentUser?.petName})`,
      'contact',
      undefined,
      replyingTo?.id,
      isSecretMode,
      secretTimeout
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video');
      const reader = new FileReader();
      reader.onload = () => {
        const mediaUrl = reader.result as string;
        sendMessage(
          `Shared ${isVideo ? 'a video' : 'an image'}`,
          isVideo ? 'video' : 'image',
          mediaUrl,
          replyingTo?.id,
          isSecretMode,
          secretTimeout
        );
        setReplyingTo(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    sendMessage(
      `Voice note (${recordingTime}s)`,
      'audio',
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      replyingTo?.id,
      isSecretMode,
      secretTimeout
    );
  };

  const handleForwardConfirm = () => {
    if (forwardingMsg) {
      sendMessage(
        `Forwarded: ${forwardingMsg.content}`,
        forwardingMsg.type,
        forwardingMsg.mediaUrl
      );
      setForwardingMsg(null);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (!searchQuery.trim()) return true;
    return m.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto h-[calc(100dvh-130px)] sm:h-[82vh] flex flex-col glass-panel rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
      <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between bg-space-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={partnerUser?.photoURL}
              alt={partnerUser?.realName}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-accent-pink shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-space-950 rounded-full" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1 truncate">
              <span className="truncate">{partnerUser?.petName}</span>
              <span className="text-[10px] text-pink-300 font-normal hidden xs:inline">({partnerUser?.realName})</span>
            </h3>
            <p className="text-[9px] sm:text-[10px] text-emerald-400 font-medium flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              <span className="truncate">Online in Universe</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setIsSecretMode(!isSecretMode)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all ${
              isSecretMode
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse'
                : 'glass-card text-slate-300 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isSecretMode ? 'Secret Mode' : 'Secret'}</span>
          </button>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-xl glass-card text-slate-300 hover:text-white"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSecretMode && (
          <motion.div className="bg-rose-950/80 border-b border-rose-500/30 px-6 py-2 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400 animate-spin" />
              <span>Disappearing Messages Active</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-rose-300">Burn Timer:</label>
              <select
                value={secretTimeout}
                onChange={(e) => setSecretTimeout(Number(e.target.value))}
                className="bg-space-900 border border-rose-500/40 rounded-lg px-2 py-1 text-xs text-white"
              >
                <option value={30}>30 Seconds</option>
                <option value={60}>1 Minute</option>
                <option value={600}>10 Minutes</option>
                <option value={3600}>1 Hour</option>
                <option value={86400}>24 Hours</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSearch && (
        <div className="p-3 bg-space-900/90 border-b border-white/10 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat history..."
            className="flex-1 bg-transparent text-xs text-white focus:outline-none"
          />
          <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="p-1 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {filteredMessages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser?.uid;
          const showDateSep = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(filteredMessages[idx - 1].createdAt).toDateString();

          return (
            <React.Fragment key={msg.id}>
              {showDateSep && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 rounded-full glass-card text-[10px] font-semibold text-slate-400 border border-white/5">
                    {new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}

              <motion.div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                {msg.replyTo && (
                  <div className="text-[10px] text-slate-300 mb-1 px-3 py-1 rounded-lg bg-white/5 border-l-2 border-accent-pink max-w-xs truncate">
                    Replying to: "{msg.replyTo.excerpt}"
                  </div>
                )}

                <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                  {!isMe && (
                    <img
                      src={partnerUser?.photoURL}
                      alt={partnerUser?.realName}
                      className="w-7 h-7 rounded-full object-cover mb-1 border border-pink-400/40"
                    />
                  )}

                  <div
                    className={`p-3.5 rounded-2xl relative shadow-lg ${
                      isMe
                        ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-br-none'
                        : 'glass-panel text-slate-100 rounded-bl-none border border-white/10'
                    } ${msg.isSecret ? 'border-2 border-dashed border-rose-400/60' : ''}`}
                  >
                    {msg.isSecret && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-rose-300 mb-1">
                        <Lock className="w-3 h-3" />
                        <span>Secret Message (Self-Destructing)</span>
                      </div>
                    )}

                    {msg.type === 'image' && msg.mediaUrl && (
                      <img
                        src={msg.mediaUrl}
                        alt="Shared image"
                        className="w-full max-h-64 object-cover rounded-xl mb-2 border border-white/10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"><rect fill="%230b071a" width="200" height="120"/><text fill="%23a855f7" font-size="12" x="50%" y="55%" text-anchor="middle">📷 Image unavailable</text></svg>';
                        }}
                      />
                    )}

                    {msg.type === 'video' && msg.mediaUrl && (
                      <video
                        src={msg.mediaUrl}
                        controls
                        className="w-full max-h-64 rounded-xl mb-2 border border-white/10"
                      />
                    )}

                    {msg.type === 'audio' && msg.mediaUrl && (
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-space-950/50">
                        <audio src={msg.mediaUrl} controls className="h-8 w-48" />
                      </div>
                    )}

                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[9px] opacity-75">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-pink-200" />}
                      {msg.isStarred && <Star className="w-3 h-3 text-amber-300 fill-current" />}
                    </div>

                    {Object.keys(msg.reactions).length > 0 && (
                      <div className="absolute -bottom-3 right-2 flex items-center gap-1 bg-space-950 border border-white/10 px-2 py-0.5 rounded-full shadow-md text-xs">
                        {Object.entries(msg.reactions).map(([emoji, uids]) => (
                          <span key={emoji}>{emoji} {uids.length > 1 ? uids.length : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="hidden group-hover:flex items-center gap-1 opacity-80 hover:opacity-100">
                    <button onClick={() => addReaction(msg.id, '❤️')} className="p-1 hover:bg-white/10 rounded">❤️</button>
                    <button onClick={() => addReaction(msg.id, '🔥')} className="p-1 hover:bg-white/10 rounded">🔥</button>
                    <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-white/10 rounded text-slate-300" title="Reply">
                      <CornerUpLeft className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setForwardingMsg(msg)} className="p-1 hover:bg-white/10 rounded text-slate-300" title="Forward">
                      <Forward className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleStarMessage(msg.id)} className="p-1 hover:bg-white/10 rounded text-slate-300" title="Star">
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteMessage(msg.id, true)} className="p-1 hover:bg-white/10 rounded text-rose-400" title="Delete for Everyone">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-xs text-pink-300 italic mb-2 animate-pulse px-2">
            <img
              src={partnerUser?.photoURL}
              alt={partnerUser?.realName}
              className="w-5 h-5 rounded-full object-cover border border-pink-400/40"
            />
            <span>{partnerUser?.petName || partnerUser?.realName} is typing</span>
            <span className="inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
        <div className="bg-space-900/90 px-6 py-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <CornerUpLeft className="w-4 h-4 text-accent-pink" />
            <span>Replying: "{replyingTo.content.substring(0, 40)}..."</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popup Overlay */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-6 z-50">
          <EmojiGifPicker
            onSelectEmoji={(emoji) => {
              setInputContent(prev => prev + emoji);
            }}
            onSelectSticker={(url) => {
              sendMessage('Sticker', 'image', url);
              setShowEmojiPicker(false);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Forward Modal */}
      {forwardingMsg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-panel-glow p-6 rounded-3xl max-w-xs w-full text-center space-y-4">
            <Forward className="w-8 h-8 text-pink-300 mx-auto" />
            <h4 className="font-bold text-sm text-white">Forward Message?</h4>
            <p className="text-xs text-slate-300 italic">"{forwardingMsg.content}"</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setForwardingMsg(null)} className="flex-1 py-2 rounded-xl glass-card text-xs">Cancel</button>
              <button onClick={handleForwardConfirm} className="flex-1 py-2 rounded-xl bg-accent-pink text-white text-xs font-bold">Forward</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="p-2.5 sm:p-4 bg-space-900/90 border-t border-white/10 flex items-center gap-1.5 sm:gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 sm:p-2.5 rounded-xl glass-card text-slate-300 hover:text-pink-300 transition-colors flex-shrink-0"
          title="Attach Image/Video"
        >
          <Image className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 sm:p-2.5 rounded-xl glass-card text-slate-300 hover:text-amber-300 transition-colors flex-shrink-0"
          title="Emoji & Stickers"
        >
          <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={handleSendLocation}
          className="p-2 sm:p-2.5 rounded-xl glass-card text-slate-300 hover:text-emerald-300 transition-colors hidden sm:block flex-shrink-0"
          title="Share Location"
        >
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={handleSendContact}
          className="p-2 sm:p-2.5 rounded-xl glass-card text-slate-300 hover:text-cyan-300 transition-colors hidden sm:block flex-shrink-0"
          title="Share Contact Card"
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {!isRecording ? (
          <button
            type="button"
            onClick={() => setIsRecording(true)}
            className="p-2 sm:p-2.5 rounded-xl glass-card text-slate-300 hover:text-purple-300 transition-colors flex-shrink-0"
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopRecording}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-rose-500 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1.5 animate-pulse flex-shrink-0"
          >
            <StopCircle className="w-4 h-4" />
            <span>{recordingTime}s</span>
          </button>
        )}

        <input
          type="text"
          value={inputContent}
          onChange={handleInputChange}
          placeholder={isSecretMode ? "Disappearing secret msg..." : "Type a message..."}
          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl glass-input text-xs sm:text-sm"
        />

        <button
          type="submit"
          className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
