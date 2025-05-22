'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import RightSidebar from '@/components/RightSidebar';
import { MdOutlineInstallDesktop } from "react-icons/md";
import { BiSolidBellOff } from "react-icons/bi";
import { FaListUl } from "react-icons/fa";
import { BsChatDotsFill } from "react-icons/bs";
import { TbMessageCirclePlus } from "react-icons/tb";

// Add a utility function to check if we're on the client side
const isClient = typeof window !== 'undefined';

export default function Home() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Clean URL if it has query parameters
  useEffect(() => {
    // Skip this effect during server-side rendering
    if (!isClient) {
      return;
    }

    // Generate a unique ID for this component instance for debugging
    const componentId = Math.random().toString(36).substring(2, 8);
    console.log(`[${componentId}] Home page mounted`);

    // Check for URL parameters and clean them
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString()) {
      console.log(`[${componentId}] Detected query parameters, cleaning URL`);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);



  return (
    <div className="h-screen w-full overflow-hidden bg-white flex flex-col">
      {/* Top navigation bar - spans full width - lower z-index (40) */}
      <div className="w-full bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between" style={{ position: 'relative', zIndex: 40 }}>
        <div className="flex items-center">
          <BsChatDotsFill className="h-3.5 w-3.5 mr-1.5 text-gray-600" />
          <span className="text-gray-600 font-medium text-sm">chats</span>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help
          </button>
          <div className="flex items-center text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border ">
            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse mr-1"></div>
            5 / 5 phones
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <button className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1">
            <MdOutlineInstallDesktop className="h-3.5 w-3.5 mr-1" />
          </button>
          <button className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1">
            <BiSolidBellOff className="h-3.5 w-3.5 mr-1" />
          </button>
          <button className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1 relative">
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
              <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
            </div>
            <FaListUl className="h-3.5 w-3.5 mr-1" />
          </button>
        </div>
      </div>

      {/* Main content area - flex row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - highest z-index (60) */}
        <div style={{ position: 'relative', zIndex: 60 }}>
          <Sidebar onChatSelect={setSelectedChatId} hideTopNav={true} />
        </div>

        {/* Chat area - takes remaining space */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          {selectedChatId ? (
            <ChatArea chatId={selectedChatId} hideTopNav={true} />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-700">Welcome to WhatsApp</h2>
                <p className="mt-2 text-gray-500">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <RightSidebar />
      </div>

      {/* Floating action button - positioned at the bottom of left sidebar */}
      <div style={{ position: 'absolute', bottom: '1.5rem', left: '20.6rem', transform: 'translateX(-50%)', zIndex: 65 }}>
        <button className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors">
          <TbMessageCirclePlus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
