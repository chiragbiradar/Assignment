-- WhatsApp Clone - Complete Supabase Setup Script
-- Run this in the Supabase SQL Editor to set up all required database objects

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE CREATION
-- =============================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Create chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat labels table
CREATE TABLE IF NOT EXISTS chat_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, label_id)
);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp on chats table
CREATE TRIGGER update_chats_updated_at
BEFORE UPDATE ON chats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a user record when a new auth user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_chat_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = TRUE
  WHERE 
    chat_id = p_chat_id AND 
    sender_id != p_user_id AND 
    is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_labels ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of chat participants"
ON users FOR SELECT
USING (
  id IN (
    SELECT user_id FROM chat_participants
    WHERE chat_id IN (
      SELECT chat_id FROM chat_participants
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Create policies for chats table
CREATE POLICY "Users can view chats they are participants in"
ON chats FOR SELECT
USING (
  id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create chats"
ON chats FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update chats they are participants in"
ON chats FOR UPDATE
USING (
  id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

-- Create policies for messages table
CREATE POLICY "Users can view messages in chats they are participants in"
ON messages FOR SELECT
USING (
  chat_id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in chats they are participants in"
ON messages FOR INSERT
WITH CHECK (
  chat_id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  ) AND sender_id = auth.uid()
);

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid());

-- Create policies for chat_participants table
CREATE POLICY "Users can view participants of chats they are in"
ON chat_participants FOR SELECT
USING (
  chat_id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to chats they are in"
ON chat_participants FOR INSERT
WITH CHECK (
  chat_id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove participants from chats they are in"
ON chat_participants FOR DELETE
USING (
  chat_id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

-- Create policies for labels table
CREATE POLICY "Users can view all labels"
ON labels FOR SELECT
USING (true);

CREATE POLICY "Users can create labels"
ON labels FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own labels"
ON labels FOR UPDATE
USING (
  id IN (
    SELECT label_id FROM chat_labels
    WHERE chat_id IN (
      SELECT chat_id FROM chat_participants
      WHERE user_id = auth.uid()
    )
  )
);

-- Create policies for chat_labels table
CREATE POLICY "Users can view labels of chats they are in"
ON chat_labels FOR SELECT
USING (
  chat_id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add labels to chats they are in"
ON chat_labels FOR INSERT
WITH CHECK (
  chat_id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove labels from chats they are in"
ON chat_labels FOR DELETE
USING (
  chat_id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

-- =============================================
-- REALTIME CONFIGURATION
-- =============================================

-- Enable realtime for messages table
BEGIN;
  -- Drop the publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create a new publication for all tables
  CREATE PUBLICATION supabase_realtime FOR TABLE messages, chats, chat_participants;
COMMIT;

-- =============================================
-- SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert sample labels
INSERT INTO labels (id, name, color) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Internal', '#4CAF50'),
  ('22222222-2222-2222-2222-222222222222', 'Demo', '#FFC107'),
  ('33333333-3333-3333-3333-333333333333', 'Urgent', '#F44336'),
  ('44444444-4444-4444-4444-444444444444', 'Content', '#2196F3'),
  ('55555555-5555-5555-5555-555555555555', 'Signup', '#9C27B0');

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_labels_chat_id ON chat_labels(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_labels_label_id ON chat_labels(label_id);
