-- Periskope Clone - Sample Data for Testing
-- Run this script after setting up the database structure to populate it with test data

-- Sample Users
-- Note: These users need to exist in auth.users first
-- You should create these users through the authentication system
-- Then use their actual UUIDs in this script

-- For testing purposes, we'll use placeholder UUIDs
-- Replace these with actual UUIDs after creating the users
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111'; -- Replace with actual UUID
  user2_id UUID := '22222222-2222-2222-2222-222222222222'; -- Replace with actual UUID
  user3_id UUID := '33333333-3333-3333-3333-333333333333'; -- Replace with actual UUID
  user4_id UUID := '44444444-4444-4444-4444-444444444444'; -- Replace with actual UUID
  user5_id UUID := '55555555-5555-5555-5555-555555555555'; -- Replace with actual UUID
  
  chat1_id UUID;
  chat2_id UUID;
  chat3_id UUID;
  chat4_id UUID;
  chat5_id UUID;
  chat6_id UUID;
  chat7_id UUID;
  chat8_id UUID;
  chat9_id UUID;
  chat10_id UUID;
  
  label1_id UUID;
  label2_id UUID;
  label3_id UUID;
  label4_id UUID;
  label5_id UUID;
BEGIN
  -- Insert sample users (if they don't exist in the public.users table)
  -- In a real scenario, these would be created by the auth trigger
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES
    (user1_id, 'user1@example.com', 'Roshang Artel', NULL)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES
    (user2_id, 'user2@example.com', 'Periskope', NULL)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES
    (user3_id, 'user3@example.com', 'Test Skope Final', NULL)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES
    (user4_id, 'user4@example.com', 'Test El Centro', NULL)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES
    (user5_id, 'user5@example.com', 'Testing Group', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Insert sample labels
  INSERT INTO labels (id, name, color)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Internal', '#4CAF50'),
    ('22222222-2222-2222-2222-222222222222', 'Demo', '#FFC107'),
    ('33333333-3333-3333-3333-333333333333', 'Urgent', '#F44336'),
    ('44444444-4444-4444-4444-444444444444', 'Content', '#2196F3'),
    ('55555555-5555-5555-5555-555555555555', 'Signup', '#9C27B0')
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO label1_id, label2_id, label3_id, label4_id, label5_id;

  -- Create sample chats
  -- Chat 1: Test El Centro (Group)
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('Test El Centro', TRUE, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day')
  RETURNING id INTO chat1_id;
  
  -- Chat 2: Test Skope Final
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('Test Skope Final 5', FALSE, NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days')
  RETURNING id INTO chat2_id;
  
  -- Chat 3: Periskope Team Chat (Group)
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('Periskope Team Chat', TRUE, NOW() - INTERVAL '30 days', NOW() - INTERVAL '3 days')
  RETURNING id INTO chat3_id;
  
  -- Chat 4: +91 99999 99999
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('+91 99999 99999', FALSE, NOW() - INTERVAL '40 days', NOW() - INTERVAL '4 days')
  RETURNING id INTO chat4_id;
  
  -- Chat 5: Test Demo17
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('Test Demo17', FALSE, NOW() - INTERVAL '50 days', NOW() - INTERVAL '5 days')
  RETURNING id INTO chat5_id;
  
  -- Chat 6: Test El Centro (Direct)
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('Test El Centro', FALSE, NOW() - INTERVAL '60 days', NOW() - INTERVAL '6 days')
  RETURNING id INTO chat6_id;
  
  -- Chat 7: Testing group
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('Testing group', TRUE, NOW() - INTERVAL '70 days', NOW() - INTERVAL '7 days')
  RETURNING id INTO chat7_id;
  
  -- Chat 8: Yasin 3
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('Yasin 3', FALSE, NOW() - INTERVAL '80 days', NOW() - INTERVAL '8 days')
  RETURNING id INTO chat8_id;
  
  -- Chat 9: Test Skope Final 9473
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('Test Skope Final 9473', FALSE, NOW() - INTERVAL '90 days', NOW() - INTERVAL '9 days')
  RETURNING id INTO chat9_id;
  
  -- Chat 10: Skope Demo
  INSERT INTO chats (name, is_group, created_at, updated_at)
  VALUES ('Skope Demo', FALSE, NOW() - INTERVAL '100 days', NOW() - INTERVAL '10 days')
  RETURNING id INTO chat10_id;

  -- Add participants to chats
  -- Chat 1: Test El Centro (Group)
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat1_id, user1_id),
    (chat1_id, user2_id),
    (chat1_id, user3_id),
    (chat1_id, user4_id);
  
  -- Chat 2: Test Skope Final
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat2_id, user1_id),
    (chat2_id, user3_id);
  
  -- Chat 3: Periskope Team Chat (Group)
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat3_id, user1_id),
    (chat3_id, user2_id),
    (chat3_id, user3_id),
    (chat3_id, user4_id),
    (chat3_id, user5_id);
  
  -- Chat 4: +91 99999 99999
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat4_id, user1_id),
    (chat4_id, user2_id);
  
  -- Chat 5: Test Demo17
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat5_id, user1_id),
    (chat5_id, user3_id);
  
  -- Chat 6: Test El Centro (Direct)
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat6_id, user1_id),
    (chat6_id, user4_id);
  
  -- Chat 7: Testing group
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat7_id, user1_id),
    (chat7_id, user2_id),
    (chat7_id, user5_id);
  
  -- Chat 8: Yasin 3
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat8_id, user1_id),
    (chat8_id, user3_id);
  
  -- Chat 9: Test Skope Final 9473
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat9_id, user1_id),
    (chat9_id, user3_id);
  
  -- Chat 10: Skope Demo
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (chat10_id, user1_id),
    (chat10_id, user2_id);

  -- Add labels to chats
  INSERT INTO chat_labels (chat_id, label_id)
  VALUES
    (chat3_id, label1_id),  -- Periskope Team Chat - Internal
    (chat4_id, label2_id),  -- +91 99999 99999 - Demo
    (chat4_id, label5_id),  -- +91 99999 99999 - Signup
    (chat5_id, label2_id),  -- Test Demo17 - Demo
    (chat5_id, label4_id),  -- Test Demo17 - Content
    (chat6_id, label2_id),  -- Test El Centro - Demo
    (chat7_id, label2_id),  -- Testing group - Demo
    (chat8_id, label2_id),  -- Yasin 3 - Demo
    (chat8_id, label3_id),  -- Yasin 3 - Urgent
    (chat9_id, label2_id),  -- Test Skope Final 9473 - Demo
    (chat10_id, label2_id); -- Skope Demo - Demo

  -- Add sample messages
  -- Chat 1: Test El Centro (Group)
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat1_id, user1_id, 'Hello, South Euna!', NOW() - INTERVAL '1 day 8 hours', TRUE),
    (chat1_id, user4_id, 'CDERT', NOW() - INTERVAL '1 day 7 hours', TRUE),
    (chat1_id, user1_id, 'CVERT', NOW() - INTERVAL '1 day 6 hours', TRUE);
  
  -- Chat 2: Test Skope Final
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat2_id, user3_id, 'Support? This doesn''t go on Tuesday...', NOW() - INTERVAL '2 days 12 hours', TRUE);
  
  -- Chat 3: Periskope Team Chat
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat3_id, user2_id, 'Periskope: Test message', NOW() - INTERVAL '3 days 8 hours', TRUE);
  
  -- Chat 4: +91 99999 99999
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat4_id, user2_id, 'Hi there, I''m Swapnika, Co-Founder of...', NOW() - INTERVAL '4 days 10 hours', TRUE);
  
  -- Chat 5: Test Demo17
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat5_id, user3_id, 'Rohosen 123', NOW() - INTERVAL '5 days 9 hours', TRUE);
  
  -- Chat 6: Test El Centro (Direct)
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat6_id, user4_id, 'Roshang Hello, Ahmadpur!!', NOW() - INTERVAL '6 days 8 hours', TRUE),
    (chat6_id, user1_id, 'Hello, Livonia!', NOW() - INTERVAL '6 days 6 hours', TRUE);
  
  -- Chat 7: Testing group
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat7_id, user5_id, 'Testing 12345', NOW() - INTERVAL '7 days 12 hours', TRUE),
    (chat7_id, user2_id, 'test el centro', NOW() - INTERVAL '7 days 2 hours', TRUE);
  
  -- Chat 8: Yasin 3
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat8_id, user3_id, 'First Bulk Message', NOW() - INTERVAL '8 days 14 hours', TRUE),
    (chat8_id, user1_id, 'CDERT', NOW() - INTERVAL '8 days 8 hours', TRUE);
  
  -- Chat 9: Test Skope Final 9473
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat9_id, user3_id, 'Heyy', NOW() - INTERVAL '9 days 10 hours', TRUE),
    (chat9_id, user2_id, 'testing', NOW() - INTERVAL '9 days 2 hours', TRUE);
  
  -- Chat 10: Skope Demo
  INSERT INTO messages (chat_id, sender_id, content, created_at, is_read)
  VALUES
    (chat10_id, user2_id, 'test 123', NOW() - INTERVAL '10 days 8 hours', TRUE);

END $$;
