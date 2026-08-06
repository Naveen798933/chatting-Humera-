import React, { useState, useRef, useEffect } from 'react';
import { useAuth, formatLastSeen } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { useScreenSize } from '../hooks/useScreenSize';
import { sounds } from '../lib/soundEffects';
import { toast } from '../lib/toast';
import { Message } from '../types';
import { EmojiGifPicker } from '../components/EmojiGifPicker';
import { VoiceNotePlayer } from '../components/VoiceNotePlayer';
import {
  Send, Image, Mic, Smile, Lock, Pin, ShieldAlert, Phone, Video,
  Trash2, Star, Search, CornerUpLeft, Clock,
  CheckCheck, Sparkles, X, StopCircle, MapPin, User, Forward, Edit3, Check, MessageCircle, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😍', '👏', '💋'];

export const CoreChat: React.FC = () => {
  const { currentUser, partnerUser, toggleDecoyMode } = useAuth();
  const {
    messages, sendMessage, deleteMessage, editMessage, markMessagesAsSeen,
    toggleStarMessage, addReaction, isPartnerTyping, setTypingStatus, startCall
  } = useUniverse();

  const [inputContent, setInputContent] = useState('');
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [secretTimeout, setSecretTimeout] = useState<number>(60);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [pinnedMsg, setPinnedMsg] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { isMobile } = useScreenSize();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real microphone audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBubbleClick = (msg: Message) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      // Double tap -> React with ❤️
      addReaction(msg.id, '❤️');
      sounds.playKissSound();
      toast.love('Reacted with ❤️');
      setActiveReactionMsgId(null);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        // Single tap -> Toggle quick action bar
        setActiveReactionMsgId(prev => prev === msg.id ? null : msg.id);
      }, 220);
    }
  };

  const scrollToBottom = (instant = false) => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: instant ? 'auto' : 'smooth'
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    }
  };

  // Instant scroll to latest messages on mount & load
  useEffect(() => {
    scrollToBottom(true);
    const t1 = setTimeout(() => scrollToBottom(true), 60);
    const t2 = setTimeout(() => scrollToBottom(true), 250);
    markMessagesAsSeen();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Smooth scroll on new message or partner typing
  useEffect(() => {
    scrollToBottom(false);
    markMessagesAsSeen();
  }, [messages.length, isPartnerTyping]);

  // Panic Hotkey Listener (Esc + L -> Stealth Decoy)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'L' || e.key === 'l') && e.altKey) {
        toast.info('Panic mode activated!');
        toggleDecoyMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDecoyMode]);

  useEffect(() => {
    if (editingMsg) {
      editInputRef.current?.focus();
    }
  }, [editingMsg]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputContent(text);
    if (text.trim().length > 0) {
      setTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingStatus(false), 2500);
    } else {
      setTypingStatus(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
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
    sendMessage(inputContent.trim(), 'text', undefined, replyingTo?.id, isSecretMode, secretTimeout);
    setInputContent('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMsg || !editContent.trim()) return;
    await editMessage(editingMsg.id, editContent.trim());
    toast.success('Message updated ✏️');
    setEditingMsg(null);
    setEditContent('');
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMsg(msg);
    setEditContent(msg.content);
    setActiveReactionMsgId(null);
  };

  const handleDelete = async (msg: Message) => {
    await deleteMessage(msg.id, true);
    toast.info('Message deleted');
    setActiveReactionMsgId(null);
  };

  const handleSendLocation = () => {
    sendMessage(`📍 Shared live location: ${currentUser?.city}`, 'location', undefined, replyingTo?.id, isSecretMode, secretTimeout);
    toast.success('Location shared!');
  };

  const handleSendContact = () => {
    sendMessage(`👤 Shared Contact: ${currentUser?.realName} (${currentUser?.petName})`, 'contact', undefined, replyingTo?.id, isSecretMode, secretTimeout);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large! Max 5MB');
      return;
    }
    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = () => {
      const mediaUrl = reader.result as string;
      sendMessage(`Shared ${isVideo ? 'a video' : 'an image'}`, isVideo ? 'video' : 'image', mediaUrl, replyingTo?.id, isSecretMode, secretTimeout);
      setReplyingTo(null);
      toast.love(`${isVideo ? 'Video' : 'Image'} sent! 💕`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Voice recording is not supported on this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendMessage(
            `🎙️ Voice note`,
            'audio',
            base64Audio,
            replyingTo?.id,
            isSecretMode,
            secretTimeout
          );
          toast.love('Voice note sent 🎙️');
        };
        reader.readAsDataURL(audioBlob);

        // Stop all stream tracks to release microphone
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start(100);
      setIsRecording(true);
      toast.info('Recording... Speak into microphone 🎙️');
    } catch (err: any) {
      console.error('Microphone recording error:', err);
      toast.error('Could not access microphone! Please allow mic permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleForwardConfirm = () => {
    if (forwardingMsg) {
      sendMessage(`Forwarded: ${forwardingMsg.content}`, forwardingMsg.type, forwardingMsg.mediaUrl);
      setForwardingMsg(null);
      toast.success('Message forwarded!');
    }
  };

  const filteredMessages = messages.filter(m => {
    if (!searchQuery.trim()) return true;
    return m.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={`max-w-4xl mx-auto flex flex-col glass-panel rounded-xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative ${
      isMobile ? 'h-[calc(100dvh-220px)]' : 'h-[82vh]'
    }`}>
      {/* Chat Header */}
      <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between bg-space-900/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={partnerUser?.photoURL}
              alt={partnerUser?.realName}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-accent-pink shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser?.realName || 'Partner')}&background=a855f7&color=fff`;
              }}
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-space-950 rounded-full" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{partnerUser?.petName}</span>
              <span className="text-[10px] text-pink-300/70 font-normal hidden sm:inline">({partnerUser?.realName})</span>
            </h3>
            {isPartnerTyping ? (
              <p className="text-[9px] sm:text-[10px] text-pink-300 font-bold flex items-center gap-1.5 animate-pulse">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span>{partnerUser?.petName || 'Partner'} is typing...</span>
              </p>
            ) : (
              <p className={`text-[9px] sm:text-[10px] font-medium flex items-center gap-1 ${
                partnerUser?.online ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  partnerUser?.online ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`} />
                <span>{formatLastSeen(partnerUser?.lastSeen, partnerUser?.online)}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Quick Voice Call Button */}
          <button
            onClick={() => { startCall('voice'); toast.love('Starting Voice Call... 📞'); }}
            title="Start Voice Call"
            className="p-2 rounded-xl glass-card text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/40 transition-colors"
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Quick Video Call Button */}
          <button
            onClick={() => { startCall('video'); toast.love('Starting Video Call... 📹'); }}
            title="Start Video Call"
            className="p-2 rounded-xl glass-card text-pink-300 hover:text-pink-200 hover:border-pink-500/40 transition-colors"
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsSecretMode(!isSecretMode)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all ${
              isSecretMode
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse'
                : 'glass-card text-slate-300 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">{isSecretMode ? 'Secret ON' : 'Secret'}</span>
          </button>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-xl glass-card text-slate-300 hover:text-white"
            title="Search in chat"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* More Options (3 Dots) Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-xl glass-card text-slate-300 hover:text-white"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-11 z-50 w-44 sm:w-48 rounded-2xl glass-panel-glow border border-pink-500/30 p-2 shadow-2xl space-y-1"
                >
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      const exportTxt = messages.map(m => {
                        const author = m.senderId === currentUser?.uid ? currentUser?.petName : partnerUser?.petName;
                        const time = new Date(m.createdAt).toLocaleString();
                        return `[${time}] ${author}: ${m.content}`;
                      }).join('\n\n');
                      const blob = new Blob([`OUR UNIVERSE CHAT TRANSCRIPT — NAVEEN & HUMERA\n\n${exportTxt}`], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `OurUniverse_Chat_${new Date().toISOString().split('T')[0]}.txt`;
                      a.click();
                      toast.love('Chat exported as TXT transcript! 📄');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <span>📄</span> Export Chat TXT
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setIsSecretMode(!isSecretMode);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <span>🔒</span> {isSecretMode ? 'Turn Off Secret Mode' : 'Secret Mode (Burn Timer)'}
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      toggleDecoyMode();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-500/20 flex items-center gap-2"
                  >
                    <span>🛡️</span> Panic Disguise Mode
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Secret Mode Banner */}
      <AnimatePresence>
        {isSecretMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-950/90 border-b border-rose-500/40 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-rose-200 flex-shrink-0"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-400 animate-spin" />
              <span className="font-bold text-rose-300">Disappearing Messages Active</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] uppercase font-bold text-rose-300 hidden sm:inline">Burn Timer:</label>
                <select
                  value={secretTimeout}
                  onChange={(e) => setSecretTimeout(Number(e.target.value))}
                  className="bg-space-900 border border-rose-500/40 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value={30}>30s</option>
                  <option value={60}>1 min</option>
                  <option value={600}>10 min</option>
                  <option value={3600}>1 hr</option>
                  <option value={86400}>24 hrs</option>
                </select>
              </div>

              {/* Explicit Turn Off Button */}
              <button
                onClick={() => {
                  setIsSecretMode(false);
                  toast.info('Disappearing messages turned off');
                }}
                className="px-2 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Turn off secret mode"
              >
                <X className="w-3.5 h-3.5" />
                <span>Turn Off</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned Message Banner */}
      <AnimatePresence>
        {pinnedMsg && (
          <motion.div className="bg-amber-950/70 border-b border-amber-500/30 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-200 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-300 shrink-0">Pinned:</span>
              <span className="truncate">{pinnedMsg.content}</span>
            </div>
            <button onClick={() => setPinnedMsg(null)} className="text-amber-400 hover:text-white ml-2 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 bg-space-900/90 border-b border-white/10 flex items-center gap-2 flex-shrink-0">
          <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-xs text-white focus:outline-none"
            autoFocus
          />
          <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="p-1 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3" id="chat-messages">

        {/* Empty state */}
        {filteredMessages.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent-pink/20 to-accent-purple/20 flex items-center justify-center border border-pink-500/20">
              <MessageCircle className="w-8 h-8 text-pink-400/60" />
            </div>
            <div>
              <p className="text-sm font-bold text-white/80">Start Your Universe</p>
              <p className="text-xs text-slate-400 mt-1">Send the first message to {partnerUser?.petName} 💕</p>
            </div>
          </div>
        )}

        {filteredMessages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser?.uid;
          const showDateSep = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(filteredMessages[idx - 1].createdAt).toDateString();

          return (
            <React.Fragment key={msg.id}>
              {showDateSep && (
                <div className="flex items-center justify-center my-3">
                  <span className="px-3 py-1 rounded-full glass-card text-[10px] font-semibold text-slate-400 border border-white/5">
                    {new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                {msg.replyTo && (
                  <div className={`text-[10px] text-slate-300 mb-1 px-3 py-1.5 rounded-xl bg-white/5 border-l-2 border-accent-pink max-w-[75%] ${isMe ? 'text-right' : 'text-left'}`}>
                    <span className="text-pink-300 font-semibold text-[9px] block mb-0.5">Replying to</span>
                    <span className="truncate block">"{msg.replyTo.excerpt}"</span>
                  </div>
                )}

                <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[72%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <img
                      src={partnerUser?.photoURL}
                      alt={partnerUser?.realName}
                      className="w-7 h-7 rounded-full object-cover mb-1 border border-pink-400/40 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Partner&background=a855f7&color=fff`;
                      }}
                    />
                  )}

                  <div className="flex flex-col gap-1">
                    {/* Message bubble — tap for actions, double-tap for ❤️ */}
                    <div
                      className={`p-3 sm:p-3.5 rounded-2xl relative shadow-lg cursor-pointer transition-all active:scale-[0.98] ${
                        isMe
                          ? 'chat-bubble-sender rounded-tr-sm'
                          : 'chat-bubble-receiver rounded-tl-sm'
                      } ${msg.isSecret ? 'border-2 border-dashed border-rose-400/80 shadow-rose-500/20' : ''}`}
                      onClick={() => handleBubbleClick(msg)}
                    >
                      {msg.isSecret && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-rose-300 mb-1.5">
                          <Lock className="w-3 h-3" />
                          <span>Self-Destructing</span>
                        </div>
                      )}

                      {msg.type === 'image' && msg.mediaUrl && (
                        <img
                          src={msg.mediaUrl}
                          alt="Shared image"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(msg.mediaUrl!);
                          }}
                          className="w-full max-h-56 object-cover rounded-xl mb-2 border border-white/10 cursor-zoom-in hover:opacity-95 transition-opacity"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}

                      {msg.type === 'video' && msg.mediaUrl && (
                        <video src={msg.mediaUrl} controls className="w-full max-h-56 rounded-xl mb-2 border border-white/10" />
                      )}

                      {msg.type === 'audio' && msg.mediaUrl && (
                        <div className="my-1">
                          <VoiceNotePlayer src={msg.mediaUrl} isMe={isMe} />
                        </div>
                      )}

                      {msg.content.includes('Missed') && msg.content.includes('Call') ? (
                        <div className="flex items-center justify-between gap-3 p-1 text-rose-200">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-rose-400 animate-bounce" />
                            <span className="font-bold text-xs">{msg.content}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startCall(msg.content.includes('Video') ? 'video' : 'voice');
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
                            <span className="flex items-center text-cyan-300 font-bold gap-0.5 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" title={`Seen ${msg.seenAt ? new Date(msg.seenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`}>
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

                      {/* Reactions */}
                      {Object.keys(msg.reactions).length > 0 && (
                        <div className="absolute -bottom-3 right-2 flex items-center gap-0.5 bg-space-950 border border-white/10 px-1.5 py-0.5 rounded-full shadow-md text-xs">
                          {Object.entries(msg.reactions).map(([emoji, uids]) => (
                            <span key={emoji}>{emoji}{uids.length > 1 ? <sup className="text-[8px]">{uids.length}</sup> : ''}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick reaction / action bar — shows on click */}
                    <AnimatePresence>
                      {activeReactionMsgId === msg.id && (
                        <motion.div className={`flex items-center gap-1 bg-space-900/95 border border-white/10 rounded-2xl px-2 py-1.5 shadow-xl backdrop-blur-md ${isMe ? 'self-end' : 'self-start'}`}>
                          {QUICK_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); addReaction(msg.id, emoji); setActiveReactionMsgId(null); }}
                              className="text-base hover:scale-125 transition-transform active:scale-95 p-0.5"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-px h-4 bg-white/10 mx-0.5" />
                          <button onClick={(e) => { e.stopPropagation(); setPinnedMsg(pinnedMsg?.id === msg.id ? null : msg); setActiveReactionMsgId(null); toast.love(pinnedMsg?.id === msg.id ? 'Message unpinned' : 'Message pinned! 📌'); }} className="p-1 text-slate-300 hover:text-amber-300" title="Pin message">
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveReactionMsgId(null); inputRef.current?.focus(); }} className="p-1 text-slate-300 hover:text-pink-300" title="Reply">
                            <CornerUpLeft className="w-3.5 h-3.5" />
                          </button>
                          {isMe && (
                            <button onClick={(e) => { e.stopPropagation(); handleStartEdit(msg); }} className="p-1 text-slate-300 hover:text-sky-300" title="Edit">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setForwardingMsg(msg); setActiveReactionMsgId(null); }} className="p-1 text-slate-300 hover:text-purple-300" title="Forward">
                            <Forward className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); toggleStarMessage(msg.id); setActiveReactionMsgId(null); }} className="p-1 text-slate-300 hover:text-amber-300" title="Star">
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(msg); }} className="p-1 text-slate-300 hover:text-rose-400" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Typing indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-xs text-pink-300 italic mb-2 px-2">
            <img
              src={partnerUser?.photoURL}
              alt={partnerUser?.realName}
              className="w-5 h-5 rounded-full object-cover border border-pink-400/40"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Partner&background=a855f7&color=fff`;
              }}
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

      {/* Edit message inline */}
      {editingMsg && (
        <form onSubmit={handleEditSubmit} className="bg-sky-950/80 px-4 py-2.5 border-t border-sky-500/30 flex items-center gap-2 flex-shrink-0">
          <Edit3 className="w-4 h-4 text-sky-400 shrink-0" />
          <input
            ref={editInputRef}
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white focus:outline-none"
            placeholder="Edit message..."
          />
          <button type="submit" className="p-1.5 rounded-lg bg-sky-500/30 text-sky-300 hover:bg-sky-500/50" title="Save edit">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => { setEditingMsg(null); setEditContent(''); }} className="p-1.5 text-slate-400 hover:text-white" title="Cancel">
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* Reply Bar */}
      {replyingTo && (
        <div className="bg-space-900/90 px-4 sm:px-6 py-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-accent-pink shrink-0" />
            <span className="truncate">Replying: "{replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}"</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white ml-2 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-[68px] left-2 right-2 sm:left-4 sm:right-auto z-50 flex justify-center sm:block max-w-full">
          <EmojiGifPicker
            onSelectEmoji={(emoji) => setInputContent(prev => prev + emoji)}
            onSelectSticker={(url) => { sendMessage('Sticker', 'image', url); setShowEmojiPicker(false); }}
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
            <p className="text-xs text-slate-300 italic line-clamp-3">"{forwardingMsg.content}"</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setForwardingMsg(null)} className="flex-1 py-2.5 rounded-xl glass-card text-xs font-semibold">Cancel</button>
              <button onClick={handleForwardConfirm} className="flex-1 py-2.5 rounded-xl bg-accent-pink text-white text-xs font-bold">Forward</button>
            </div>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-2.5 sm:p-4 bg-space-900/90 border-t border-white/10 flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
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
          <Image className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 sm:p-2.5 rounded-xl glass-card text-slate-300 hover:text-amber-300 transition-colors flex-shrink-0"
          title="Emoji & Stickers"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleSendLocation}
          className="p-2 sm:p-2.5 rounded-xl glass-card text-slate-300 hover:text-emerald-300 transition-colors hidden sm:block flex-shrink-0"
          title="Share Location"
        >
          <MapPin className="w-5 h-5" />
        </button>

        {!isRecording ? (
          <button
            type="button"
            onClick={handleStartRecording}
            className="p-2 sm:p-2.5 rounded-xl glass-card text-slate-300 hover:text-purple-300 active:scale-95 transition-all flex-shrink-0"
            title="Record Voice Note"
          >
            <Mic className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopRecording}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-rose-500 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1.5 animate-pulse flex-shrink-0"
            title="Stop & Send Voice Note"
          >
            <StopCircle className="w-5 h-5" />
            <span>{recordingTime}s</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={inputContent}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Escape' && setActiveReactionMsgId(null)}
          placeholder={isSecretMode ? '🔒 Disappearing message...' : `Message ${partnerUser?.petName ?? ''}...`}
          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl glass-input text-xs sm:text-sm"
        />

        <button
          type="submit"
          disabled={!inputContent.trim()}
          className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all flex-shrink-0 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Full-Screen Image Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-2 right-2 p-2 rounded-full glass-card text-white hover:bg-white/20 z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={lightboxImage}
                alt="Full screen view"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
