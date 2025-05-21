import Dexie from 'dexie';
import { Chat, Message } from './supabase';

// Define a class that extends Dexie
export class ChatDatabase extends Dexie {
  // Define tables
  messages!: Dexie.Table<Message & { synced?: boolean }, string>;
  chats!: Dexie.Table<Chat, string>;
  
  constructor() {
    // Database name
    super('WhatsAppClone');
    
    // Define the database schema with indexes
    this.version(1).stores({
      messages: 'id, chat_id, sender_id, content, created_at, is_read, synced',
      chats: 'id, name, is_group, updated_at'
    });
  }
}

// Create a database instance
export const db = new ChatDatabase();

// Function to sync offline messages with Supabase when online
export async function syncOfflineMessages(supabase: any) {
  try {
    // Get all unsynchronized messages
    const offlineMessages = await db.messages
      .where('synced')
      .equals(false)
      .toArray();
    
    // Sync each message with Supabase
    for (const msg of offlineMessages) {
      const { error } = await supabase
        .from('messages')
        .insert({
          id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          is_read: msg.is_read
        });
      
      // If successfully synced, update the local record
      if (!error) {
        await db.messages.update(msg.id, { synced: true });
      }
    }
  } catch (error) {
    console.error('Error syncing offline messages:', error);
  }
}
