'use client';

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import RightSidebar from '@/components/RightSidebar';
import ChatFAB from '@/components/ChatFAB';
import { User } from '@supabase/supabase-js';

export default function ChatClient({ id, user }: { id: string, user: User }) {
  const router = useRouter();

  return (
    <div className="h-screen w-full overflow-hidden bg-white" style={{ display: 'flex' }}>
      {/* Left sidebar - highest z-index (90) */}
      <div style={{ position: 'relative', zIndex: 90 }}>
        <Sidebar onChatSelect={(chatId) => router.push(`/chat/${chatId}`)} />
      </div>

      {/* Chat area - takes remaining space */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <ChatArea chatId={id} />
      </div>

      {/* Right sidebar */}
      <RightSidebar />

      {/* Floating action button - positioned at the bottom right of the screen */}
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 95 // Higher z-index to ensure visibility
        }}
        className="chat-fab-container"
      >
        <ChatFAB onChatCreated={(chatId) => router.push(`/chat/${chatId}`)} />
      </div>
    </div>
  );
}
