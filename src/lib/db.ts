import Dexie from 'dexie';
import { Chat, Message } from './supabase';

// Define a class that extends Dexie
export class ChatDatabase extends Dexie {
  // Define tables
  messages!: Dexie.Table<Message & { synced?: boolean }, string>;
  chats!: Dexie.Table<Chat, string>;

  constructor() {
    // Database name
    super('whatsappClone');

    // Define the database schema with indexes
    this.version(1).stores({
      messages: 'id, chat_id, sender_id, created_at, is_read, *synced',
      chats: 'id, name, is_group, updated_at'
    });

    // Update schema to include attachment fields
    this.version(2).stores({
      messages: 'id, chat_id, sender_id, created_at, is_read, *synced, has_attachment, attachment_type',
      chats: 'id, name, is_group, updated_at'
    });
  }
}

// Create a database instance
export const db = new ChatDatabase();

// Function to sync offline messages with Supabase when online
export async function syncOfflineMessages(supabase: any) {
  try {
    console.log('Starting to sync offline messages');

    // Get all unsynchronized messages
    // Use a filter function instead of a direct query on the boolean field
    const offlineMessages = await db.messages
      .filter(message => message.synced === false)
      .toArray();

    console.log(`Found ${offlineMessages.length} offline messages to sync`);

    if (offlineMessages.length === 0) {
      return;
    }

    // Sync each message with Supabase
    for (const msg of offlineMessages) {
      console.log(`Syncing message: ${msg.id}`);

      const { error } = await supabase
        .from('messages')
        .insert({
          id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          is_read: msg.is_read,
          has_attachment: msg.has_attachment || false,
          attachment_type: msg.attachment_type,
          attachment_url: msg.attachment_url,
          attachment_name: msg.attachment_name,
          attachment_size: msg.attachment_size
        });

      // If successfully synced, update the local record
      if (!error) {
        console.log(`Message ${msg.id} synced successfully`);
        await db.messages.update(msg.id, { synced: true });

        // Update the chat's updated_at timestamp
        const { error: updateError } = await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', msg.chat_id);

        if (updateError) {
          console.error('Error updating chat timestamp:', updateError);
        }
      } else {
        console.error(`Error syncing message ${msg.id}:`, error);
      }
    }

    console.log('Finished syncing offline messages');
  } catch (error) {
    console.error('Error syncing offline messages:', error);
  }
}

// Function to set up online/offline event listeners
export function setupOfflineSync(supabase: any) {
  // Sync messages when the device comes back online
  window.addEventListener('online', async () => {
    console.log('Device is back online, syncing pending messages');
    await syncOfflineMessages(supabase);
  });

  // Check if there are any offline messages to sync when the app starts
  if (navigator.onLine) {
    console.log('Checking for offline messages to sync on startup');
    syncOfflineMessages(supabase);
  }
}
