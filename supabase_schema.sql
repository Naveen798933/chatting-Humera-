-- ============================================================
-- Supabase Schema for Our Universe Couple Chat & Space App
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- 1. Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL DEFAULT 'humera_uid_140299_naveen_uid_798933',
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  media_url TEXT,
  reply_to JSONB,
  reactions JSONB DEFAULT '{}'::jsonb,
  delivered BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Typing & Presence Table
CREATE TABLE IF NOT EXISTS presence (
  user_id TEXT PRIMARY KEY,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE presence;

-- 4. Enable Row Level Security (RLS) with full access policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access for messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access for presence" ON presence FOR ALL USING (true) WITH CHECK (true);
