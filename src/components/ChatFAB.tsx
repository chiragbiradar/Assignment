'use client';

import { useState, useRef, useEffect } from 'react';
import { TbMessageCirclePlus } from "react-icons/tb";
import { BsPersonFill, BsPeopleFill } from "react-icons/bs";
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import UserSelectionModal from './UserSelectionModal';

type ChatFABProps = {
  onChatCreated: (chatId: string) => void;
};

export default function ChatFAB({ onChatCreated }: ChatFABProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Log state changes for debugging
  useEffect(() => {
    console.log('Menu open state:', isMenuOpen);
  }, [isMenuOpen]);

  useEffect(() => {
    console.log('User modal open state:', isUserModalOpen);
  }, [isUserModalOpen]);

  useEffect(() => {
    console.log('Group modal open state:', isGroupModalOpen);
  }, [isGroupModalOpen]);

  // Handle clicking outside to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        console.log('Click outside menu detected, closing menu');
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCreateOneToOneChat = () => {
    console.log('Opening user selection modal for 1-to-1 chat');
    setIsMenuOpen(false);
    // Use setTimeout to ensure the menu close animation completes first
    setTimeout(() => {
      setIsUserModalOpen(true);
    }, 50);
  };

  const handleCreateGroupChat = () => {
    console.log('Opening user selection modal for group chat');
    setIsMenuOpen(false);
    // Use setTimeout to ensure the menu close animation completes first
    setTimeout(() => {
      setIsGroupModalOpen(true);
    }, 50);
  };

  const handleUserSelected = async (selectedUser: User) => {
    // Clear any previous errors
    setError(null);
    setIsProcessing(true);

    try {
      console.log('User selected for chat:', selectedUser.full_name);

      // Get the current user ID
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        console.error('No authenticated user found');
        setError('Authentication error. Please log in again.');
        setIsProcessing(false);
        return;
      }

      // First, get all chat IDs where the current user is a participant
      const { data: currentUserChats, error: currentUserChatsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUserId);

      if (currentUserChatsError) {
        console.error('Error fetching current user chats:', currentUserChatsError);
        setError('Failed to check existing chats. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Extract the chat IDs into an array
      const currentUserChatIds = currentUserChats.map(chat => chat.chat_id);

      // Initialize variables for existing chats
      let existingChats: any[] = [];
      let existingChatsError = null;

      if (currentUserChatIds.length === 0) {
        // No chats found for current user, so no existing chat with selected user
        console.log('Current user has no existing chats');
        // Skip the next query and proceed to create a new chat
      } else {
        console.log(`Found ${currentUserChatIds.length} chats for current user`);

        // Now check if the selected user is in any of these chats
        const response = await supabase
          .from('chat_participants')
          .select(`
            chat_id,
            chats!inner (
              id,
              is_group
            )
          `)
          .eq('user_id', selectedUser.id)
          .in('chat_id', currentUserChatIds);

        existingChats = response.data || [];
        existingChatsError = response.error;
      }

      if (existingChatsError) {
        console.error('Error checking existing chats:', existingChatsError);
        setError('Failed to check existing chats. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Filter to find 1-to-1 chats
      console.log('Checking for existing 1-to-1 chats with user:', selectedUser.full_name);
      console.log('Existing chats data:', existingChats);

      // Make sure existingChats is an array and has the expected structure
      if (!Array.isArray(existingChats)) {
        console.error('Expected existingChats to be an array but got:', existingChats);
        existingChats = [];
      }

      // Safely filter the chats
      const oneToOneChats = existingChats.filter(chat => {
        // Check if chat has the expected structure
        if (!chat || !chat.chats) {
          console.warn('Chat is missing expected structure:', chat);
          return false;
        }
        return !chat.chats.is_group;
      });

      console.log('Found one-to-one chats:', oneToOneChats.length);

      if (oneToOneChats.length > 0) {
        // Chat already exists, open it
        console.log('Chat already exists, opening it:', oneToOneChats[0].chat_id);
        setIsUserModalOpen(false); // Close the modal before navigation
        onChatCreated(oneToOneChats[0].chat_id);
        setIsProcessing(false);
        return;
      }

      console.log('No existing chat found, creating new chat with user:', selectedUser.full_name);

      // Create a new chat
      const chatId = uuidv4();
      const now = new Date().toISOString();

      // Insert the new chat
      const { error: insertChatError } = await supabase
        .from('chats')
        .insert({
          id: chatId,
          name: null, // For 1-to-1 chats, we use the participant's name
          is_group: false,
          created_at: now,
          updated_at: now
        });

      if (insertChatError) {
        console.error('Error creating chat:', insertChatError);
        setError('Failed to create chat. Please try again.');
        setIsProcessing(false);
        return;
      }

      console.log('Created new chat with ID:', chatId);

      // Add both users as participants in a single operation
      const participants = [
        {
          chat_id: chatId,
          user_id: currentUserId,
          created_at: now
        },
        {
          chat_id: chatId,
          user_id: selectedUser.id,
          created_at: now
        }
      ];

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error adding chat participants:', participantsError);
        setError('Failed to add participants to chat. Please try again.');
        setIsProcessing(false);
        return;
      }

      console.log('Added both users as participants');

      // Create a welcome message
      const messageId = uuidv4();
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          id: messageId,
          chat_id: chatId,
          sender_id: currentUserId,
          content: `Chat started with ${selectedUser.full_name}`,
          created_at: now,
          is_read: false
        });

      if (messageError) {
        console.error('Error creating welcome message:', messageError);
        // Continue anyway, this is not critical
      } else {
        console.log('Created welcome message');
      }

      // Close the modal before navigation
      setIsUserModalOpen(false);

      // Open the newly created chat
      onChatCreated(chatId);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error in handleUserSelected function:', error);

      // Provide more specific error message based on the error type
      if (error instanceof TypeError) {
        console.error('TypeError details:', error.message);
        if (error.message.includes('Symbol(Symbol.iterator)')) {
          setError('Error with data format. Please try again or contact support if the issue persists.');
        } else {
          setError(`Type error: ${error.message}. Please try again.`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      setIsProcessing(false);
    }
  };

  const handleGroupCreated = (chatId: string) => {
    setIsGroupModalOpen(false);
    onChatCreated(chatId);
  };

  return (
    <>
      {error && (
        <div className="fixed bottom-24 right-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm shadow-lg z-10 max-w-xs">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            className="absolute top-1 right-1 text-red-400 hover:text-red-600"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          className={`w-13 h-13 rounded-full bg-green-600 flex items-center justify-center text-white shadow-lg hover:bg-green-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50`}
          onClick={() => {
            if (!isProcessing) {
              console.log('FAB button clicked');
              setIsMenuOpen(!isMenuOpen);
            }
          }}
          disabled={isProcessing}
          aria-label="Create new chat"
          title="Create new chat"
          style={{
            width: '3.25rem', // Approximately 15-20% smaller than 4rem (w-16)
            height: '3.25rem',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.15), 0 3px 6px -3px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <TbMessageCirclePlus className="h-6 w-6" />
          )}
        </button>

        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute bottom-16 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-56 transform transition-all"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
              New Conversation
            </div>
            <button
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 flex items-center transition-colors"
              onClick={handleCreateOneToOneChat}
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 text-green-600">
                <BsPersonFill className="h-4 w-4" />
              </div>
              <span className="font-medium">Chat with someone</span>
            </button>
            <button
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 flex items-center transition-colors"
              onClick={handleCreateGroupChat}
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 text-green-600">
                <BsPeopleFill className="h-4 w-4" />
              </div>
              <span className="font-medium">Create group chat</span>
            </button>
          </div>
        )}
      </div>

      {/* User selection modal for 1-to-1 chats */}
      {isUserModalOpen ? (
        <UserSelectionModal
          onClose={() => {
            console.log('Closing user selection modal');
            setIsUserModalOpen(false);
          }}
          onUserSelected={handleUserSelected}
          isGroupSelection={false}
        />
      ) : null}

      {/* User selection modal for group chats */}
      {isGroupModalOpen ? (
        <UserSelectionModal
          onClose={() => {
            console.log('Closing group selection modal');
            setIsGroupModalOpen(false);
          }}
          onGroupCreated={handleGroupCreated}
          isGroupSelection={true}
        />
      ) : null}
    </>
  );
}
