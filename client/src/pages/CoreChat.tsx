import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, formatLastSeen } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { useScreenSize } from '../hooks/useScreenSize';
import { sounds } from '../lib/soundEffects';
import { toast } from '../lib/toast';
import { Message } from '../types';
import { EmojiGifPicker } from '../components/EmojiGifPicker';
import { VoiceNotePlayer } from '../components/VoiceNotePlayer';
import {
  Send, Mic, Smile, Lock, Pin, ShieldAlert, Phone, Video, Camera,
  Trash2, Star, Search, CornerUpLeft, Clock, Paperclip,
  CheckCheck, Sparkles, X, StopCircle, MapPin, User, Forward, Edit3, Check, MessageCircle, MoreVertical, ArrowDown
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Microphone audio recording refs
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
      }, 200);
    }
  };

  const [hasUnreadBelow, setHasUnreadBelow] = useState<boolean>(false);
  const isNearBottomRef = useRef<boolean>(true);
  const isInitialScrolledRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(messages.length);

  // Helper to scroll messages container strictly to bottom
  const scrollToBottom = (smooth = true) => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Track if user is scrolled near bottom (mobile touch threshold: 180px)
  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const threshold = 180;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom <= threshold;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      setHasUnreadBelow(false);
    }
  };

  // Initial scroll to bottom — runs synchronously before first paint so the user
  // ALWAYS sees the latest message when opening the chat (no flicker, no delay).
  // 'instant' avoids any animated scroll that could cause a visible jump to top.
  useLayoutEffect(() => {
    isInitialScrolledRef.current = false;
    isNearBottomRef.current = true;
    setHasUnreadBelow(false);
  }, []);

  // Scroll to bottom on initial message load.
  // useLayoutEffect fires before paint — user sees the bottom immediately.
  // After first scroll, isInitialScrolledRef guards against repeated firing.
  useLayoutEffect(() => {
    if (messages.length === 0) return;
    if (isInitialScrolledRef.current) return;

    const container = chatContainerRef.current;
    if (!container) return;

    // Instant scroll (no animation) so mobile never shows the top first
    container.scrollTop = container.scrollHeight;
    isInitialScrolledRef.current = true;
  }, [messages.length]);

  // Handle new incoming messages / partner typing updates
  useEffect(() => {
    if (!isInitialScrolledRef.current || messages.length === 0) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    const hasNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (hasNewMessage) {
      const lastMsg = messages[messages.length - 1];
      const isMyMessage = lastMsg?.senderId === currentUser?.uid;

      if (isMyMessage || isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom(true));
        setHasUnreadBelow(false);
      } else {
        // User is scrolled up reading old messages -> show floating "↓ New Messages" button!
        setHasUnreadBelow(true);
      }
    } else if (isPartnerTyping && isNearBottomRef.current) {
      scrollToBottom(true);
    }

    markMessagesAsSeen();
  }, [messages, isPartnerTyping, currentUser?.uid]);

  // Handle focus on mobile keyboard open (scrolls ONLY chat container, never page)
  const handleInputFocus = () => {
    if (isNearBottomRef.current) {
      setTimeout(() => scrollToBottom(true), 120);
    }
  };

  // Visual Viewport resize listener for mobile virtual keyboard
  useEffect(() => {
    const handleViewportResize = () => {
      if (document.activeElement === inputRef.current && isNearBottomRef.current) {
        scrollToBottom(true);
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
  }, []);

  // Panic Hotkey Listener (Alt + L -> Stealth Decoy)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File too large! Max 15MB');
      return;
    }

    const isVideo = file.type.startsWith('video');

    if (isVideo) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error('Video too large! Max 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const mediaUrl = reader.result as string;
        sendMessage('Shared a video', 'video', mediaUrl, replyingTo?.id, isSecretMode, secretTimeout);
        setReplyingTo(null);
        toast.love('Video sent! 📹');
      };
      reader.readAsDataURL(file);
    } else {
      toast.info('Sending photo... 📸');
      try {
        const mediaUrl = await compressImage(file);
        if (!mediaUrl) {
          toast.error('Could not process image.');
          return;
        }
        sendMessage('Shared an image', 'image', mediaUrl, replyingTo?.id, isSecretMode, secretTimeout);
        setReplyingTo(null);
        toast.love('Photo sent! 💕');
      } catch (err) {
        console.error('Image compression error:', err);
        toast.error('Failed to send photo.');
      }
    }
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

  const [chatFilter, setChatFilter] = useState<'all' | 'starred' | 'media' | 'audio'>('all');

  const filteredMessages = messages.filter(m => {
    if (chatFilter === 'starred' && !m.isStarred) return false;
    if (chatFilter === 'media' && !(m.type === 'image' || m.type === 'video')) return false;
    if (chatFilter === 'audio' && m.type !== 'audio') return false;
    if (!searchQuery.trim()) return true;
    return m.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-4xl w-full mx-auto flex flex-col glass-panel rounded-none sm:rounded-3xl border-x-0 sm:border border-white/10 overflow-hidden shadow-2xl relative h-full md:h-[82vh]">
      
      {/* Chat Header */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-white/10 flex items-center justify-between bg-space-900/90 backdrop-blur-md flex-shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={partnerUser?.photoURL}
              alt={partnerUser?.realName}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-accent-pink shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerUser?.realName || 'Partner')}&background=a855f7&color=fff`;
              }}
            />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-space-950 rounded-full ${
              partnerUser?.online ? 'bg-emerald-500' : 'bg-slate-500'
            }`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1 truncate">
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

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Quick Voice Call Button */}
          <button
            onClick={() => { startCall('voice'); toast.love('Starting Voice Call... 📞'); }}
            title="Start Voice Call"
            className="p-1.5 sm:p-2 rounded-xl glass-card text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/40 transition-colors"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Quick Video Call Button */}
          <button
            onClick={() => { startCall('video'); toast.love('Starting Video Call... 📹'); }}
            title="Start Video Call"
            className="p-1.5 sm:p-2 rounded-xl glass-card text-pink-300 hover:text-pink-200 hover:border-pink-500/40 transition-colors"
          >
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setIsSecretMode(!isSecretMode)}
            className={`px-2 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all ${
              isSecretMode
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse'
                : 'glass-card text-slate-300 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{isSecretMode ? 'Secret ON' : 'Secret'}</span>
          </button>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 sm:p-2 rounded-xl glass-card text-slate-300 hover:text-white"
            title="Search in chat"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* More Options (3 Dots) Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 sm:p-2 rounded-xl glass-card text-slate-300 hover:text-white"
              title="More options"
            >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-11 z-50 w-48 rounded-2xl glass-panel-glow border border-pink-500/30 p-2 shadow-2xl space-y-1"
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
            className="bg-rose-950/90 border-b border-rose-500/40 px-3 sm:px-6 py-2 flex items-center justify-between text-xs text-rose-200 flex-shrink-0"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-400 animate-spin" />
              <span className="font-bold text-rose-300 text-[11px] sm:text-xs">Disappearing Messages</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-rose-300 hidden sm:inline">Burn:</span>
                <select
                  value={secretTimeout}
                  onChange={(e) => setSecretTimeout(Number(e.target.value))}
                  className="bg-space-900 border border-rose-500/40 rounded-lg px-2 py-1 text-xs text-white font-semibold"
                >
                  <option value={30} className="bg-space-900 text-white font-semibold">30s</option>
                  <option value={60} className="bg-space-900 text-white font-semibold">1 min</option>
                  <option value={600} className="bg-space-900 text-white font-semibold">10 min</option>
                  <option value={3600} className="bg-space-900 text-white font-semibold">1 hr</option>
                  <option value={86400} className="bg-space-900 text-white font-semibold">24 hrs</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setIsSecretMode(false);
                  toast.info('Disappearing messages turned off');
                }}
                className="px-2 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Turn off secret mode"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Turn Off</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned Message Banner */}
      <AnimatePresence>
        {pinnedMsg && (
          <motion.div className="bg-amber-950/70 border-b border-amber-500/30 px-3 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-200 flex-shrink-0">
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

      {/* Search & Media Filter Bar */}
      {showSearch && (
        <div className="p-2 sm:p-2.5 bg-space-900/95 border-b border-white/10 flex flex-col gap-2 flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-pink-400 ml-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat messages..."
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-400"
              autoFocus
            />
            <button onClick={() => { setSearchQuery(''); setChatFilter('all'); setShowSearch(false); }} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'All Messages' },
              { id: 'starred', label: '⭐ Starred' },
              { id: 'media', label: '📷 Media' },
              { id: 'audio', label: '🎙️ Voice Notes' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setChatFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                  chatFilter === f.id
                    ? 'bg-accent-pink text-white shadow-md'
                    : 'glass-card text-slate-300 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area — tap empty background to dismiss open action menus */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        onClick={() => setActiveReactionMsgId(null)}
        className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 space-y-3"
        id="chat-messages"
      >

        {/* Empty state */}
        {filteredMessages.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-accent-pink/20 to-accent-purple/20 flex items-center justify-center border border-pink-500/20">
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

                <div className={`flex items-end gap-2 max-w-[90%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
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
                    {/* Message bubble */}
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
                      {Object.keys(msg.reactions || {}).length > 0 && (
                        <div className="absolute -bottom-3 right-2 flex items-center gap-0.5 bg-space-950 border border-white/10 px-1.5 py-0.5 rounded-full shadow-md text-xs">
                          {Object.entries(msg.reactions || {}).map(([emoji, uids]) => (
                            <span key={emoji}>{emoji}{uids.length > 1 ? <sup className="text-[8px]">{uids.length}</sup> : ''}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick reaction / action bar — shows on click */}
                    <AnimatePresence>
                      {activeReactionMsgId === msg.id && (
                        <motion.div
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className={`flex items-center gap-1 bg-space-900/95 border border-white/10 rounded-2xl px-2 py-1.5 shadow-xl backdrop-blur-md flex-wrap max-w-[min(280px,82vw)] overflow-hidden ${isMe ? 'self-end' : 'self-start'}`}
                        >
                          {QUICK_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); addReaction(msg.id, emoji); setActiveReactionMsgId(null); }}
                              className="text-base hover:scale-125 transition-transform active:scale-95 p-1 min-w-[34px] min-h-[34px] flex items-center justify-center"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div className="w-px h-4 bg-white/10 mx-0.5" />
                          <button onClick={(e) => { e.stopPropagation(); setPinnedMsg(pinnedMsg?.id === msg.id ? null : msg); setActiveReactionMsgId(null); toast.love(pinnedMsg?.id === msg.id ? 'Message unpinned' : 'Message pinned! 📌'); }} className="p-1.5 text-slate-300 hover:text-amber-300 min-w-[34px] min-h-[34px] flex items-center justify-center" title="Pin message">
                            <Pin className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveReactionMsgId(null); inputRef.current?.focus(); }} className="p-1.5 text-slate-300 hover:text-pink-300 min-w-[34px] min-h-[34px] flex items-center justify-center" title="Reply">
                            <CornerUpLeft className="w-4 h-4" />
                          </button>
                          {isMe && (
                            <button onClick={(e) => { e.stopPropagation(); handleStartEdit(msg); }} className="p-1.5 text-slate-300 hover:text-sky-300 min-w-[34px] min-h-[34px] flex items-center justify-center" title="Edit">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setForwardingMsg(msg); setActiveReactionMsgId(null); }} className="p-1.5 text-slate-300 hover:text-purple-300 min-w-[34px] min-h-[34px] flex items-center justify-center" title="Forward">
                            <Forward className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); toggleStarMessage(msg.id); setActiveReactionMsgId(null); }} className="p-1.5 text-slate-300 hover:text-amber-300 min-w-[34px] min-h-[34px] flex items-center justify-center" title="Star">
                            <Star className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(msg); }} className="p-1.5 text-slate-300 hover:text-rose-400 min-w-[34px] min-h-[34px] flex items-center justify-center" title="Delete">
                            <Trash2 className="w-4 h-4" />
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

      {/* Edit message inline bar */}
      {editingMsg && (
        <form onSubmit={handleEditSubmit} className="bg-sky-950/90 px-4 py-2.5 border-t border-sky-500/30 flex items-center gap-2 flex-shrink-0 z-20">
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
        <div className="bg-space-900/90 px-4 sm:px-6 py-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 flex-shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-accent-pink shrink-0" />
            <span className="truncate">Replying: "{replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}"</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white ml-2 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File input is portaled to document.body — detached from chat DOM tree
           This is the ONLY reliable way to prevent Android Chrome from routing
           tap events on nearby form elements through the file input */}
      {createPortal(
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*"
          tabIndex={-1}
          aria-hidden="true"
          style={{
            display: 'none',
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '0px',
            height: '0px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -9999,
          }}
        />,
        document.body
      )}

      {/* Pro WhatsApp-Style Chat Composer Container */}
      <div className="relative flex-shrink-0 z-20">

        {/* Floating "↓ New Messages" Indicator Button (WhatsApp-like UX) */}
        <AnimatePresence>
          {hasUnreadBelow && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              onClick={() => {
                scrollToBottom(true);
                setHasUnreadBelow(false);
              }}
              className="absolute bottom-full right-4 mb-3 z-40 px-3.5 py-2 rounded-full bg-gradient-to-r from-accent-pink via-accent-purple to-indigo-600 text-white text-xs font-extrabold shadow-2xl border border-white/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title="Scroll to latest messages"
            >
              <ArrowDown className="w-4 h-4 animate-bounce" />
              <span>New Messages</span>
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* Emoji & Sticker Picker Overlay */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 sm:left-4 sm:right-auto mb-2 z-50 flex justify-center sm:block max-w-full px-2 sm:px-0"
            >
              <EmojiGifPicker
                onSelectEmoji={(emoji) => setInputContent(prev => prev + emoji)}
                onSelectSticker={(url) => { sendMessage('Sticker', 'image', url); setShowEmojiPicker(false); }}
                onClose={() => setShowEmojiPicker(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Composer Form Bar */}
        <form
          onSubmit={handleSend}
          className="px-2 py-2 sm:px-4 sm:py-3 bg-space-950/95 backdrop-blur-2xl border-t border-white/10 flex items-end gap-1.5 sm:gap-2"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
        >
          {/* Integrated Input Capsule (Pill shape: Emoji + Textarea + Attach + Camera) */}
          <div className="flex-1 min-w-0 flex items-end bg-space-900/90 border border-white/15 rounded-3xl p-1.5 focus-within:border-pink-400/70 focus-within:ring-1 focus-within:ring-pink-400/40 transition-all shadow-inner">
            
            {/* 😊 Emoji Button inside Capsule */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-slate-300 hover:text-amber-300 active:scale-95 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0 rounded-full"
              title="Emoji & Stickers"
              aria-label="Toggle emoji picker"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Middle Textarea inside Capsule */}
            <textarea
              ref={inputRef}
              value={inputContent}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                } else if (e.key === 'Escape') {
                  setActiveReactionMsgId(null);
                }
              }}
              placeholder={isSecretMode ? '🔒 Disappearing message...' : `Message ${partnerUser?.petName ?? ''}...`}
              rows={1}
              className="flex-1 min-w-0 px-2 py-1.5 bg-transparent text-white placeholder-slate-400 text-xs sm:text-sm resize-none overflow-y-auto max-h-24 leading-relaxed focus:outline-none scrollbar-none"
              style={{ touchAction: 'manipulation', WebkitUserSelect: 'text', userSelect: 'text' }}
              autoComplete="off"
              autoCorrect="on"
              spellCheck={true}
              enterKeyHint="send"
              aria-label="Type a message"
            />

            {/* 📎 Attachment Clip inside Capsule */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
              className="p-2 text-slate-300 hover:text-pink-300 active:scale-95 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0 rounded-full"
              title="Attach Media"
              aria-label="Attach media"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* 📷 Camera Button inside Capsule */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
              className="p-2 text-slate-300 hover:text-purple-300 active:scale-95 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0 rounded-full hidden sm:flex"
              title="Take Photo"
              aria-label="Take photo"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Action Button Outside Capsule (Circular Floating Button for Send / Voice) */}
          <div className="flex-shrink-0">
            {inputContent.trim().length > 0 ? (
              <button
                type="submit"
                className="w-11 h-11 rounded-full bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                title="Send Message"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            ) : !isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                className="w-11 h-11 rounded-full bg-space-900 border border-white/15 text-slate-200 hover:text-purple-300 hover:border-purple-400/40 active:scale-95 transition-all flex items-center justify-center shadow-md"
                title="Record Voice Note"
                aria-label="Record voice note"
              >
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecording}
                className="h-11 px-3.5 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse shadow-lg shadow-rose-500/40"
                title="Stop & Send Voice Note"
                aria-label="Stop recording and send voice note"
              >
                <StopCircle className="w-5 h-5" />
                <span>{recordingTime}s</span>
              </button>
            )}
          </div>
        </form>
      </div>

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
