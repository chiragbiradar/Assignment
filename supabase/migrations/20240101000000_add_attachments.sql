-- Add attachment fields to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS has_attachment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Create storage bucket for attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the chat-attachments bucket
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view attachments from their chats"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM chat_participants
    WHERE user_id = auth.uid()
  )
);

-- Update the Message type in any existing functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_chat_messages') THEN
    CREATE OR REPLACE FUNCTION get_chat_messages(chat_id_param UUID)
    RETURNS TABLE (
      id UUID,
      chat_id UUID,
      sender_id UUID,
      content TEXT,
      created_at TIMESTAMPTZ,
      is_read BOOLEAN,
      has_attachment BOOLEAN,
      attachment_type TEXT,
      attachment_url TEXT,
      attachment_name TEXT,
      attachment_size INTEGER
    )
    LANGUAGE sql
    AS $$
      SELECT id, chat_id, sender_id, content, created_at, is_read, 
             has_attachment, attachment_type, attachment_url, attachment_name, attachment_size
      FROM messages
      WHERE chat_id = chat_id_param
      ORDER BY created_at ASC;
    $$;
  END IF;
END
$$;
