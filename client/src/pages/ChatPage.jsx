import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useKeyboardInset } from '../hooks/useKeyboardInset.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { PresencePill } from '../components/PresencePill.jsx';
import { MessageBubble } from '../components/MessageBubble.jsx';
import { TypingIndicator } from '../components/TypingIndicator.jsx';
import { ChatComposer } from '../components/ChatComposer.jsx';
import { LiveCursorLayer } from '../components/LiveCursorLayer.jsx';
import { RoomToolbar } from '../components/RoomToolbar.jsx';

export function ChatPage() {
  const { isAuthenticated, user, room, setRoom, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [messageFilter, setMessageFilter] = useState('all');
  const [starredMessageIds, setStarredMessageIds] = useState([]);
  const [pinnedMessageIds, setPinnedMessageIds] = useState([]);
  const [replyDraft, setReplyDraft] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [typingUserId, setTypingUserId] = useState('');
  const [partnerViewing, setPartnerViewing] = useState(false);
  const [presence, setPresence] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [roomSettings, setRoomSettings] = useState({ moodStatus: '', dailyMemoryMessage: '', themeMode: 'night-romantic' });
  const [musicUrl, setMusicUrl] = useState('');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const scrollRef = useRef(null);
  const searchInputRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const keyboardInset = useKeyboardInset();
  const socket = getSocket();
  const draftStorageKey = useMemo(() => (room?._id ? `lovechat_draft_${room._id}` : ''), [room?._id]);
  const starredStorageKey = useMemo(() => (room?._id ? `lovechat_starred_${room._id}` : ''), [room?._id]);
  const filterStorageKey = useMemo(() => (room?._id ? `lovechat_filter_${room._id}` : ''), [room?._id]);

  useEffect(() => {
    if (!room?._id) return;
    async function loadRoom() {
      const { data } = await api.get(`/rooms/${room._id}`);
      setRoom(data.room);
      setMessages(data.messages.map((message) => ({ ...message, plainText: message.plainText || message.text || '' })));
      setPinnedMessageIds((data.room?.pinnedMessageIds || []).map((item) => String(item)));
      setRoomSettings({
        moodStatus: data.room.moodStatus || '',
        dailyMemoryMessage: data.room.dailyMemoryMessage || '',
        themeMode: data.room.themeMode || 'night-romantic'
      });
    }
    loadRoom();
  }, [room?._id, setRoom]);

  useEffect(() => {
    if (!room?._id || !socket) return undefined;
    socket.emit('room:open', { roomId: room._id });
    const handleNewMessage = (payload) => setMessages((current) => [...current, { ...payload.message, plainText: payload.message?.plainText || '' }]);
    const handleTyping = ({ userId, isTyping }) => setTypingUserId(isTyping ? userId : '');
    const handlePresence = ({ userId, isOnline }) => setPresence((current) => ({ ...current, [userId]: isOnline }));
    const handleSeen = ({ messageId, seenBy }) => {
      setMessages((current) => current.map((item) => (item._id === messageId ? { ...item, seenBy: [...(item.seenBy || []), seenBy] } : item)));
    };
    const handleReaction = ({ messageId, reaction }) => {
      setMessages((current) => current.map((item) => (item._id === messageId ? { ...item, reaction } : item)));
    };
    const handleMood = ({ moodStatus }) => setRoomSettings((current) => ({ ...current, moodStatus }));
    const handleViewing = ({ isViewing }) => setPartnerViewing(Boolean(isViewing));
    const handleUpdate = ({ messageId, text, editedAt, editCount }) => {
      setMessages((current) => current.map((item) => (item._id === messageId ? { ...item, plainText: text, editedAt, editCount } : item)));
    };
    const handlePins = ({ pinnedMessageIds: nextPinnedIds = [] }) => {
      setPinnedMessageIds(nextPinnedIds.map((item) => String(item)));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('presence:update', handlePresence);
    socket.on('message:seen', handleSeen);
    socket.on('reaction:update', handleReaction);
    socket.on('mood:update', handleMood);
    socket.on('room:viewing', handleViewing);
    socket.on('message:update', handleUpdate);
    socket.on('room:pins', handlePins);
    socket.on('miss-you', () => setRoomSettings((current) => ({ ...current, moodStatus: 'Miss you mode active' })));

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('presence:update', handlePresence);
      socket.off('message:seen', handleSeen);
      socket.off('reaction:update', handleReaction);
      socket.off('mood:update', handleMood);
      socket.off('room:viewing', handleViewing);
      socket.off('message:update', handleUpdate);
      socket.off('room:pins', handlePins);
      socket.off('miss-you');
    };
  }, [room?._id, socket]);

  useEffect(() => {
    if (!socket || !room?._id) return undefined;
    let frameId;
    const onMove = (event) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        socket.emit('cursor:move', { roomId: room._id, x: event.clientX, y: event.clientY });
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onMove);
    };
  }, [room?._id, socket]);

  useEffect(() => {
    if (!scrollRef.current || !shouldAutoScrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    setShowJumpToLatest(false);
  }, [messages.length]);

  useEffect(() => {
    if (!draftStorageKey) return;
    const storedDraft = localStorage.getItem(draftStorageKey);
    if (storedDraft) {
      setTypedMessage(storedDraft);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftStorageKey) return;
    if (!typedMessage.trim()) {
      localStorage.removeItem(draftStorageKey);
      return;
    }
    localStorage.setItem(draftStorageKey, typedMessage);
  }, [draftStorageKey, typedMessage]);

  useEffect(() => {
    if (!starredStorageKey) return;
    const storedStars = localStorage.getItem(starredStorageKey);
    if (!storedStars) {
      setStarredMessageIds([]);
      return;
    }
    try {
      const parsed = JSON.parse(storedStars);
      setStarredMessageIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setStarredMessageIds([]);
    }
  }, [starredStorageKey]);

  useEffect(() => {
    if (!starredStorageKey) return;
    localStorage.setItem(starredStorageKey, JSON.stringify(starredMessageIds));
  }, [starredStorageKey, starredMessageIds]);

  useEffect(() => {
    if (!filterStorageKey) return;
    const savedFilter = localStorage.getItem(filterStorageKey);
    if (savedFilter) {
      setMessageFilter(savedFilter);
    }
  }, [filterStorageKey]);

  useEffect(() => {
    if (!filterStorageKey) return;
    localStorage.setItem(filterStorageKey, messageFilter);
  }, [filterStorageKey, messageFilter]);

  useEffect(() => {
    const onSearchShortcut = (event) => {
      const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (!isShortcut) return;
      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    window.addEventListener('keydown', onSearchShortcut);
    return () => window.removeEventListener('keydown', onSearchShortcut);
  }, []);

  useEffect(() => {
    const onFilterShortcut = (event) => {
      if (!event.altKey) return;
      const shortcuts = {
        '1': 'all',
        '2': 'mine',
        '3': 'media',
        '4': 'reacted',
        '5': 'starred',
        '6': 'recent',
        '7': 'pinned'
      };
      const selectedFilter = shortcuts[event.key];
      if (!selectedFilter) return;
      event.preventDefault();
      setMessageFilter(selectedFilter);
    };
    window.addEventListener('keydown', onFilterShortcut);
    return () => window.removeEventListener('keydown', onFilterShortcut);
  }, []);

  const partner = useMemo(() => room?.members?.find((member) => member._id !== user?.id), [room?.members, user?.id]);

  if (!isAuthenticated && !localStorage.getItem('lovechat_token')) {
    return <Navigate to="/login" replace />;
  }

  async function sendMessage(imageUrl = '') {
    if (!typedMessage.trim() && !imageUrl) return;
    shouldAutoScrollRef.current = true;
    socket?.emit('message:send', {
      roomId: room._id,
      text: typedMessage,
      messageType: imageUrl ? 'image' : 'text',
      attachmentUrl: imageUrl,
      replyTo: replyDraft?.messageId || null
    });
    try {
      const audioContext = new window.AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = 660;
      gain.gain.value = 0.02;
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch {
      // ignore audio failures on unsupported devices
    }
    setTypedMessage('');
    if (draftStorageKey) {
      localStorage.removeItem(draftStorageKey);
    }
    setReplyDraft(null);
    setEditDraft(null);
  }

  async function saveEdit() {
    if (!editDraft?.messageId || !editDraft.text.trim()) return;
    await api.put(`/rooms/messages/${editDraft.messageId}`, { text: editDraft.text });
    setMessages((current) => current.map((item) => (item._id === editDraft.messageId ? { ...item, plainText: editDraft.text, editedAt: new Date().toISOString() } : item)));
    socket?.emit('message:edit', { messageId: editDraft.messageId, text: editDraft.text });
    setEditDraft(null);
  }

  function handleTyping(value) {
    socket?.emit('typing', { roomId: room._id, isTyping: Boolean(value) });
  }

  function handleMusicUpdate(url) {
    setMusicUrl(url);
    socket?.emit('music:update', {
      roomId: room._id,
      title: 'Shared track',
      url,
      isPlaying: Boolean(url)
    });
  }

  async function handleImagePick(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => sendMessage(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  async function handleDelete(messageId) {
    await api.delete(`/rooms/messages/${messageId}`);
    setMessages((current) => current.filter((item) => item._id !== messageId));
    setStarredMessageIds((current) => current.filter((item) => item !== messageId));
  }

  function handleEdit(message) {
    setEditDraft({ messageId: message._id, text: message.plainText || '' });
  }

  function handleReact(messageId, reaction) {
    socket?.emit('reaction:add', { roomId: room._id, messageId, reaction });
  }

  function handleToggleStar(messageId) {
    setStarredMessageIds((current) => (
      current.includes(messageId)
        ? current.filter((item) => item !== messageId)
        : [...current, messageId]
    ));
  }

  function handleReply(message) {
    const preview = message.messageType === 'image'
      ? 'Image'
      : (message.plainText || message.text || '').slice(0, 100);
    setReplyDraft({ messageId: message._id, preview });
  }

  async function handleTogglePin(messageId) {
    const currentlyPinned = pinnedMessageIds.includes(String(messageId));
    setPinnedMessageIds((current) => (
      current.includes(String(messageId))
        ? current.filter((item) => item !== String(messageId))
        : [...current, String(messageId)]
    ));
    socket?.emit('message:pin', {
      roomId: room._id,
      messageId,
      isPinned: !currentlyPinned
    });
  }

  function handleChatScroll(event) {
    const element = event.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
    shouldAutoScrollRef.current = isNearBottom;
    setShowJumpToLatest(!isNearBottom);
  }

  function jumpToLatest() {
    if (!scrollRef.current) return;
    shouldAutoScrollRef.current = true;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    setShowJumpToLatest(false);
  }

  async function saveRoomSettings() {
    const { data } = await api.put(`/rooms/${room._id}/settings`, roomSettings);
    setRoom(data.room);
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  if (!room) {
    return <div className="loading-screen">Loading private room...</div>;
  }

  const visibleMessages = messages.filter((message) => {
    const normalizedSearch = messageSearch.trim().toLowerCase();
    if (normalizedSearch) {
      const haystack = `${message.plainText || ''} ${message.senderNickname || ''} ${message.reaction || ''}`.toLowerCase();
      if (!haystack.includes(normalizedSearch)) return false;
    }

    if (messageFilter === 'media') {
      return message.messageType === 'image';
    }

    if (messageFilter === 'reacted') {
      return Boolean(message.reaction);
    }

    if (messageFilter === 'mine') {
      return String(message.sender?._id || message.sender) === String(user?.id);
    }

    if (messageFilter === 'starred') {
      return starredMessageIds.includes(message._id);
    }

    if (messageFilter === 'recent') {
      const ageMs = Date.now() - new Date(message.createdAt).getTime();
      return ageMs <= 24 * 60 * 60 * 1000;
    }

    if (messageFilter === 'pinned') {
      return pinnedMessageIds.includes(String(message._id));
    }

    const messageDate = new Date(message.createdAt).getTime();
    if (dateRangeFilter === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (messageDate < todayStart.getTime()) return false;
    }
    if (dateRangeFilter === 'week') {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (messageDate < weekAgo) return false;
    }

    return true;
  });

  const mediaMessages = useMemo(
    () => messages.filter((message) => message.messageType === 'image' && message.attachmentUrl),
    [messages]
  );

  const chatStats = useMemo(() => {
    const mine = messages.filter((message) => String(message.sender?._id || message.sender) === String(user?.id)).length;
    const media = messages.filter((message) => message.messageType === 'image').length;
    const reacted = messages.filter((message) => Boolean(message.reaction)).length;
    return {
      total: messages.length,
      mine,
      media,
      reacted,
      starred: starredMessageIds.length,
      pinned: pinnedMessageIds.length
    };
  }, [messages, pinnedMessageIds.length, starredMessageIds.length, user?.id]);

  return (
    <div className={`chat-shell ${theme}`}>
      <div className="floating-bg" />
      {mobileMenuOpen ? <button type="button" aria-label="Close sidebar overlay" className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} /> : null}
      <Sidebar
        user={user}
        room={room}
        onOpenProfile={() => navigate('/profile')}
        onOpenRoom={() => document.querySelector('.chat-footer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <main className="chat-main">
        <motion.header className="chat-header" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <p className="eyebrow">Connected with {partner?.name || 'your person'}</p>
            <h1>{room.name}</h1>
            <p className="subtle">{roomSettings.moodStatus || room.moodStatus}</p>
          </div>
          <div className="chat-header-actions">
            <PresencePill online={Boolean(presence[partner?._id])} label={presence[partner?._id] ? 'Online' : 'Offline'} />
            <PresencePill online={partnerViewing} label={partnerViewing ? 'Viewing chat' : 'Not viewing'} />
            <button className="glass-button" onClick={() => socket?.emit('miss-you', { roomId: room._id })}>Miss you</button>
            <button className="glass-button" onClick={() => socket?.emit('mood:update', { roomId: room._id, moodStatus: 'Night romantic mode' })}>Night mode</button>
            <button className="glass-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
            <button className="glass-button" onClick={() => setIsGalleryOpen((current) => !current)}>Media Gallery ({mediaMessages.length})</button>
            <button className="glass-button" onClick={handleLogout}>Logout</button>
          </div>
        </motion.header>

        <div className="cartoon-banner glass-panel" aria-label="Love theme highlight">
          <div className="cartoon-banner-copy">
            <div className="cartoon-badge">💞 Cartoon love mode</div>
          </div>
          <div className="cartoon-stars" aria-hidden="true">
            <span>✨</span>
            <span>💗</span>
            <span>🌙</span>
          </div>
        </div>

        <LiveCursorLayer />

        <section className="chat-body" ref={scrollRef} onScroll={handleChatScroll}>
          <div className="room-banner glass-panel">
            <div>
              <strong>Daily memory</strong>
              <p>{roomSettings.dailyMemoryMessage || room.dailyMemoryMessage}</p>
            </div>
            <div>
              <strong>Love counter</strong>
              <p>{room.loveCounter || 0} messages</p>
            </div>
          </div>
          <div className="glass-panel room-searchbar">
            <input ref={searchInputRef} value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Search messages, names, reactions (Ctrl/Cmd+K)" />
            <select value={dateRangeFilter} onChange={(event) => setDateRangeFilter(event.target.value)} className="date-range-select" aria-label="Filter messages by date range">
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
            </select>
            <div className="filter-row" role="tablist" aria-label="Message filters">
              <button type="button" className={`filter-chip ${messageFilter === 'all' ? 'active' : ''}`} onClick={() => setMessageFilter('all')}>All (Alt+1)</button>
              <button type="button" className={`filter-chip ${messageFilter === 'mine' ? 'active' : ''}`} onClick={() => setMessageFilter('mine')}>Mine (Alt+2)</button>
              <button type="button" className={`filter-chip ${messageFilter === 'media' ? 'active' : ''}`} onClick={() => setMessageFilter('media')}>Media (Alt+3)</button>
              <button type="button" className={`filter-chip ${messageFilter === 'reacted' ? 'active' : ''}`} onClick={() => setMessageFilter('reacted')}>Reacted (Alt+4)</button>
              <button type="button" className={`filter-chip ${messageFilter === 'starred' ? 'active' : ''}`} onClick={() => setMessageFilter('starred')}>Starred (Alt+5)</button>
              <button type="button" className={`filter-chip ${messageFilter === 'recent' ? 'active' : ''}`} onClick={() => setMessageFilter('recent')}>Recent 24h (Alt+6)</button>
              <button type="button" className={`filter-chip ${messageFilter === 'pinned' ? 'active' : ''}`} onClick={() => setMessageFilter('pinned')}>Pinned (Alt+7)</button>
            </div>
            {messageSearch ? <button className="glass-button" onClick={() => setMessageSearch('')}>Clear</button> : null}
          </div>
          <div className="stats-row glass-panel" aria-label="Chat stats">
            <span>Total: {chatStats.total}</span>
            <span>Mine: {chatStats.mine}</span>
            <span>Media: {chatStats.media}</span>
            <span>Reacted: {chatStats.reacted}</span>
            <span>Starred: {chatStats.starred}</span>
            <span>Pinned: {chatStats.pinned}</span>
          </div>
          <RoomToolbar
            room={room}
            onSendMusic={handleMusicUpdate}
            onUpdateMood={(value) => setRoomSettings((current) => ({ ...current, moodStatus: value }))}
            onUpdateMemory={(value) => setRoomSettings((current) => ({ ...current, dailyMemoryMessage: value }))}
          />
          {musicUrl ? <div className="glass-panel room-banner">Shared music: {musicUrl}</div> : null}
          {isGalleryOpen ? (
            <div className="glass-panel media-gallery">
              {mediaMessages.length ? mediaMessages.map((message) => (
                <button
                  type="button"
                  key={message._id}
                  className="gallery-item"
                  onClick={() => {
                    document.getElementById(`message-${message._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setIsGalleryOpen(false);
                  }}
                >
                  <img src={message.attachmentUrl} alt="Shared media" loading="lazy" />
                </button>
              )) : <p className="subtle">No media shared yet.</p>}
            </div>
          ) : null}
          {!visibleMessages.length ? <div className="glass-panel empty-state">No messages match your filters yet.</div> : null}
          {visibleMessages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isMine={String(message.sender?._id || message.sender) === String(user?.id)}
              onDelete={handleDelete}
              onReact={handleReact}
              onEdit={handleEdit}
              onReply={handleReply}
              onTogglePin={handleTogglePin}
              isPinned={pinnedMessageIds.includes(String(message._id))}
              onToggleStar={handleToggleStar}
              isStarred={starredMessageIds.includes(message._id)}
            />
          ))}
          {showJumpToLatest ? <button type="button" className="jump-latest" onClick={jumpToLatest}>Jump to latest</button> : null}
          {typingUserId ? <TypingIndicator text="Typing..." /> : null}
        </section>

        <section className="chat-footer">
          <div className="composer-utilities glass-panel">
            <input
              value={roomSettings.moodStatus}
              onChange={(event) => setRoomSettings((current) => ({ ...current, moodStatus: event.target.value }))}
              onBlur={saveRoomSettings}
              placeholder="Mood status"
            />
          </div>
          <ChatComposer
            value={typedMessage}
            onChange={setTypedMessage}
            onSend={editDraft ? saveEdit : () => sendMessage()}
            onTyping={handleTyping}
            onImagePick={handleImagePick}
            keyboardInset={keyboardInset}
            isEditing={Boolean(editDraft)}
          />
          {replyDraft ? (
            <div className="edit-draft-bar glass-panel">
              <span>Replying to: {replyDraft.preview || 'Message'}</span>
              <button className="glass-button" onClick={() => setReplyDraft(null)}>Cancel</button>
            </div>
          ) : null}
          {editDraft ? (
            <div className="edit-draft-bar glass-panel">
              <span>Editing message</span>
              <button className="glass-button" onClick={() => setEditDraft(null)}>Cancel</button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}