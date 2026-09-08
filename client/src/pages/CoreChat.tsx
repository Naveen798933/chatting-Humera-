import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, formatLastSeen } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { useScreenSize } from '../hooks/useScreenSize';
import { sounds } from '../lib/soundEffects';
import { toast } from '../lib/toast';
import { Message, UserProfile } from '../types';
import { EmojiGifPicker } from '../components/EmojiGifPicker';
import { VoiceNotePlayer } from '../components/VoiceNotePlayer';
import { ViewOnceModal } from '../components/ViewOnceModal';
import { ChatListSidebar } from '../components/ChatListSidebar';
import { UserSearchModal } from '../components/UserSearchModal';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInputDock } from '../components/chat/ChatInputDock';
import {
  Send, Mic, Smile, Lock, Pin, ShieldAlert, Phone, Video, Camera,
  Trash2, Star, Search, CornerUpLeft, Clock, Paperclip, Eye, Flame,
  CheckCheck, Sparkles, X, StopCircle, MapPin, User, Forward, Edit3, Check, MessageCircle, MoreVertical, ArrowDown, ArrowRight, ArrowLeft, Users, Menu, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😍', '👏', '💋'];

interface CoreChatProps {
  onBackToHome?: () => void;
  onOpenPartnerProfile?: () => void;
}

export const CoreChat: React.FC<CoreChatProps> = ({ onBackToHome, onOpenPartnerProfile }) => {
  const { currentUser, partnerUser, toggleDecoyMode } = useAuth();
  const {
    chats, activeChatId, activeChat, setActiveChatId,
    messages, sendMessage, burnViewOnceMessage, deleteMessage, editMessage, markMessagesAsSeen,
    toggleStarMessage, addReaction, isPartnerTyping, setTypingStatus, startCall
  } = useUniverse();

  const [inputContent, setInputContent] = useState('');
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [isViewOnceMode, setIsViewOnceMode] = useState(false);
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
  const [activeViewOnce, setActiveViewOnce] = useState<{ id: string; url: string } | null>(null);

  // Modals state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('chat');

  // Deterministically switch to active chat view whenever activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      setMobileView('chat');
    }
  }, [activeChatId]);

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

  // Cleanup any active media stream on unmount (prevents microphone lock)
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  const handleBubbleClick = (msg: Message) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      // Double tap -> React with ❤️
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(25); } catch (_) {}
      }
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
  // Initial scroll to bottom — runs synchronously before first paint so the user
  // ALWAYS sees the latest message when opening the chat (no flicker, no delay).
  // 'instant' avoids any animated scroll that could cause a visible jump to top.
  useLayoutEffect(() => {
    isInitialScrolledRef.current = false;
    isNearBottomRef.current = true;
    setHasUnreadBelow(false);
  }, [activeChatId]);

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

    // Only mark messages as seen when there are actual unread partner messages
    const hasUnread = messages.some(m => m.senderId !== currentUser?.uid && !m.seen);
    if (hasUnread) {
      markMessagesAsSeen();
    }
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

  // Escape key: close lightbox, dismiss reaction bar, cancel reply
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) { setLightboxImage(null); return; }
        if (activeReactionMsgId) { setActiveReactionMsgId(null); return; }
        if (replyingTo) { setReplyingTo(null); return; }
        if (editingMsg) { setEditingMsg(null); setEditContent(''); return; }
      }
      // Panic hotkey: Alt+L
      if ((e.key === 'L' || e.key === 'l') && e.altKey) {
        toast.info('Panic mode activated!');
        toggleDecoyMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDecoyMode, lightboxImage, activeReactionMsgId, replyingTo, editingMsg]);

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
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(15); } catch (_) {}
    }
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
    const locText = currentUser?.city ? `📍 Shared live location: ${currentUser.city}` : '📍 Shared live location';
    sendMessage(locText, 'location', undefined, replyingTo?.id, isSecretMode, secretTimeout);
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
        sendMessage(
          isViewOnceMode ? 'Photo (View Once)' : 'Shared an image',
          'image',
          mediaUrl,
          replyingTo?.id,
          isSecretMode,
          secretTimeout,
          isViewOnceMode
        );
        setReplyingTo(null);
        if (isViewOnceMode) {
          setIsViewOnceMode(false);
          toast.love('View Once Photo Sent! 👁️');
        } else {
          toast.love('Photo sent! 💕');
        }
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

      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
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

  const isGroup = activeChat?.type === 'group';
  const chatTitle = isGroup ? (activeChat?.name || 'Group Chat') : (partnerUser?.displayName || partnerUser?.realName || 'Direct Chat');
  const chatAvatar = isGroup
    ? (activeChat?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat?.name || 'G')}&background=a855f7&color=fff`)
    : (partnerUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatTitle)}&background=ff70a6&color=fff`);
  const chatSubtitle = isGroup
    ? `${activeChat?.participants.length || 0} members`
    : (partnerUser?.username ? `@${partnerUser.username}` : (partnerUser?.online ? 'Online' : 'Offline'));

  const handleExportChat = () => {
    const htmlRows = messages.map(m => {
      const author = m.senderId === currentUser?.uid 
        ? (currentUser?.petName || currentUser?.displayName || currentUser?.username || 'Me')
        : (partnerUser?.petName || partnerUser?.displayName || partnerUser?.username || 'Partner');
      const time = new Date(m.createdAt).toLocaleString();
      const isMe = m.senderId === currentUser?.uid;
      const bgColor = isMe ? '#ff70a6' : '#2d1b69';
      const align = isMe ? 'right' : 'left';
      return `<div style="text-align:${align};margin:8px 0;">
        <span style="display:inline-block;max-width:70%;background:${bgColor};color:white;padding:8px 14px;border-radius:18px;font-size:13px;">
          <strong>${author}</strong><br/>${m.content}
          <div style="font-size:10px;opacity:0.7;margin-top:4px;">${time}</div>
        </span>
      </div>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Our Universe Chat</title>
    <style>body{font-family:system-ui,sans-serif;background:#0b071a;color:#f1f5f9;max-width:700px;margin:auto;padding:24px;}
    h1{text-align:center;background:linear-gradient(135deg,#ff70a6,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
    p.sub{text-align:center;color:#94a3b8;font-size:12px;margin-bottom:24px;}
    </style></head><body>
    <h1>💕 Our Universe Chat</h1>
    <p class="sub">Naveen & Humera — exported ${new Date().toLocaleString()}</p>
    ${htmlRows}
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OurUniverse_Chat_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.love('Chat exported as HTML! 📄');
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex-1 min-h-0 flex glass-panel rounded-none sm:rounded-3xl border-x-0 sm:border border-white/10 overflow-hidden shadow-2xl relative h-full">
      
      {/* Multi-Conversation Sidebar (Desktop always visible at fixed width, Mobile conditionally full width) */}
      <div className={`h-full shrink-0 border-r border-white/10 ${mobileView === 'sidebar' ? 'w-full block md:w-80 lg:w-96' : 'hidden md:block md:w-80 lg:w-96'}`}>
        <ChatListSidebar
          onOpenSearch={() => setShowSearchModal(true)}
          onOpenCreateGroup={() => setShowCreateGroupModal(true)}
          onSelectChat={(id) => {
            setActiveChatId(id);
            setMobileView('chat');
          }}
        />
      </div>

      {/* Main Active Conversation Window */}
      <div className={`w-full min-w-0 flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-space-950/40 ${
        mobileView === 'sidebar' ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Section 1: ChatHeader Subcomponent */}
        <ChatHeader
          chatTitle={chatTitle}
          chatAvatar={chatAvatar}
          chatSubtitle={chatSubtitle}
          isGroup={isGroup}
          partnerUser={partnerUser}
          isPartnerTyping={isPartnerTyping}
          isSecretMode={isSecretMode}
          showSearch={showSearch}
          showMoreMenu={showMoreMenu}
          onBackToSidebar={() => setMobileView('sidebar')}
          onOpenPartnerProfile={onOpenPartnerProfile}
          onBackToHome={onBackToHome}
          onStartCall={(type) => {
            startCall(type);
            toast.love(`Starting ${type === 'video' ? 'Video' : 'Voice'} Call... 📞`);
          }}
          onToggleSecretMode={() => {
            setIsSecretMode(prev => {
              const next = !prev;
              if (next) toast.love('Secret Disappearing Mode Activated 🔒');
              else toast.info('Secret Mode Disabled');
              return next;
            });
          }}
          onToggleSearch={() => setShowSearch(prev => !prev)}
          onToggleMoreMenu={() => setShowMoreMenu(prev => !prev)}
          onCloseMoreMenu={() => setShowMoreMenu(false)}
          onExportChat={handleExportChat}
        />

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
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-2 sm:p-2.5 bg-space-900/95 border-b border-white/10 flex flex-col gap-2 flex-shrink-0 z-20 overflow-hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

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
              <p className="text-xs text-slate-400 mt-1">Send the first message to {partnerUser?.petName || partnerUser?.displayName || partnerUser?.username || 'your friend'} 💕</p>
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

                <MessageBubble
                  msg={msg}
                  isMe={isMe}
                  partnerUser={partnerUser}
                  activeReactionMsgId={activeReactionMsgId}
                  pinnedMsgId={pinnedMsg?.id}
                  onBubbleClick={handleBubbleClick}
                  onAddReaction={addReaction}
                  onReply={(targetMsg) => {
                    setReplyingTo(targetMsg);
                    setActiveReactionMsgId(null);
                    inputRef.current?.focus();
                  }}
                  onPin={(targetMsg) => {
                    setPinnedMsg(pinnedMsg?.id === targetMsg.id ? null : targetMsg);
                    setActiveReactionMsgId(null);
                    toast.love(pinnedMsg?.id === targetMsg.id ? 'Message unpinned' : 'Message pinned! 📌');
                  }}
                  onStartEdit={(targetMsg) => {
                    handleStartEdit(targetMsg);
                  }}
                  onForward={(targetMsg) => {
                    setForwardingMsg(targetMsg);
                    setActiveReactionMsgId(null);
                  }}
                  onDelete={() => {
                    handleDelete(msg);
                  }}
                  onOpenLightbox={(url) => setLightboxImage(url)}
                  onOpenViewOnce={(id, url) => setActiveViewOnce({ id, url })}
                  onStartCall={(callType) => {
                    startCall(callType);
                    toast.love(`Starting ${callType === 'video' ? 'Video' : 'Voice'} Call... 📞`);
                  }}
                />
              </div>
            </React.Fragment>
          );
        })}

        {/* Typing indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-xs text-pink-300 italic mb-2 px-2">
            <img
              src={partnerUser?.photoURL}
              alt={partnerUser?.displayName || partnerUser?.username || 'Partner'}
              className="w-5 h-5 rounded-full object-cover border border-pink-400/40"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Partner&background=a855f7&color=fff`;
              }}
            />
            <span>{partnerUser?.petName || partnerUser?.displayName || partnerUser?.username || 'Someone'} is typing</span>
            <span className="inline-flex gap-1 items-center">
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-pink-400" />
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
        
        {/* Section 3: ChatInputDock Subcomponent */}
        <ChatInputDock
          inputContent={inputContent}
          isSecretMode={isSecretMode}
          isViewOnceMode={isViewOnceMode}
          replyingTo={replyingTo}
          pinnedMsg={null}
          showEmojiPicker={showEmojiPicker}
          isRecording={isRecording}
          recordingTime={recordingTime}
          partnerName={partnerUser?.petName || partnerUser?.displayName || partnerUser?.username || 'chat'}
          onInputChange={handleInputChange}
          onInputKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            } else if (e.key === 'Escape') {
              setActiveReactionMsgId(null);
            }
          }}
          onInputFocus={handleInputFocus}
          onSend={handleSend}
          onToggleEmojiPicker={() => setShowEmojiPicker(prev => !prev)}
          onSelectEmoji={(emoji) => setInputContent(prev => prev + emoji)}
          onSelectSticker={(url) => {
            sendMessage('Sticker', 'image', url);
            setShowEmojiPicker(false);
          }}
          onToggleViewOnce={() => {
            setIsViewOnceMode(prev => {
              const next = !prev;
              if (next) toast.love('View Once Mode (1) Enabled 👁️');
              else toast.info('View Once Disabled');
              return next;
            });
          }}
          onFileUpload={handleFileUpload}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onCancelReply={() => setReplyingTo(null)}
          onUnpinMessage={() => setPinnedMsg(null)}
          inputRef={inputRef}
        />
      </div>

      {/* 👁️ View Once Self-Destructing Photo Modal */}
      {activeViewOnce && (
        <ViewOnceModal
          mediaUrl={activeViewOnce.url}
          onBurn={() => {
            burnViewOnceMessage(activeViewOnce.id);
            setActiveViewOnce(null);
          }}
          onClose={() => {
            burnViewOnceMessage(activeViewOnce.id);
            setActiveViewOnce(null);
          }}
        />
      )}

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

      {/* Modals */}
      <UserSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
      </div>
    </div>
  );
};
