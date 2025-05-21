# WhatsApp Clone

A WhatsApp clone built with Next.js, Tailwind CSS, and Supabase.

## Features

- Real-time messaging
- User authentication
- Chat list with search and filtering
- Message status indicators
- Offline support with IndexedDB
- Responsive design
- Chat labels
- Group chats

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, React Icons
- **Backend**: Supabase (Authentication, Database, Storage, Realtime)
- **Offline Storage**: Dexie.js (IndexedDB wrapper)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project:
   - Go to [Supabase](https://supabase.com) and create a new project
   - Get your project URL and anon key from the API settings

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up the database:
   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL script from `supabase/schema.sql`

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following database tables:

- **users**: User profiles
- **chats**: Chat rooms
- **messages**: Individual messages
- **chat_participants**: Links users to chats
- **labels**: Chat labels
- **chat_labels**: Links labels to chats

## Authentication

The application uses Supabase Authentication with email/password login. When a user signs up:

1. A new auth user is created
2. A corresponding record is added to the `users` table
3. The user is redirected to the login page

## Real-time Messaging

Real-time messaging is implemented using Supabase Realtime:

1. Messages are stored in the `messages` table
2. The application subscribes to changes on the `messages` table
3. When a new message is inserted, it's immediately displayed to all participants

## Offline Support

Offline support is implemented using Dexie.js:

1. Messages are stored locally in IndexedDB
2. When offline, messages are marked as "not synced"
3. When the connection is restored, unsynchronized messages are sent to the server

## Deployment

To deploy the application to production:

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

Alternatively, you can deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fwhatsapp-clone)
