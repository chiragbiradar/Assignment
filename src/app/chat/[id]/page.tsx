'use client';

import { useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { useAuth } from '@/context/AuthContext';

// Add a utility function to check if we're on the client side
const isClient = typeof window !== 'undefined';

export default function ChatPage({ params }: { params: { id: string } }) {
  // Use React.use to unwrap params
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated - only run on client side
  useEffect(() => {
    // Skip this effect during server-side rendering
    if (!isClient) {
      return;
    }

    if (!loading) {
      if (!user) {
        console.log("No user found in chat page, redirecting to login");
        // Use direct navigation for more reliable redirection
        window.location.href = '/login';
      } else {
        console.log("User authenticated in chat page:", user.email);

        // Check if we have a stored mock session
        try {
          const hasMockSession = localStorage.getItem('mockSupabaseSession') !== null;
          if (hasMockSession) {
            // Set a cookie for middleware detection
            document.cookie = `mockSession=true; path=/; max-age=86400`;
          }
        } catch (error) {
          console.error("Error checking mock session:", error);
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white relative chat-container">
      {/* Sidebar with navigation and chat list */}
      <Sidebar onChatSelect={(chatId) => router.push(`/chat/${chatId}`)} />

      {/* Chat area - takes remaining space */}
      <div className="flex-1 h-full">
        <ChatArea chatId={id} />
      </div>

      {/* Floating action button */}
      <div className="absolute bottom-6 right-6">
        <button className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
