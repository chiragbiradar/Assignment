# Supabase Edge Functions for WhatsApp Clone

This document outlines the Edge Functions that can be implemented to enhance the WhatsApp clone application. Edge Functions are serverless functions that run on Supabase's edge network, allowing you to execute server-side code without managing servers.

## Prerequisites

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

4. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

## Edge Functions Implementation

### 1. Create New Chat Function

This function creates a new chat and adds participants in a single operation.

```typescript
// supabase/functions/create-chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateChatRequest {
  name?: string;
  is_group: boolean;
  participant_ids: string[];
}

serve(async (req) => {
  // Create a Supabase client with the Auth context of the logged in user
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  // Get the current user
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  try {
    const { name, is_group, participant_ids } = await req.json() as CreateChatRequest

    // Ensure the current user is included in participants
    if (!participant_ids.includes(user.id)) {
      participant_ids.push(user.id)
    }

    // Create the chat
    const { data: chat, error: chatError } = await supabaseClient
      .from('chats')
      .insert({ name, is_group })
      .select()
      .single()

    if (chatError) throw chatError

    // Add participants
    const participants = participant_ids.map(userId => ({
      chat_id: chat.id,
      user_id: userId
    }))

    const { error: participantsError } = await supabaseClient
      .from('chat_participants')
      .insert(participants)

    if (participantsError) throw participantsError

    return new Response(JSON.stringify({ chat }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### 2. Mark Messages as Read Function

This function marks all messages in a chat as read for the current user.

```typescript
// supabase/functions/mark-messages-read/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MarkMessagesReadRequest {
  chat_id: string;
}

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  try {
    const { chat_id } = await req.json() as MarkMessagesReadRequest

    // Call the database function to mark messages as read
    const { data, error } = await supabaseClient.rpc(
      'mark_messages_as_read',
      { p_chat_id: chat_id, p_user_id: user.id }
    )

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### 3. Search Messages Function

This function searches for messages across all chats the user is a participant in.

```typescript
// supabase/functions/search-messages/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SearchMessagesRequest {
  query: string;
}

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  try {
    const { query } = await req.json() as SearchMessagesRequest

    // Get all chats the user is a participant in
    const { data: userChats, error: chatsError } = await supabaseClient
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', user.id)

    if (chatsError) throw chatsError

    const chatIds = userChats.map(chat => chat.chat_id)

    if (chatIds.length === 0) {
      return new Response(JSON.stringify({ messages: [] }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Search for messages in those chats
    const { data: messages, error: messagesError } = await supabaseClient
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        chat_id,
        sender_id,
        chats (name, is_group),
        users:sender_id (full_name)
      `)
      .in('chat_id', chatIds)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (messagesError) throw messagesError

    return new Response(JSON.stringify({ messages }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

## Deploying Edge Functions

To deploy an Edge Function:

1. Create the function:
   ```bash
   supabase functions new function-name
   ```

2. Implement the function in the created directory.

3. Deploy the function:
   ```bash
   supabase functions deploy function-name
   ```

4. Set up secrets (if needed):
   ```bash
   supabase secrets set KEY=VALUE
   ```

## Invoking Edge Functions from the Frontend

```typescript
// Example of calling an Edge Function from the frontend
const createNewChat = async (name: string, isGroup: boolean, participantIds: string[]) => {
  const { data, error } = await supabase.functions.invoke('create-chat', {
    body: {
      name,
      is_group: isGroup,
      participant_ids: participantIds
    }
  });

  if (error) {
    console.error('Error creating chat:', error);
    return null;
  }

  return data.chat;
};
```

## Additional Edge Function Ideas

1. **Message Notifications**: Send push notifications when new messages are received
2. **Chat Analytics**: Track and analyze chat activity
3. **Message Translation**: Translate messages to different languages
4. **Content Moderation**: Filter inappropriate content from messages
5. **Export Chat History**: Generate and export chat history as PDF or text file
