import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// For backward compatibility with existing code
export const DEFAULT_USER_ID = '';
export const DEFAULT_USER = {
  id: '',
  email: '',
  user_metadata: {
    full_name: ''
  }
};

// Helper function to get the current user ID
export async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || '';
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return '';
  }
}

// Helper function to get the current user
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export { supabase };

// Types for our database tables
export type User = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
};

export type Chat = {
  id: string;
  name?: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  has_attachment?: boolean;
  attachment_type?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
};

export type ChatParticipant = {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
};

export type Label = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type ChatLabel = {
  id: string;
  chat_id: string;
  label_id: string;
  created_at: string;
};
