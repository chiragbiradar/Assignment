'use client';

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { TbMessageCirclePlus } from "react-icons/tb";

export default function ChatPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  return (
    <div className="h-screen w-full overflow-hidden bg-white" style={{ display: 'flex' }}>
      {/* Left sidebar - highest z-index (80) */}
      <div style={{ position: 'relative', zIndex: 80 }}>
        <Sidebar onChatSelect={(chatId) => router.push(`/chat/${chatId}`)} />
      </div>

      {/* Chat area - takes remaining space */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <ChatArea chatId={id} />
      </div>

      {/* Floating action button - positioned at the bottom of left sidebar */}
      <div style={{ position: 'absolute', bottom: '1.5rem', left: '3.5rem', transform: 'translateX(-50%)', zIndex: 75 }}>
        <button className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors">
          <TbMessageCirclePlus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
