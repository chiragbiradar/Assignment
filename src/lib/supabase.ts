import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// These environment variables need to be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 0;

// Create a mock Supabase client for development if credentials are not available
let supabase: SupabaseClient;

if (isDevelopment && !hasValidCredentials) {
  console.warn('Using mock Supabase client for development. Please set up proper Supabase credentials for production.');

  // Create a mock implementation of the Supabase client
  const mockUser = {
    id: uuidv4(),
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User'
    }
  };

  // Store session in localStorage to persist between page refreshes
  const getStoredSession = () => {
    if (typeof window !== 'undefined') {
      try {
        const storedSession = localStorage.getItem('mockSupabaseSession');
        if (storedSession) {
          console.log("Found stored mock session");
          // Also set a cookie for middleware detection
          document.cookie = `mockSession=true; path=/; max-age=86400`;
          return JSON.parse(storedSession);
        }
        return null;
      } catch (error) {
        console.error('Error reading mock session from localStorage:', error);
        return null;
      }
    }
    return null;
  };

  const setStoredSession = (session: any) => {
    if (typeof window !== 'undefined') {
      try {
        console.log("Storing mock session:", session);
        localStorage.setItem('mockSupabaseSession', JSON.stringify(session));
        // Also set a cookie for middleware detection
        document.cookie = `mockSession=true; path=/; max-age=86400`;
      } catch (error) {
        console.error('Error storing mock session in localStorage:', error);
      }
    }
  };

  const clearStoredSession = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('mockSupabaseSession');
        // Clear the cookie
        document.cookie = 'mockSession=; path=/; max-age=0';
      } catch (error) {
        console.error('Error clearing mock session from localStorage:', error);
      }
    }
  };

  // Create a mock client with the necessary methods
  supabase = {
    auth: {
      getSession: async () => {
        const storedSession = getStoredSession();
        return {
          data: {
            session: storedSession
          },
          error: null
        };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        console.log("Mock signInWithPassword called with:", email);
        // Simple validation for demo purposes
        if (email && password) {
          // Create a more complete mock user with the provided email
          const user = {
            ...mockUser,
            email: email,
            user_metadata: {
              full_name: email.split('@')[0] // Use part of email as name
            }
          };

          const session = {
            user: user,
            access_token: 'mock-token-' + Date.now(), // Make token unique
            refresh_token: 'mock-refresh-token-' + Date.now(),
            expires_at: Date.now() + 3600 * 24 * 1000 // 24 hours from now
          };

          console.log("Creating mock session for user:", user.email);
          setStoredSession(session);

          // Force a small delay to simulate network request
          await new Promise(resolve => setTimeout(resolve, 500));

          return { data: { user, session }, error: null };
        }
        return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
      },
      signUp: async ({ email, password, options }: any) => {
        if (email && password) {
          return { data: { user: mockUser }, error: null };
        }
        return { data: { user: null }, error: { message: 'Invalid signup data' } };
      },
      signOut: async () => {
        console.log("Mock signOut called");
        clearStoredSession();
        return { error: null };
      },
      onAuthStateChange: async (callback: any) => {
        // Return a mock subscription
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    from: (table: string) => ({
      select: (query?: string) => ({
        eq: (column: string, value: any) => {
          console.log(`Mock query: SELECT ${query || '*'} FROM ${table} WHERE ${column} = ${value}`);

          // Return mock data for chat_participants
          if (table === 'chat_participants' && column === 'user_id') {
            // Use the current URL to extract the chat ID if available
            let currentChatId = '';
            if (typeof window !== 'undefined') {
              const pathParts = window.location.pathname.split('/');
              if (pathParts.length > 2 && pathParts[1] === 'chat') {
                currentChatId = pathParts[2];
              }
            }

            const mockChatIds = [
              { chat_id: currentChatId || '11111111-1111-1111-1111-111111111111' },
              { chat_id: '22222222-2222-2222-2222-222222222222' },
              { chat_id: '33333333-3333-3333-3333-333333333333' }
            ];
            return {
              single: async () => ({ data: mockChatIds[0], error: null }),
              order: () => ({
                limit: () => ({ data: mockChatIds, error: null })
              }),
              in: () => ({ data: mockChatIds, error: null })
            };
          }

          // Return mock data for chats
          if (table === 'chats' && column === 'id') {
            const mockChat = {
              id: value,
              name: 'Mock Chat',
              is_group: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              chat_participants: [
                {
                  user: {
                    id: uuidv4(),
                    full_name: 'Roshang Artel',
                    avatar_url: null
                  }
                },
                {
                  user: {
                    id: uuidv4(),
                    full_name: 'Roshang Jio',
                    avatar_url: null
                  }
                },
                {
                  user: {
                    id: uuidv4(),
                    full_name: 'Bharat Kumar Ramesh',
                    avatar_url: null
                  }
                },
                {
                  user: {
                    id: uuidv4(),
                    full_name: 'Periskope',
                    avatar_url: null
                  }
                }
              ]
            };
            return {
              single: async () => ({ data: mockChat, error: null }),
              order: () => ({
                limit: () => ({ data: [mockChat], error: null })
              }),
              in: () => ({ data: [mockChat], error: null })
            };
          }

          // Return mock data for messages
          if (table === 'messages' && column === 'chat_id') {
            const mockMessages = [
              {
                id: uuidv4(),
                chat_id: value,
                sender_id: 'some-user-id',
                content: 'Hello, South Euna!',
                created_at: new Date(Date.now() - 3600000).toISOString(),
                is_read: true
              },
              {
                id: uuidv4(),
                chat_id: value,
                sender_id: mockUser.id,
                content: 'Hello, Livonia!',
                created_at: new Date().toISOString(),
                is_read: true
              }
            ];
            return {
              single: async () => ({ data: mockMessages[0], error: null }),
              order: () => ({
                ascending: (val: boolean) => ({ data: mockMessages, error: null })
              }),
              in: () => ({ data: mockMessages, error: null })
            };
          }

          return {
            single: async () => ({ data: null, error: null }),
            order: () => ({
              ascending: (val: boolean) => ({ data: [], error: null }),
              limit: () => ({ data: [], error: null })
            }),
            in: () => ({ data: [], error: null })
          };
        },
        order: (field: string, options?: { ascending: boolean }) => ({
          limit: () => ({ data: [], error: null }),
          ascending: (val: boolean) => ({ data: [], error: null })
        }),
        limit: () => ({ data: [], error: null }),
        single: async () => ({ data: null, error: null }),
        in: (column: string, values: any[]) => {
          console.log(`Mock query: SELECT ${query || '*'} FROM ${table} WHERE ${column} IN (${values.join(', ')})`);
          return { data: [], error: null };
        }
      }),
      insert: (data: any) => ({ data: null, error: null }),
      update: (data: any) => ({
        eq: () => ({ data: null, error: null }),
        in: () => ({ data: null, error: null })
      })
    }),
    rpc: () => ({ data: null, error: null }),
    channel: () => ({
      on: () => ({ subscribe: () => {} })
    }),
    removeChannel: () => {}
  } as unknown as SupabaseClient;
} else {
  // Create a real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
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
