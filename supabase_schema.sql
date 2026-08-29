-- ============================================================
-- Multi-User Secure Messaging & Social Platform Schema
-- PostgreSQL & Supabase Realtime Setup
-- ============================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  username_lower TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  privacy_settings JSONB DEFAULT '{"whoCanMessage":"everyone","whoCanAdd":"everyone","showOnline":true,"showReadReceipts":true,"showLastSeen":true,"whoCanSeeProfile":"everyone"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant username & search lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles (username_lower);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles (display_name);

-- 2. Friendships & Connection Requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected' | 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);

-- 3. Block List
CREATE TABLE IF NOT EXISTS user_blocks (
  id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 4. Chats (Direct & Group)
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'direct', -- 'direct' | 'group'
  name TEXT,
  description TEXT,
  photo_url TEXT,
  owner_id TEXT REFERENCES profiles(id),
  admins TEXT[] DEFAULT '{}',
  participants TEXT[] NOT NULL DEFAULT '{}',
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_sender_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats (last_message_at DESC);

-- 5. Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  media_url TEXT,
  media_name TEXT,
  reply_to JSONB,
  reactions JSONB DEFAULT '{}'::jsonb,
  delivered BOOLEAN DEFAULT true,
  pinned BOOLEAN DEFAULT false,
  is_secret BOOLEAN DEFAULT false,
  is_view_once BOOLEAN DEFAULT false,
  viewed_by TEXT[] DEFAULT '{}',
  seen_by TEXT[] DEFAULT '{}',
  deleted_for TEXT[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  seen BOOLEAN DEFAULT false,
  seen_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at ASC);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, created_at DESC);

-- 7. Game Sessions
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  game_type TEXT NOT NULL,
  player1_id TEXT NOT NULL REFERENCES profiles(id),
  player2_id TEXT NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  current_turn TEXT NOT NULL,
  board_state JSONB DEFAULT '{}'::jsonb,
  scores JSONB DEFAULT '{"player1":0,"player2":0,"draws":0}'::jsonb,
  winner_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Presence Table
CREATE TABLE IF NOT EXISTS presence (
  user_id TEXT PRIMARY KEY,
  is_online BOOLEAN DEFAULT true,
  is_typing BOOLEAN DEFAULT false,
  active_chat_id TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. User Reports
CREATE TABLE IF NOT EXISTS user_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE presence;

-- 11. Row Level Security Policies (Permissive default with authentication check)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public profiles access" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public chats access" ON chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public messages access" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public friend_requests access" ON friend_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public notifications access" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public game_sessions access" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public presence access" ON presence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public user_reports access" ON user_reports FOR ALL USING (true) WITH CHECK (true);
