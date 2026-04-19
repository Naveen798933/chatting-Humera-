import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
  const { isAuthenticated, user, room, setRoom, logout, updateProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [editDraft, setEditDraft] = useState(null);
  const [typingUserId, setTypingUserId] = useState('');
  const [partnerViewing, setPartnerViewing] = useState(false);
  const [presence, setPresence] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [roomSettings, setRoomSettings] = useState({ moodStatus: '', dailyMemoryMessage: '', themeMode: 'night-romantic' });
  const [musicUrl, setMusicUrl] = useState('');
  const scrollRef = useRef(null);
  const keyboardInset = useKeyboardInset();
  const socket = getSocket();

  useEffect(() => {
    if (!room?._id) return;
    async function loadRoom() {
      const { data } = await api.get(`/rooms/${room._id}`);
      setRoom(data.room);
      setMessages(data.messages.map((message) => ({ ...message, plainText: message.plainText || message.text || '' })));
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

    socket.on('message:new', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('presence:update', handlePresence);
    socket.on('message:seen', handleSeen);
    socket.on('reaction:update', handleReaction);
    socket.on('mood:update', handleMood);
    socket.on('room:viewing', handleViewing);
    socket.on('message:update', handleUpdate);
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const partner = useMemo(() => room?.members?.find((member) => member._id !== user?.id), [room?.members, user?.id]);

  if (!isAuthenticated && !localStorage.getItem('lovechat_token')) {
    return <Navigate to="/login" replace />;
  }

  async function sendMessage(imageUrl = '') {
    if (!typedMessage.trim() && !imageUrl) return;
    socket?.emit('message:send', {
      roomId: room._id,
      text: typedMessage,
      messageType: imageUrl ? 'image' : 'text',
      attachmentUrl: imageUrl
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
  }

  function handleEdit(message) {
    setEditDraft({ messageId: message._id, text: message.plainText || '' });
  }

  function handleReact(messageId, reaction) {
    socket?.emit('reaction:add', { roomId: room._id, messageId, reaction });
  }

  async function saveRoomSettings() {
    const { data } = await api.put(`/rooms/${room._id}/settings`, roomSettings);
    setRoom(data.room);
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    await updateProfile(formData);
  }

  if (!room) {
    return <div className="loading-screen">Loading private room...</div>;
  }

  const visibleMessages = messages.filter((message) => {
    if (!messageSearch.trim()) return true;
    const haystack = `${message.plainText || ''} ${message.senderNickname || ''} ${message.reaction || ''}`.toLowerCase();
    return haystack.includes(messageSearch.toLowerCase());
  });

  return (
    <div className={`chat-shell ${theme}`}>
      <div className="floating-bg" />
      <Sidebar
        user={user}
        room={room}
        onOpenProfile={() => setMobileMenuOpen(true)}
        onOpenRoom={() => setMobileMenuOpen(true)}
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
            <button className="glass-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
            <button className="glass-button" onClick={logout}>Logout</button>
          </div>
        </motion.header>

        <LiveCursorLayer />

        <section className="chat-body" ref={scrollRef}>
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
            <input value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Search messages, names, reactions" />
            {messageSearch ? <button className="glass-button" onClick={() => setMessageSearch('')}>Clear</button> : null}
          </div>
          <RoomToolbar
            room={room}
            onSendMusic={handleMusicUpdate}
            onUpdateMood={(value) => setRoomSettings((current) => ({ ...current, moodStatus: value }))}
            onUpdateMemory={(value) => setRoomSettings((current) => ({ ...current, dailyMemoryMessage: value }))}
          />
          {musicUrl ? <div className="glass-panel room-banner">Shared music: {musicUrl}</div> : null}
          {visibleMessages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isMine={String(message.sender?._id || message.sender) === String(user?.id)}
              onDelete={handleDelete}
              onReact={handleReact}
              onEdit={handleEdit}
            />
          ))}
          {typingUserId ? <TypingIndicator text="Typing..." /> : null}
        </section>

        <section className="chat-footer">
          <div className="composer-utilities glass-panel">
            <label>
              Avatar upload
              <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            </label>
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
          />
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