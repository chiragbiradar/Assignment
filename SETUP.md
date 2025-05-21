# WhatsApp Clone - Complete Setup Guide

This guide provides comprehensive instructions for setting up the WhatsApp clone project, including both the frontend Next.js application and the Supabase backend.

## Prerequisites

- Node.js 18+ and npm
- Git
- A Supabase account (free tier is sufficient to start)

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### 3.1. Create a New Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in or create an account
2. Click "New Project"
3. Enter a name for your project (e.g., "WhatsApp Clone")
4. Set a secure database password (save this for future reference)
5. Choose a region closest to your users
6. Click "Create new project"

#### 3.2. Set Up Database Schema

1. Once your project is created, navigate to the SQL Editor in the Supabase dashboard
2. Create a new query
3. Copy the entire contents of the `supabase/setup.sql` file from this repository
4. Run the query to create all necessary tables, functions, triggers, and policies

#### 3.3. Configure Authentication

1. Go to the Authentication section in the Supabase dashboard
2. Under "Providers", ensure that "Email" is enabled
3. Configure email templates (optional):
   - Go to "Email Templates"
   - Customize the templates for confirmation, invitation, magic link, and recovery emails

4. Configure authentication settings:
   - Go to "Settings"
   - Set the Site URL to your application's URL (e.g., `http://localhost:3000` for development)
   - Configure other settings as needed (e.g., redirect URLs, session timeouts)

#### 3.4. Enable Realtime

1. Go to the Database section in the Supabase dashboard
2. Click on "Replication" in the sidebar
3. Under "Realtime", ensure that the publication `supabase_realtime` is enabled
4. Make sure the following tables are added to the publication:
   - `messages`
   - `chats`
   - `chat_participants`

#### 3.5. Get API Keys

1. Go to the API section in the Supabase dashboard
2. Under "Project API keys", copy:
   - `anon` public key (for client-side code)
   - Project URL
3. You'll need these for the next step

### 4. Configure Environment Variables

1. Create a `.env.local` file in the root of your project:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Replace `your-project-url` and `your-anon-key` with the values from the previous step.

### 5. Run the Development Server

```bash
npm run dev
```

Your application should now be running at [http://localhost:3000](http://localhost:3000).

## Testing the Application

### 1. Create Test Users

1. Go to your application at [http://localhost:3000](http://localhost:3000)
2. Click "Create a new account" on the login page
3. Fill in the registration form with test user details
4. Repeat to create multiple test users

### 2. Load Sample Data (Optional)

If you want to populate your database with sample data for testing:

1. Go to the SQL Editor in the Supabase dashboard
2. Open the `supabase/sample-data.sql` file from this repository
3. Replace the placeholder UUIDs with the actual UUIDs of your test users
   - You can find user UUIDs in the Authentication > Users section of the Supabase dashboard
4. Run the modified script

### 3. Test Features

Test the following features to ensure everything is working correctly:

1. **Authentication**:
   - Sign up with a new account
   - Sign in with an existing account
   - Sign out

2. **Chat List**:
   - View the list of chats
   - Search for chats
   - Filter chats by label

3. **Messaging**:
   - Select a chat
   - Send messages
   - Receive messages in real-time
   - See message status (read/unread)

4. **Offline Support**:
   - Turn off your internet connection
   - Send messages while offline
   - Turn your internet back on and verify messages are synced

## Project Structure

```
whatsapp-clone/
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── chat/[id]/       # Individual chat page
│   │   ├── login/           # Login page
│   │   ├── signup/          # Signup page
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── ChatArea.tsx     # Chat messages and input
│   │   └── Sidebar.tsx      # Chat list sidebar
│   ├── context/             # React context providers
│   │   └── AuthContext.tsx  # Authentication context
│   └── lib/                 # Utility functions and libraries
│       ├── db.ts            # IndexedDB setup with Dexie
│       └── supabase.ts      # Supabase client and types
├── supabase/                # Supabase configuration
│   ├── edge-functions.md    # Edge functions documentation
│   ├── sample-data.sql      # Sample data for testing
│   ├── setup-guide.md       # Detailed Supabase setup guide
│   └── setup.sql            # Database setup SQL
├── .env.local               # Environment variables (create this)
├── next.config.ts           # Next.js configuration
├── package.json             # Project dependencies
├── README.md                # Project documentation
└── tsconfig.json            # TypeScript configuration
```

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Configure the project:
   - Add environment variables from your `.env.local` file
   - Configure build settings if needed
5. Click "Deploy"

### Deploying to Other Platforms

For other platforms like Netlify, Railway, or your own server, follow their respective documentation for deploying Next.js applications. Make sure to:

1. Set up environment variables
2. Configure build commands (`npm run build`)
3. Set the output directory (`/.next`)

## Troubleshooting

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

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Dexie.js Documentation](https://dexie.org/docs)
- [React Icons Documentation](https://react-icons.github.io/react-icons/)
