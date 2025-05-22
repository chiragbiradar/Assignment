import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Always use mock data since we're removing authentication
const useMockAuth = true;

// Create a default user ID that will be used throughout the application
export const DEFAULT_USER_ID = uuidv4();
export const DEFAULT_USER = {
  id: DEFAULT_USER_ID,
  email: 'default@example.com',
  user_metadata: {
    full_name: 'Default User'
  }
};

// Create a mock Supabase client
let supabase: SupabaseClient;

if (useMockAuth) {
  console.warn('Using mock Supabase client for development. Please set up proper Supabase credentials for production.');

  // Create a default session that will always be returned
  const defaultSession = {
    user: DEFAULT_USER,
    access_token: 'default-token',
    refresh_token: 'default-refresh-token',
    expires_at: Date.now() + 3600 * 24 * 1000 // 24 hours from now
  };

  // Store session in localStorage to persist data between page refreshes
  const getStoredData = (key: string, defaultValue: any) => {
    if (typeof window !== 'undefined') {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          return JSON.parse(storedData);
        }
        return defaultValue;
      } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        return defaultValue;
      }
    }
    return defaultValue;
  };

  const setStoredData = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error(`Error storing ${key} in localStorage:`, error);
      }
    }
  };

  // Initialize mock chats with the default user
  const initializeMockChats = () => {
    if (typeof window !== 'undefined') {
      try {
        const existingChatsJson = localStorage.getItem('mockChats');
        if (!existingChatsJson) {
          // Create default chats
          const defaultChats = [
            {
              id: '1',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              updated_at: new Date().toISOString(),
              last_message: 'Hello, how are you?',
              last_message_at: new Date().toISOString(),
              is_group: false,
              name: null,
              creator_id: DEFAULT_USER_ID,
              participants: [
                {
                  user_id: DEFAULT_USER_ID,
                  chat_id: '1',
                  joined_at: new Date(Date.now() - 86400000).toISOString(),
                  user: {
                    id: DEFAULT_USER_ID,
                    email: DEFAULT_USER.email,
                    full_name: DEFAULT_USER.user_metadata.full_name,
                    avatar_url: null
                  }
                },
                {
                  user_id: 'other-user-1',
                  chat_id: '1',
                  joined_at: new Date(Date.now() - 86400000).toISOString(),
                  user: {
                    id: 'other-user-1',
                    email: 'south.euna@example.com',
                    full_name: 'South Euna',
                    avatar_url: null
                  }
                }
              ]
            },
            {
              id: '2',
              created_at: new Date(Date.now() - 172800000).toISOString(),
              updated_at: new Date(Date.now() - 3600000).toISOString(),
              last_message: 'Meeting at 3pm',
              last_message_at: new Date(Date.now() - 3600000).toISOString(),
              is_group: true,
              name: 'Project Team',
              creator_id: DEFAULT_USER_ID,
              participants: [
                {
                  user_id: DEFAULT_USER_ID,
                  chat_id: '2',
                  joined_at: new Date(Date.now() - 172800000).toISOString(),
                  user: {
                    id: DEFAULT_USER_ID,
                    email: DEFAULT_USER.email,
                    full_name: DEFAULT_USER.user_metadata.full_name,
                    avatar_url: null
                  }
                },
                {
                  user_id: 'other-user-2',
                  chat_id: '2',
                  joined_at: new Date(Date.now() - 172800000).toISOString(),
                  user: {
                    id: 'other-user-2',
                    email: 'roshang.jio@example.com',
                    full_name: 'Roshang Jio',
                    avatar_url: null
                  }
                },
                {
                  user_id: 'other-user-3',
                  chat_id: '2',
                  joined_at: new Date(Date.now() - 172800000).toISOString(),
                  user: {
                    id: 'other-user-3',
                    email: 'bharat.ramesh@example.com',
                    full_name: 'Bharat Kumar Ramesh',
                    avatar_url: null
                  }
                }
              ]
            }
          ];

          localStorage.setItem('mockChats', JSON.stringify(defaultChats));
          console.log('Initialized default mock chats');
        }
      } catch (error) {
        console.error('Error initializing mock chats:', error);
      }
    }
  };

  // Initialize mock data
  initializeMockChats();

  // Create a mock client with the necessary methods
  supabase = {
    auth: {
      getSession: async () => {
        // Always return the default session
        return {
          data: {
            session: defaultSession
          },
          error: null
        };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        console.log("Mock signInWithPassword called - always returns default user");
        // Always return the default user
        return {
          data: {
            user: DEFAULT_USER,
            session: defaultSession
          },
          error: null
        };
      },
      signUp: async ({ email, password, options }: any) => {
        console.log("Mock signUp called - always returns default user");
        return { data: { user: DEFAULT_USER }, error: null };
      },
      signOut: async () => {
        console.log("Mock signOut called - no effect in no-auth mode");
        return { error: null };
      },
      onAuthStateChange: async (callback: any) => {
        // Immediately trigger the callback with the default session
        setTimeout(() => {
          callback('SIGNED_IN', { session: defaultSession });
        }, 0);

        // Return a mock subscription
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      updateUser: async () => {
        return { data: { user: DEFAULT_USER }, error: null };
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
            try {
              // Try to get messages from localStorage first
              const storedMessagesJson = localStorage.getItem('mockMessages');
              let messages = [];

              if (storedMessagesJson) {
                const allMessages = JSON.parse(storedMessagesJson);
                // Filter messages for this chat
                messages = allMessages.filter((msg: any) => msg.chat_id === value);
                console.log(`Found ${messages.length} stored messages for chat ${value}`);
              }

              // If no stored messages, use default mock messages
              if (messages.length === 0) {
                console.log(`No stored messages found for chat ${value}, using default mock messages`);
                messages = [
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
                    sender_id: DEFAULT_USER_ID,
                    content: 'Hello, Livonia!',
                    created_at: new Date().toISOString(),
                    is_read: true
                  }
                ];

                // Store these default messages
                const existingMessagesJson = localStorage.getItem('mockMessages') || '[]';
                const existingMessages = JSON.parse(existingMessagesJson);
                localStorage.setItem('mockMessages', JSON.stringify([...existingMessages, ...messages]));
              }

              // Sort messages by created_at
              messages.sort((a: any, b: any) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );

              return {
                single: async () => ({ data: messages[0] || null, error: null }),
                order: () => ({
                  ascending: (val: boolean) => {
                    // Sort based on ascending flag
                    const sortedMessages = [...messages].sort((a: any, b: any) => {
                      const aTime = new Date(a.created_at).getTime();
                      const bTime = new Date(b.created_at).getTime();
                      return val ? aTime - bTime : bTime - aTime;
                    });
                    return { data: sortedMessages, error: null };
                  }
                }),
                in: () => ({ data: messages, error: null })
              };
            } catch (error) {
              console.error('Error retrieving messages from localStorage:', error);
              // Fallback to default behavior
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
                  sender_id: DEFAULT_USER_ID,
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
      insert: (data: any) => {
        console.log(`Mock insert into ${table}:`, data);

        // Handle message insertion
        if (table === 'messages') {
          try {
            // Get existing messages from localStorage
            const existingMessagesJson = localStorage.getItem('mockMessages') || '[]';
            const existingMessages = JSON.parse(existingMessagesJson);

            // Add the new message
            const newMessages = Array.isArray(data) ? [...existingMessages, ...data] : [...existingMessages, data];

            // Save back to localStorage
            localStorage.setItem('mockMessages', JSON.stringify(newMessages));

            // Trigger the realtime subscription if it exists
            if (typeof window !== 'undefined' && (window as any).__mockSupabaseChannels) {
              const channelKeys = Object.keys((window as any).__mockSupabaseChannels);
              for (const key of channelKeys) {
                if (key.includes(`chat:${data.chat_id}`)) {
                  const channel = (window as any).__mockSupabaseChannels[key];
                  if (channel && channel.callback) {
                    // Simulate a small delay for realism
                    setTimeout(() => {
                      channel.callback({
                        new: data,
                        eventType: 'INSERT',
                        schema: 'public',
                        table: 'messages'
                      });
                    }, 300);
                  }
                }
              }
            }

            console.log('Message stored in mock database:', data);
            return { data, error: null };
          } catch (error) {
            console.error('Error storing message in mock database:', error);
            return { data: null, error: { message: 'Error storing message' } };
          }
        }

        // Handle chat updates
        if (table === 'chats') {
          try {
            // Get existing chats from localStorage
            const existingChatsJson = localStorage.getItem('mockChats') || '[]';
            const existingChats = JSON.parse(existingChatsJson);

            // Add or update the chat
            const chatIndex = existingChats.findIndex((c: any) => c.id === data.id);
            if (chatIndex >= 0) {
              existingChats[chatIndex] = { ...existingChats[chatIndex], ...data };
            } else {
              existingChats.push(data);
            }

            // Save back to localStorage
            localStorage.setItem('mockChats', JSON.stringify(existingChats));

            console.log('Chat stored in mock database:', data);
            return { data, error: null };
          } catch (error) {
            console.error('Error storing chat in mock database:', error);
            return { data: null, error: { message: 'Error storing chat' } };
          }
        }

        // Default behavior for other tables
        return { data, error: null };
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => {
          console.log(`Mock update in ${table} where ${column} = ${value}:`, data);

          // Handle message updates (e.g., marking as read)
          if (table === 'messages') {
            try {
              // Get existing messages from localStorage
              const existingMessagesJson = localStorage.getItem('mockMessages') || '[]';
              const existingMessages = JSON.parse(existingMessagesJson);

              // Find and update the message
              const updatedMessages = existingMessages.map((msg: any) => {
                if (msg[column] === value) {
                  return { ...msg, ...data };
                }
                return msg;
              });

              // Save back to localStorage
              localStorage.setItem('mockMessages', JSON.stringify(updatedMessages));

              console.log(`Updated message in mock database where ${column} = ${value}`);
              return { data, error: null };
            } catch (error) {
              console.error('Error updating message in mock database:', error);
              return { data: null, error: { message: 'Error updating message' } };
            }
          }

          // Handle chat updates
          if (table === 'chats') {
            try {
              // Get existing chats from localStorage
              const existingChatsJson = localStorage.getItem('mockChats') || '[]';
              const existingChats = JSON.parse(existingChatsJson);

              // Find and update the chat
              const updatedChats = existingChats.map((chat: any) => {
                if (chat[column] === value) {
                  return { ...chat, ...data };
                }
                return chat;
              });

              // Save back to localStorage
              localStorage.setItem('mockChats', JSON.stringify(updatedChats));

              console.log(`Updated chat in mock database where ${column} = ${value}`);
              return { data, error: null };
            } catch (error) {
              console.error('Error updating chat in mock database:', error);
              return { data: null, error: { message: 'Error updating chat' } };
            }
          }

          // Default behavior for other tables
          return { data, error: null };
        },
        in: (column: string, values: any[]) => {
          console.log(`Mock update in ${table} where ${column} in [${values.join(', ')}]:`, data);

          // Handle message updates (e.g., marking multiple messages as read)
          if (table === 'messages') {
            try {
              // Get existing messages from localStorage
              const existingMessagesJson = localStorage.getItem('mockMessages') || '[]';
              const existingMessages = JSON.parse(existingMessagesJson);

              // Find and update the messages
              const updatedMessages = existingMessages.map((msg: any) => {
                if (values.includes(msg[column])) {
                  return { ...msg, ...data };
                }
                return msg;
              });

              // Save back to localStorage
              localStorage.setItem('mockMessages', JSON.stringify(updatedMessages));

              console.log(`Updated messages in mock database where ${column} in [${values.join(', ')}]`);
              return { data, error: null };
            } catch (error) {
              console.error('Error updating messages in mock database:', error);
              return { data: null, error: { message: 'Error updating messages' } };
            }
          }

          // Default behavior for other tables
          return { data, error: null };
        }
      })
    }),
    rpc: () => ({ data: null, error: null }),
    channel: (channelName: string) => {
      console.log(`Creating mock channel: ${channelName}`);
      return {
        on: (event: string, filter: any, callback: (payload: any) => void) => {
          console.log(`Subscribing to ${event} on channel ${channelName}`);
          // Store the callback in a global registry so we can trigger it manually for testing
          if (typeof window !== 'undefined') {
            (window as any).__mockSupabaseChannels = (window as any).__mockSupabaseChannels || {};
            (window as any).__mockSupabaseChannels[channelName] = {
              event,
              filter,
              callback
            };
          }
          return {
            subscribe: () => {
              console.log(`Subscribed to ${event} on channel ${channelName}`);
              return {};
            }
          };
        }
      };
    },
    removeChannel: (channel: any) => {
      console.log('Removing mock channel');
      // Clean up the channel from our registry
      if (typeof window !== 'undefined' && (window as any).__mockSupabaseChannels) {
        const channelKeys = Object.keys((window as any).__mockSupabaseChannels);
        for (const key of channelKeys) {
          if (key.includes(channel)) {
            delete (window as any).__mockSupabaseChannels[key];
          }
        }
      }
    }
  } as unknown as SupabaseClient;
} else {
  // Create a real Supabase client - this shouldn't throw errors during initialization
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  // Add helper methods to the client
  (supabase as any).isMockAuth = () => useMockAuth;

  // Method to switch to mock auth
  (supabase as any).switchToMockAuth = () => {
    if (useMockAuth) return; // Already using mock auth

    console.warn('Switching to mock authentication due to connection issues');
    useMockAuth = true;

    // Store a flag in localStorage to persist this decision
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('useMockAuth', 'true');
      } catch (e) {
        console.error('Failed to store mock auth preference:', e);
      }
    }
  };

  // Check if we previously decided to use mock auth
  if (typeof window !== 'undefined') {
    try {
      const storedMockAuth = localStorage.getItem('useMockAuth');
      if (storedMockAuth === 'true') {
        console.log('Using mock authentication based on stored preference');
        useMockAuth = true;
      }
    } catch (e) {
      console.error('Failed to read mock auth preference:', e);
    }
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
