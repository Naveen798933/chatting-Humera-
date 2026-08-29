import React, { useState } from 'react';
import { Users, UserPlus, MessageCircle, Gamepad2, UserX, ShieldAlert, Check, X, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { useUniverse } from '../context/UniverseContext';
import { UserProfile } from '../types';

interface FriendsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  onStartChat: (user: UserProfile) => void;
  onStartGame?: (user: UserProfile) => void;
}

export const FriendsDrawer: React.FC<FriendsDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSearch,
  onStartChat,
  onStartGame
}) => {
  const {
    friends,
    pendingFriendRequests,
    respondFriendRequest,
    removeFriend,
    blockUser
  } = useUniverse();

  const [tab, setTab] = useState<'friends' | 'requests'>('friends');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-space-950/98 backdrop-blur-2xl border-l border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Friends &amp; Connections</h3>
                <p className="text-[10px] text-slate-400">{friends.length} active connection{friends.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl glass-card text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs + Add Friend Button */}
          <div className="py-3 flex items-center justify-between gap-2 shrink-0">
            <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold">
              <button
                onClick={() => setTab('friends')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  tab === 'friends' ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Friends ({friends.length})
              </button>
              <button
                onClick={() => setTab('requests')}
                className={`px-3 py-1.5 rounded-xl transition-all relative ${
                  tab === 'requests' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Requests
                {pendingFriendRequests.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-pink-500 text-white rounded-full font-extrabold">
                    {pendingFriendRequests.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => { onClose(); onOpenSearch(); }}
              className="px-3 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Find People</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
            {tab === 'friends' && (
              <>
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <div
                      key={friend.uid}
                      className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-pink-500/30 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={friend.photoURL}
                            alt={friend.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-white/20"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName)}&background=a855f7&color=fff`;
                            }}
                          />
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-space-950 rounded-full ${
                            friend.online ? 'bg-emerald-400' : 'bg-slate-500'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{friend.displayName}</p>
                          <p className="text-[10px] text-pink-300 font-medium truncate flex items-center gap-0.5">
                            <AtSign className="w-2.5 h-2.5" />
                            <span>{friend.username}</span>
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">
                            {friend.online ? '🟢 Online now' : friend.lastSeen ? `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}` : 'Offline'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => { onClose(); onStartChat(friend); }}
                          className="p-2 rounded-xl bg-pink-500/20 text-pink-300 hover:text-white hover:bg-pink-500/30 active:scale-90 transition-all"
                          title="Message"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        {onStartGame && (
                          <button
                            onClick={() => { onClose(); onStartGame(friend); }}
                            className="p-2 rounded-xl bg-purple-500/20 text-purple-300 hover:text-white hover:bg-purple-500/30 active:scale-90 transition-all"
                            title="Play Game"
                          >
                            <Gamepad2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => removeFriend(friend.uid)}
                          className="p-2 rounded-xl glass-card text-slate-400 hover:text-rose-400 active:scale-90 transition-all"
                          title="Remove Friend"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <Users className="w-10 h-10 text-slate-600 mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-white">No connections yet</p>
                      <p className="text-xs text-slate-500 mt-1">Discover friends by their @username to chat and play games together!</p>
                    </div>
                    <button
                      onClick={() => { onClose(); onOpenSearch(); }}
                      className="btn-love px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Search Users</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {tab === 'requests' && (
              <>
                {pendingFriendRequests.length > 0 ? (
                  pendingFriendRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl glass-card border border-amber-500/30 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.senderProfile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.senderProfile?.displayName || 'User')}&background=ff70a6&color=fff`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{req.senderProfile?.displayName || 'Someone'}</p>
                          <p className="text-[10px] text-pink-300">@{req.senderProfile?.username || 'user'}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Wants to connect with you</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => respondFriendRequest(req.id, 'accepted')}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => respondFriendRequest(req.id, 'rejected')}
                          className="flex-1 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Check className="w-10 h-10 text-emerald-400/50 mx-auto" />
                    <p className="text-sm font-semibold text-white">All caught up!</p>
                    <p className="text-xs text-slate-500">No pending friend requests.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
