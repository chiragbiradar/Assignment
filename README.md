# Periskope Clone

A comprehensive whatsapp clone built with Next.js, Tailwind CSS, and Supabase, featuring real-time messaging, offline support, and a modern UI.

## Features

### Authentication
- **Email/Password Authentication**: Secure login and registration using Supabase Auth
- **User Profiles**: User information stored in the database
- **Session Management**: Persistent sessions with automatic token refresh

### Messaging
- **Real-time Messaging**: Instant message delivery using Supabase Realtime
- **1-to-1 Chats**: Private conversations between two users
- **Group Chats**: Conversations with multiple participants
- **Message Timestamps**: Time display for all messages

### Attachments
- **File Attachments**: Send and receive various file types
- **Image Attachments**: Send, preview, and view images in chat
- **Video Attachments**: Send, preview, and play videos in chat
- **Audio Attachments**: Send and play audio files
- **Document Attachments**: Share documents with other users
- **Attachment Preview**: Preview attachments before sending

### Offline Support
- **IndexedDB Storage**: Local message storage using Dexie.js
- **Offline Message Queue**: Send messages while offline
- **Automatic Sync**: Messages sync when connection is restored
- **Seamless Experience**: Continue using the app without internet

### UI Components
- **Responsive Design**: Works on desktop and mobile devices
- **Chat List**: List of all conversations with search and filtering
- **Chat Area**: Message display with input field and attachments
- **Sidebar Navigation**: Easy access to different sections
- **Group/Contact Info Bar**: Display information about current chat
- **Floating Action Button**: Quick access to create new chats
- **Dropdown Menus**: Clean UI with dropdown functionality

### Navigation & Layout
- **Z-index Hierarchy**: Proper layering of UI components
  - Sidebar: Highest z-index (90)
  - Navbar: Second highest z-index (80)
  - Content: Lower z-index for proper stacking
- **Responsive Layout**: Adapts to different screen sizes
- **Clean Navigation**: Intuitive navigation between chats and features

### Chat Management
- **Chat Creation**: Create new individual or group chats
- **Last Message Preview**: Shows the last message in chat list

### User Experience
- **Loading States**: Visual feedback during loading operations
- **Error Handling**: Graceful error handling with user feedback


## Tech Stack

- **Frontend**:
  - Next.js 15.3.2 with App Router
  - TypeScript
  - Tailwind CSS 4 for styling
  - React 19 for UI components
  - React Icons for iconography

- **Backend**:
  - Supabase for authentication, database, storage, and realtime features
  - PostgreSQL database with RLS policies
  - Supabase Storage for file attachments
  - Supabase Realtime for live updates

- **Offline Support**:
  - Dexie.js 4 for IndexedDB wrapper
  - Custom sync mechanism for offline/online transitions

- **Development Tools**:
  - ESLint for code quality
  - Next.js development server
  - TypeScript for static type checking

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
- **messages**: Individual messages with attachment support
- **chat_participants**: Links users to chats
- **labels**: Chat labels
- **chat_labels**: Links labels to chats

For detailed setup instructions, see [SETUP.md](SETUP.md).

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
