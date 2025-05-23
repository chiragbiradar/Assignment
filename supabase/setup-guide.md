# Supabase Setup Guide for whatsapp Clone

This guide provides step-by-step instructions for setting up your Supabase project for the whatsapp clone application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in or create an account
2. Click "New Project"
3. Enter a name for your project (e.g., "whatsapp Clone")
4. Set a secure database password (save this for future reference)
5. Choose a region closest to your users
6. Click "Create new project"

## 2. Set Up Database Tables and Functions

1. Once your project is created, navigate to the SQL Editor in the Supabase dashboard
2. Create a new query
3. Copy the entire contents of the `setup.sql` file from this repository
4. Run the query to create all necessary tables, functions, triggers, and policies

## 3. Configure Authentication

1. Go to the Authentication section in the Supabase dashboard
2. Under "Providers", ensure that "Email" is enabled
3. Configure email templates (optional):
   - Go to "Email Templates"
   - Customize the templates for confirmation, invitation, magic link, and recovery emails

4. Configure authentication settings:
   - Go to "Settings"
   - Set the Site URL to your application's URL (e.g., `http://localhost:3000` for development)
   - Configure other settings as needed (e.g., redirect URLs, session timeouts)

## 4. Set Up Storage (Optional)

If you want to allow users to upload profile pictures or send images in chats:

1. Go to the Storage section in the Supabase dashboard
2. Create the following buckets:
   - `avatars` (for user profile pictures)
   - `chat-attachments` (for files shared in chats)

3. Configure bucket policies:

   For the `avatars` bucket:
   ```sql
   CREATE POLICY "Anyone can view avatars"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'avatars');

   CREATE POLICY "Authenticated users can upload avatars"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'avatars' AND
     auth.role() = 'authenticated' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );

   CREATE POLICY "Users can update their own avatar"
   ON storage.objects FOR UPDATE
   USING (
     bucket_id = 'avatars' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   For the `chat-attachments` bucket:
   ```sql
   CREATE POLICY "Chat participants can view attachments"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'chat-attachments' AND
     auth.uid() IN (
       SELECT user_id FROM chat_participants
       WHERE chat_id = (storage.foldername(name))[1]::uuid
     )
   );

   CREATE POLICY "Chat participants can upload attachments"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'chat-attachments' AND
     auth.role() = 'authenticated' AND
     auth.uid() IN (
       SELECT user_id FROM chat_participants
       WHERE chat_id = (storage.foldername(name))[1]::uuid
     )
   );
   ```

## 5. Enable Realtime

1. Go to the Database section in the Supabase dashboard
2. Click on "Replication" in the sidebar
3. Under "Realtime", ensure that the publication `supabase_realtime` is enabled
4. Make sure the following tables are added to the publication:
   - `messages`
   - `chats`
   - `chat_participants`

## 6. Deploy Edge Functions (Optional)

If you want to use the Edge Functions described in `edge-functions.md`:

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

5. Create and deploy each function:
   ```bash
   supabase functions new create-chat
   # Copy the function code to supabase/functions/create-chat/index.ts
   supabase functions deploy create-chat
   ```

   Repeat for each function you want to deploy.

## 7. Get API Keys

1. Go to the API section in the Supabase dashboard
2. Under "Project API keys", copy:
   - `anon` public key (for client-side code)
   - `service_role` key (for server-side code, keep this secret)
3. Copy your project URL

## 8. Configure Your Application

1. Create a `.env.local` file in your project root with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. If you're using server-side functionality, also add:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## 9. Test Your Setup

1. Run your application:
   ```bash
   npm run dev
   ```

2. Try to sign up a new user
3. Verify that the user is created in both the `auth.users` and `public.users` tables
4. Test creating a chat and sending messages
5. Verify that realtime updates are working

## 10. Monitoring and Maintenance

1. Monitor your project's usage in the Supabase dashboard
2. Set up database backups (available on paid plans)
3. Monitor logs for errors and performance issues

## Troubleshooting Common Issues

### Authentication Issues

- **Problem**: Users can sign up but not sign in
  **Solution**: Check that the email confirmation settings are configured correctly

- **Problem**: "User not found" errors
  **Solution**: Verify that the trigger to create users in the `public.users` table is working

### Realtime Issues

- **Problem**: Realtime updates not working
  **Solution**: 
  1. Ensure the publication includes the necessary tables
  2. Check that your Supabase client is configured to subscribe to changes
  3. Verify that RLS policies allow the user to see the changes

### Database Issues

- **Problem**: "Permission denied" errors
  **Solution**: Review your RLS policies to ensure they grant the necessary permissions

- **Problem**: Slow queries
  **Solution**: Check that indexes are created on frequently queried columns

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
