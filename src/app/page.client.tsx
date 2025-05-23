'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import RightSidebar from '@/components/RightSidebar';
import ChatFAB from '@/components/ChatFAB';
import { MdOutlineInstallDesktop } from "react-icons/md";
import { BiSolidBellOff } from "react-icons/bi";
import { FaListUl } from "react-icons/fa";
import { BsChatDotsFill } from "react-icons/bs";
import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { setupOfflineSync } from '@/lib/db';
import { FiSettings, FiHelpCircle, FiLogOut, FiFilter, FiUsers, FiArchive } from "react-icons/fi";

// Add a utility function to check if we're on the client side
const isClient = typeof window !== 'undefined';

export default function HomeClient({ user }: { user: User }) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const listDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle clicking outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listDropdownRef.current && !listDropdownRef.current.contains(event.target as Node)) {
        setListDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    router.refresh();
  };

  // Initialize app and clean URL if it has query parameters
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

    // Initialize offline sync functionality
    console.log('Initializing offline sync functionality');
    setupOfflineSync(supabase);

    // Set up online/offline status indicators
    const handleOnline = () => {
      console.log('Device is online');
      document.body.classList.remove('offline-mode');
    };

    const handleOffline = () => {
      console.log('Device is offline');
      document.body.classList.add('offline-mode');
    };

    // Set initial status
    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-white flex flex-col">
      {/* Top navigation bar - spans full width - second highest z-index (80) */}
      <div className="w-full bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between" style={{ position: 'relative', zIndex: 80 }}>
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
          <div className="relative" ref={listDropdownRef}>
            <button
              className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1 relative"
              onClick={() => setListDropdownOpen(!listDropdownOpen)}
            >
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              </div>
              <FaListUl className="h-3.5 w-3.5 mr-1" />
            </button>

            {/* Dropdown menu */}
            {listDropdownOpen && (
              <div className="absolute top-8 right-0 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-48 z-50">
                <ul>
                  <li>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FiFilter className="mr-2 h-4 w-4" />
                      Filter Chats
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FiUsers className="mr-2 h-4 w-4" />
                      Manage Users
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FiArchive className="mr-2 h-4 w-4" />
                      Archived Chats
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FiSettings className="mr-2 h-4 w-4" />
                      Settings
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <FiHelpCircle className="mr-2 h-4 w-4" />
                      Help
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <FiLogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content area - flex row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - highest z-index (90) */}
        <div style={{ position: 'relative', zIndex: 90 }}>
          <Sidebar onChatSelect={setSelectedChatId} hideTopNav={true} />
        </div>

        {/* Chat area - takes remaining space */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          {selectedChatId ? (
            <ChatArea chatId={selectedChatId} hideTopNav={true} />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-700">Welcome, {user.email}</h2>
                <p className="mt-2 text-gray-500">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <RightSidebar />
      </div>

      {/* Floating action button - positioned at the bottom of left sidebar */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '20rem',
          transform: 'translateX(-50%)',
          zIndex: 70 // Lower z-index to prevent overlapping with other elements
        }}
        className="chat-fab-container"
      >
        <ChatFAB onChatCreated={setSelectedChatId} />
      </div>
    </div>
  );
}
