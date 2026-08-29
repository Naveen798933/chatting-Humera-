import React, { useState } from 'react';
import {
  MessageCircle,
  Users,
  Search,
  Plus,
  UserPlus,
  Pin,
  AtSign
} from 'lucide-react';
import { useUniverse } from '../context/UniverseContext';
import { useAuth } from '../context/AuthContext';
import { Chat } from '../types';

interface ChatListSidebarProps {
  onOpenSearch: () => void;
  onOpenCreateGroup: () => void;
  onSelectChat?: (chatId: string) => void;
}

export const ChatListSidebar: React.FC<ChatListSidebarProps> = ({
  onOpenSearch,
  onOpenCreateGroup,
  onSelectChat
}) => {
  const { currentUser } = useAuth();
  const { chats, activeChatId, setActiveChatId } = useUniverse();
  const [filter, setFilter] = useState('');

  const getChatTitle = (chat: Chat) => {
    if (chat.type === 'group') return chat.name || 'Group Chat';
    if (!currentUser) return 'Direct Chat';
    const otherUid = chat.participants.find(p => p !== currentUser.uid);
    if (otherUid && chat.participantDetails?.[otherUid]) {
      return chat.participantDetails[otherUid].displayName || `@${chat.participantDetails[otherUid].username}`;
    }
    return 'Direct Chat';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'G')}&background=a855f7&color=fff`;
    }
    if (!currentUser) return '';
    const otherUid = chat.participants.find(p => p !== currentUser.uid);
    if (otherUid && chat.participantDetails?.[otherUid]) {
      return chat.participantDetails[otherUid].photoURL;
    }
    return `https://ui-avatars.com/api/?name=Chat&background=ff70a6&color=fff`;
  };

  const getChatSubtitle = (chat: Chat) => {
    if (chat.type === 'group') {
      return `${chat.participants.length} members`;
    }
    const otherUid = chat.participants.find(p => p !== currentUser?.uid);
    if (otherUid && chat.participantDetails?.[otherUid]) {
      return `@${chat.participantDetails[otherUid].username}`;
    }
    return '';
  };

  const isChatOnline = (chat: Chat) => {
    if (chat.type === 'group') return false;
    const otherUid = chat.participants.find(p => p !== currentUser?.uid);
    if (otherUid && chat.participantDetails?.[otherUid]) {
      return chat.participantDetails[otherUid].online;
    }
    return false;
  };

  const filteredChats = chats.filter(c => {
    if (!filter.trim()) return true;
    const title = getChatTitle(c).toLowerCase();
    const q = filter.toLowerCase();
    return title.includes(q) || (c.lastMessage && c.lastMessage.toLowerCase().includes(q));
  });

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-space-950/70 border-r border-white/10 shrink-0">
      {/* Top action bar */}
      <div className="p-3.5 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-white text-base flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-400" />
            <span>Messages</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenCreateGroup}
              className="p-1.5 rounded-xl glass-card text-cyan-300 hover:text-white hover:bg-cyan-500/20 active:scale-90 transition-all"
              title="New Group"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSearch}
              className="p-1.5 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300 hover:text-white active:scale-90 transition-all"
              title="New Direct Chat"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-none">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const isActive = activeChatId === chat.id;
            const title = getChatTitle(chat);
            const avatar = getChatAvatar(chat);
            const subtitle = getChatSubtitle(chat);
            const online = isChatOnline(chat);

            return (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  if (onSelectChat) onSelectChat(chat.id);
                }}
                className={`p-3 cursor-pointer flex items-center gap-3 transition-all ${
                  isActive
                    ? 'bg-pink-500/15 border-l-4 border-pink-500 shadow-inner'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={avatar}
                    alt={title}
                    className="w-11 h-11 rounded-2xl object-cover border border-white/10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=a855f7&color=fff`;
                    }}
                  />
                  {online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-space-950 rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-bold text-xs text-white truncate">{title}</p>
                      {chat.type === 'group' && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded-md font-bold shrink-0">
                          Group
                        </span>
                      )}
                    </div>
                    {chat.lastMessageAt && (
                      <span className="text-[9px] text-slate-400 shrink-0">
                        {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] text-slate-300 truncate max-w-[180px]">
                      {chat.lastMessage || subtitle}
                    </p>
                    {chat.unreadCount && chat.unreadCount > 0 ? (
                      <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-pink-500 text-white rounded-full">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 px-4 text-center text-slate-400 space-y-3">
            <MessageCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-white">No active chats</p>
            <p className="text-[11px] text-slate-500">Find someone to message or create a group chat to get started!</p>
            <button
              onClick={onOpenSearch}
              className="btn-love px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Find People</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
