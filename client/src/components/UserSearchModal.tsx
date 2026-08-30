import React, { useState, useEffect } from 'react';
import { Search, UserPlus, MessageCircle, Check, X, Shield, AtSign, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { userApi } from '../lib/api';
import { UserProfile } from '../types';
import { toast } from '../lib/toast';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUserForChat?: (user: UserProfile) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUserForChat
}) => {
  const { currentUser } = useAuth();
  const { friends, pendingFriendRequests, sendFriendRequest, startDirectChatWithUser } = useUniverse();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentReqUids, setSentReqUids] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    const q = query.trim().replace(/^@/, '');
    if (!q) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const found = await userApi.searchUsers(q, currentUser?.uid);
      setResults(found);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUser?.uid]);

  const handleSendRequest = async (targetUser: UserProfile) => {
    const ok = await sendFriendRequest(targetUser.uid);
    if (ok) {
      setSentReqUids(prev => [...prev, targetUser.uid]);
    }
  };

  const handleStartChat = async (targetUser: UserProfile) => {
    await startDirectChatWithUser(targetUser);
    onClose();
    if (onSelectUserForChat) {
      onSelectUserForChat(targetUser);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                <Search className="w-4 h-4 text-pink-400" />
              </div>
              <h3 className="font-extrabold text-white text-base">Discover & Search People</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl glass-card text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="py-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username e.g. @alex or display name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-pink-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
            {results.length > 0 ? (
              results.map((user) => {
                const isFriend = friends.some(f => f.uid === user.uid);
                const hasPending = pendingFriendRequests.some(r => r.senderId === user.uid) || sentReqUids.includes(user.uid);

                return (
                  <div
                    key={user.uid}
                    className="p-3 rounded-2xl glass-card border border-white/10 hover:border-pink-500/30 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=ff70a6&color=fff`;
                          }}
                        />
                        {user.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-space-950 rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">{user.displayName}</p>
                        <p className="text-[10px] text-pink-300 font-medium truncate flex items-center gap-0.5">
                          <AtSign className="w-2.5 h-2.5" />
                          <span>{user.username}</span>
                        </p>
                        {user.bio && (
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">{user.bio}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartChat(user)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[11px] font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>

                      {!isFriend && !hasPending && (
                        <button
                          onClick={() => handleSendRequest(user)}
                          className="p-2 rounded-xl glass-card border border-pink-500/30 text-pink-300 hover:text-white hover:bg-pink-500/20 active:scale-90 transition-all"
                          title="Add Friend"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {hasPending && (
                        <span className="text-[10px] text-amber-300 font-semibold px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          Pending
                        </span>
                      )}

                      {isFriend && (
                        <span className="text-[10px] text-emerald-300 font-semibold px-2 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Friends
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : query.trim() && !isSearching ? (
              <div className="py-10 text-center text-slate-400">
                <p className="text-sm font-semibold">No users found for "{query}"</p>
                <p className="text-xs text-slate-500 mt-1">Try searching with a different username or display name.</p>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <AtSign className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">Type a username or name to search across the platform.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
