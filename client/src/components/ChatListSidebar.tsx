import React, { useState } from 'react';
import {
  MessageCircle,
  Users,
  Search,
  Plus,
  UserPlus,
  Pin,
  AtSign,
  X,
  Sparkles
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
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'direct' | 'groups'>('all');

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
    if (activeFilterTab === 'direct' && c.type === 'group') return false;
    if (activeFilterTab === 'groups' && c.type !== 'group') return false;

    if (!filter.trim()) return true;
    const title = getChatTitle(c).toLowerCase();
    const q = filter.toLowerCase();
    return title.includes(q) || (c.lastMessage && c.lastMessage.toLowerCase().includes(q));
  });

  return (
    <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-space-950/80 border-r border-white/10 shrink-0">
      {/* Top action bar */}
      <div 
        className="p-3.5 sm:p-4 border-b border-white/10 space-y-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5 flex items-center justify-center shadow-md shadow-pink-500/20">
              <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-pink-400" />
              </div>
            </div>
            <h2 className="font-black text-white text-base tracking-tight">
              Messages
            </h2>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenCreateGroup}
              className="w-9 h-9 rounded-2xl glass-card text-cyan-300 hover:text-white hover:bg-cyan-500/20 active:scale-90 transition-all flex items-center justify-center border border-cyan-500/20 shadow-sm"
              title="New Group"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSearch}
              className="w-9 h-9 rounded-2xl bg-pink-500/20 border border-pink-500/35 text-pink-300 hover:text-white hover:bg-pink-500/30 active:scale-90 transition-all flex items-center justify-center shadow-sm shadow-pink-500/10"
              title="New Direct Chat"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search messages & people..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl glass-input text-xs font-medium placeholder:text-slate-400"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {[
            { id: 'all', label: 'All Chats' },
            { id: 'direct', label: 'Direct' },
            { id: 'groups', label: 'Groups' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                activeFilterTab === tab.id
                  ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-md shadow-pink-500/20'
                  : 'glass-card text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
                className={`p-3.5 sm:p-4 cursor-pointer flex items-center gap-3.5 transition-all active:scale-[0.99] ${
                  isActive
                    ? 'bg-pink-500/15 border-l-4 border-pink-500 shadow-inner'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shadow-md">
                    <img
                      src={avatar}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=a855f7&color=fff`;
                      }}
                    />
                  </div>
                  {online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-space-950 rounded-full shadow-sm" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-extrabold text-xs sm:text-sm text-white truncate">{title}</p>
                      {chat.type === 'group' && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-md font-extrabold shrink-0 border border-cyan-500/30">
                          Group
                        </span>
                      )}
                    </div>
                    {chat.lastMessageAt && (
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-xs text-slate-300 truncate max-w-[200px]">
                      {chat.lastMessage || subtitle}
                    </p>
                    {chat.unreadCount && chat.unreadCount > 0 ? (
                      <span className="min-w-[18px] h-4 px-1 text-[9px] font-black bg-pink-500 text-white rounded-full flex items-center justify-center shadow-md shadow-pink-500/40 animate-pulse shrink-0">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-14 px-4 text-center text-slate-400 space-y-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-xs font-bold text-white">No conversations found</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Start a new direct chat or create a group to begin connecting!</p>
            <button
              onClick={onOpenSearch}
              className="btn-love px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-pink-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Find People</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
