export type UserRole = 'owner' | 'admin' | 'partner' | 'member' | 'user';
export type UserUid = string;

export interface PrivacySettings {
  whoCanMessage: 'everyone' | 'friends' | 'nobody';
  whoCanAdd: 'everyone' | 'friends_of_friends' | 'nobody';
  showOnline: boolean;
  showReadReceipts: boolean;
  showLastSeen: boolean;
  whoCanSeeProfile: 'everyone' | 'friends' | 'nobody';
}

export interface UserProfile {
  uid: UserUid;
  username: string; // e.g. "naveen_dev"
  displayName: string;
  email: string;
  photoURL: string;
  bio?: string;
  role?: UserRole;
  realName?: string; // legacy support
  nickname?: string;
  petName?: string;
  city?: string;
  mood?: {
    emoji: string;
    text: string;
    updatedAt: string;
  };
  online?: boolean;
  lastSeen?: string;
  isVerified?: boolean;
  privacySettings?: PrivacySettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoryItem {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  mediaUrl?: string;
  text?: string;
  bgGradient?: string;
  createdAt: string;
}

export type AmbientEffect = 'hearts' | 'stars' | 'galaxy' | 'rain' | 'snow' | 'none';

export type ChatType = 'direct' | 'group';

export interface ChatParticipant {
  uid: UserUid;
  displayName: string;
  username: string;
  photoURL: string;
  online?: boolean;
  lastSeen?: string;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string; // For group chats
  description?: string;
  photoURL?: string;
  ownerId?: UserUid;
  admins?: UserUid[];
  participants: UserUid[];
  participantDetails?: Record<UserUid, ChatParticipant>;
  lastMessage?: string;
  lastMessageAt?: string;
  lastSenderId?: UserUid;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'location' | 'contact' | 'document';

export interface MessageReaction {
  emoji: string;
  by: UserUid[];
}

export interface Message {
  id: string;
  chatId?: string;
  senderId: UserUid;
  receiverId?: UserUid;
  type: MessageType;
  content: string; // Encrypted or plain content
  mediaUrl?: string;
  mediaName?: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: {
    id: string;
    senderId: UserUid;
    senderName?: string;
    excerpt: string;
  };
  reactions: Record<string, UserUid[]>; // emoji -> array of UIDs
  delivered: boolean;
  seen?: boolean;
  seenBy?: UserUid[];
  seenAt?: string;
  isEdited?: boolean;
  isStarred?: boolean;
  isSecret?: boolean;
  isViewOnce?: boolean;
  viewedBy?: UserUid[];
  viewedOnce?: boolean;
  deletedFor?: UserUid[];
  isDeleted?: boolean;
  pinned?: boolean;
  expiresAt?: string; // ISO timestamp for secret disappearing messages
  createdAt: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface FriendRequest {
  id: string;
  senderId: UserUid;
  senderProfile?: UserProfile;
  receiverId: UserUid;
  receiverProfile?: UserProfile;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserBlock {
  id: string;
  blockerId: UserUid;
  blockedId: UserUid;
  createdAt: string;
}

export interface UserReport {
  id: string;
  reporterId: UserUid;
  targetId: UserUid;
  targetType: 'user' | 'message' | 'group';
  reason: 'spam' | 'harassment' | 'abuse' | 'fake_account' | 'inappropriate' | 'scam' | 'other';
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export type NotificationType =
  | 'message'
  | 'friend_request'
  | 'request_accepted'
  | 'game_invite'
  | 'group_invite'
  | 'reaction'
  | 'miss_you'
  | 'kiss'
  | 'hug'
  | 'surprise';

export interface AppNotification {
  id: string;
  recipientId: UserUid;
  senderId: UserUid;
  senderProfile?: Partial<UserProfile>;
  type: NotificationType;
  data?: {
    chatId?: string;
    gameId?: string;
    gameType?: 'tictactoe' | 'rps' | 'quiz';
    groupId?: string;
    groupName?: string;
    messageText?: string;
  };
  read: boolean;
  createdAt: string;
}

export type GameType = 'tictactoe' | 'rps' | 'quiz';

export interface GameSession {
  id: string;
  gameType: GameType;
  player1Id: UserUid;
  player2Id: UserUid;
  player1Profile?: UserProfile;
  player2Profile?: UserProfile;
  status: 'pending' | 'active' | 'completed' | 'declined';
  currentTurn: UserUid;
  boardState: any;
  scores: {
    player1: number;
    player2: number;
    draws: number;
  };
  winnerId?: UserUid | 'draw' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  mediaUrls: string[];
  type: 'photo' | 'video' | 'voicenote';
  album: 'Vacations' | 'Birthdays' | 'Random' | 'Favorites' | 'Hidden';
  location?: { lat: number; lng: number; name: string };
  date: string;
  isFavorite: boolean;
  createdBy: UserUid;
  createdAt: string;
}

export interface VaultNote {
  id: string;
  title: string;
  content: string;
  unlockDate?: string;
  isLocked: boolean;
  createdBy: UserUid;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  category: 'anniversary' | 'birthday' | 'date' | 'milestone' | 'trip' | 'event';
  description?: string;
  createdBy: UserUid;
}

export type SharedListCategory = 'bucket' | 'movies' | 'travel' | 'foods' | 'wishlist';

export interface SharedListItem {
  id: string;
  title: string;
  category: SharedListCategory;
  completed: boolean;
  addedBy: UserUid;
  completedAt?: string;
}

export interface LoveMapPin {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  locationName: string;
  dateVisited?: string;
  memoryId?: string;
  isBucketList?: boolean;
}

export interface QuickActionNotification {
  id: string;
  senderId: UserUid;
  type: 'miss_you' | 'hug' | 'kiss' | 'surprise';
  timestamp: string;
  message?: string;
}
