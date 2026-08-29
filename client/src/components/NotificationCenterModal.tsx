import React from 'react';
import { Bell, MessageCircle, UserPlus, Gamepad2, Users, Check, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { useUniverse } from '../context/UniverseContext';
import { AppNotification } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat?: (chatId: string) => void;
  onOpenGames?: (gameId?: string) => void;
  onOpenFriends?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onSelectChat,
  onOpenGames,
  onOpenFriends
}) => {
  const { notifications, markNotificationsAsRead, respondFriendRequest } = useUniverse();

  if (!isOpen) return null;

  const handleNotificationClick = (notif: AppNotification) => {
    onClose();
    if (notif.type === 'message' && notif.data?.chatId && onSelectChat) {
      onSelectChat(notif.data.chatId);
    } else if (notif.type === 'game_invite' && onOpenGames) {
      onOpenGames(notif.data?.gameId);
    } else if ((notif.type === 'friend_request' || notif.type === 'request_accepted') && onOpenFriends) {
      onOpenFriends();
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4 text-pink-400" />;
      case 'friend_request':
      case 'request_accepted':
        return <UserPlus className="w-4 h-4 text-purple-400" />;
      case 'game_invite':
        return <Gamepad2 className="w-4 h-4 text-amber-400" />;
      case 'group_invite':
        return <Users className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-pink-400" />;
    }
  };

  const getTitle = (notif: AppNotification) => {
    const sender = notif.senderProfile?.displayName || notif.senderProfile?.username || 'Someone';
    switch (notif.type) {
      case 'message':
        return `${sender} sent you a message`;
      case 'friend_request':
        return `${sender} sent a friend request`;
      case 'request_accepted':
        return `${sender} accepted your friend request`;
      case 'game_invite':
        return `${sender} invited you to play a game! 🎮`;
      case 'group_invite':
        return `You were added to group "${notif.data?.groupName || 'Chat'}"`;
      case 'kiss':
        return `${sender} sent you a sweet kiss! 💋`;
      case 'hug':
        return `${sender} sent you a warm hug! 🤗`;
      case 'miss_you':
        return `${sender} misses you! ❤️`;
      default:
        return 'New Notification';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                <Bell className="w-4 h-4 text-pink-400" />
              </div>
              <h3 className="font-extrabold text-white text-base">Notifications</h3>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.read) && (
                <button
                  onClick={markNotificationsAsRead}
                  className="text-[10px] text-pink-300 hover:text-white font-bold flex items-center gap-1 glass-card px-2.5 py-1 rounded-xl"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-xl glass-card text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1 scrollbar-none">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-2xl glass-card border transition-all cursor-pointer flex items-center gap-3 ${
                    notif.read ? 'border-white/5 opacity-70 hover:opacity-100' : 'border-pink-500/30 bg-pink-500/5'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-white truncate">{getTitle(notif)}</p>
                    {notif.data?.messageText && (
                      <p className="text-[10px] text-slate-300 truncate mt-0.5">"{notif.data.messageText}"</p>
                    )}
                    <p className="text-[9px] text-slate-400 mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Bell className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-white">No notifications</p>
                <p className="text-xs text-slate-500">You're all caught up on new messages and alerts!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
