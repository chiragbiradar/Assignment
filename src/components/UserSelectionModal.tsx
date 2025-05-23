'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/supabase';
import { FiSearch, FiX } from 'react-icons/fi';
import { BsPersonCircle } from 'react-icons/bs';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import Portal from './Portal';

type UserSelectionModalProps = {
  onClose: () => void;
  onUserSelected?: (user: User) => void;
  onGroupCreated?: (chatId: string) => void;
  isGroupSelection: boolean;
};

export default function UserSelectionModal({
  onClose,
  onUserSelected,
  onGroupCreated,
  isGroupSelection
}: UserSelectionModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch users from the database
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Get the current user ID
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || '';

        if (!currentUserId) {
          console.error('No authenticated user found');
          setLoading(false);
          return;
        }

        // Fetch users from the database, excluding the current user
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, created_at')
          .neq('id', currentUserId);

        if (error) {
          console.error('Error fetching users:', error);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          console.log(`Found ${data.length} users for chat selection`);
          setUsers(data);
        } else {
          console.log('No users found in the database');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle clicking outside to close the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if the click is outside the modal
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        console.log('Click outside modal detected, closing modal');
        onClose();
      }
    };

    // Use mousedown for better responsiveness
    document.addEventListener('mousedown', handleClickOutside);

    // Also handle escape key to close modal
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('Escape key pressed, closing modal');
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = (user: User) => {
    // Clear any previous errors
    setError(null);

    if (isGroupSelection) {
      // Toggle user selection for group chat
      if (selectedUsers.some(u => u.id === user.id)) {
        setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    } else {
      // For 1-to-1 chat, directly select the user
      if (onUserSelected) {
        // Set processing state to show loading indicator
        setProcessingUser(user.id);
        try {
          onUserSelected(user);
        } catch (err) {
          console.error('Error selecting user:', err);
          setError('Failed to start chat. Please try again.');
          setProcessingUser(null);
        }
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!isGroupSelection || selectedUsers.length === 0 || !groupName.trim() || !onGroupCreated) {
      return;
    }

    try {
      console.log('Creating group chat:', groupName, 'with users:', selectedUsers.map(u => u.full_name).join(', '));

      // Get the current user ID
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        console.error('No authenticated user found');
        return;
      }

      const chatId = uuidv4();
      const now = new Date().toISOString();

      // Create the group chat
      const { error: chatError } = await supabase
        .from('chats')
        .insert({
          id: chatId,
          name: groupName.trim(),
          is_group: true,
          created_at: now,
          updated_at: now
        });

      if (chatError) {
        console.error('Error creating group chat:', chatError);
        return;
      }

      console.log('Created group chat with ID:', chatId);

      // Add current user as participant
      const { error: currentUserError } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatId,
          user_id: currentUserId,
          created_at: now
        });

      if (currentUserError) {
        console.error('Error adding current user to group:', currentUserError);
        return;
      }

      console.log('Added current user as participant');

      // Add selected users as participants
      const participantsToAdd = selectedUsers.map(user => ({
        chat_id: chatId,
        user_id: user.id,
        created_at: now
      }));

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantsToAdd);

      if (participantsError) {
        console.error('Error adding participants to group:', participantsError);
        return;
      }

      console.log('Added', selectedUsers.length, 'participants to the group');

      // Create a welcome message
      const messageId = uuidv4();
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          id: messageId,
          chat_id: chatId,
          sender_id: currentUserId,
          content: `Group "${groupName.trim()}" created with ${selectedUsers.length} participants`,
          created_at: now,
          is_read: false
        });

      if (messageError) {
        console.error('Error creating welcome message:', messageError);
        // Continue anyway, this is not critical
      } else {
        console.log('Created welcome message for group chat');
      }

      // Notify parent component about the new group
      onGroupCreated(chatId);
    } catch (error) {
      console.error('Error creating group chat:', error);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto overflow-hidden relative"
        >
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-green-50">
          <h2 className="text-xl font-semibold text-green-800">
            {isGroupSelection ? 'Create Group Chat' : 'Start a New Chat'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200"
            aria-label="Close"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Group name input (for group chats only) */}
        {isGroupSelection && (
          <div className="p-5 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter a name for your group"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>
        )}

        {/* Search bar */}
        <div className="p-5 border-b">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              autoFocus={!isGroupSelection}
            />
          </div>
        </div>

        {/* User list */}
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <BsPersonCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No users found</p>
                <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isGroupSelection && selectedUsers.some(u => u.id === user.id)
                        ? 'bg-green-50'
                        : ''
                    } ${processingUser === user.id ? 'opacity-70 pointer-events-none' : ''}`}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="w-12 h-12 relative rounded-full overflow-hidden bg-gray-200 mr-4 flex-shrink-0">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.full_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600 text-xl font-semibold">
                          {user.full_name.charAt(0)}
                        </div>
                      )}
                      {processingUser === user.id && (
                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 truncate">{user.full_name}</h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    {isGroupSelection && selectedUsers.some(u => u.id === user.id) && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected users and action button (for group chats) */}
        {isGroupSelection && (
          <div className="p-5 border-t bg-gray-50">
            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Selected users ({selectedUsers.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center"
                    >
                      {user.full_name}
                      <button
                        className="ml-2 text-green-600 hover:text-green-800 focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
                        }}
                        aria-label={`Remove ${user.full_name}`}
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCreateGroup}
              disabled={selectedUsers.length === 0 || !groupName.trim()}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                selectedUsers.length === 0 || !groupName.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {selectedUsers.length === 0
                ? 'Select users to create group'
                : !groupName.trim()
                  ? 'Enter a group name'
                  : `Create Group with ${selectedUsers.length} ${selectedUsers.length === 1 ? 'user' : 'users'}`}
            </button>
          </div>
        )}

        {/* Action button for 1-to-1 chats */}
        {!isGroupSelection && (
          <div className="p-5 border-t bg-gray-50">
            {error ? (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center mb-2">
                Select a user from the list above to start a chat
              </p>
            )}
          </div>
        )}
      </div>
      </div>
    </Portal>
  );
}
