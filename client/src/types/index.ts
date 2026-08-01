export type UserRole = 'owner' | 'partner';
export type UserUid = 'naveen_uid_798933' | 'humera_uid_140299';

export interface UserProfile {
  uid: UserUid;
  email: string;
  realName: string;
  nickname: string;
  petName: string;
  role: UserRole;
  photoURL: string;
  city: string;
  mood: {
    emoji: string;
    text: string;
    updatedAt: string;
  };
  online: boolean;
  lastSeen: string;
}

export type AmbientEffect = 'hearts' | 'stars' | 'galaxy' | 'rain' | 'snow' | 'none';

export interface RelationshipConfig {
  anniversaryDate: string; // ISO string e.g. "2024-02-14T00:00:00.000Z"
  theme: string;
  ambientEffect: AmbientEffect;
  secretChatTimeout: number; // in seconds
  vaultPinHash: string; // "1402" or "7989"
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'location' | 'contact';

export interface MessageReaction {
  emoji: string;
  by: UserUid[];
}

export interface Message {
  id: string;
  senderId: UserUid;
  type: MessageType;
  content: string; // Encrypted / plain content
  mediaUrl?: string;
  mediaName?: string;
  replyTo?: {
    id: string;
    senderId: UserUid;
    excerpt: string;
  };
  reactions: Record<string, UserUid[]>; // emoji -> array of UIDs
  delivered: boolean;
  seenAt?: string;
  isEdited?: boolean;
  isStarred?: boolean;
  isSecret?: boolean;
  expiresAt?: string; // ISO timestamp for secret disappearing messages
  createdAt: string;
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
  unlockDate?: string; // If set, locked until this ISO date
  isLocked: boolean;
  createdBy: UserUid;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: 'anniversary' | 'birthday' | 'date' | 'milestone' | 'trip';
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
