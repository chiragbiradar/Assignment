'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Chat, User } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiSearch, FiFilter, FiSave } from 'react-icons/fi';
import { BsCircleFill, BsChatDotsFill } from 'react-icons/bs';
import { v4 as uuidv4 } from 'uuid';
// Import the required icons
import { IoHomeSharp, IoChatbubbleEllipsesSharp, IoTicket, IoList } from 'react-icons/io5';
import { GoGraph } from 'react-icons/go';
import { HiMiniMegaphone } from 'react-icons/hi2';
import { RiContactsBookFill, RiFolderImageFill } from 'react-icons/ri';
import { FaTasks, FaListUl } from 'react-icons/fa';
import { IoIosSettings } from 'react-icons/io';
import { MdOutlineInstallDesktop } from 'react-icons/md';
import { BiSolidBellOff } from 'react-icons/bi';
import { TbStarsFilled, TbLayoutSidebarLeftExpandFilled } from 'react-icons/tb';

type ChatWithLastMessage = Chat & {
  last_message?: {
    content: string;
    created_at: string;
    sender?: {
      full_name: string;
    };
  };
  participants?: {
    user: {
      full_name: string;
      avatar_url?: string;
    };
  }[];
  labels?: {
    name: string;
    color: string;
  }[];
  unread_count?: number;
  phone?: string;
};

type SidebarProps = {
  onChatSelect?: (chatId: string) => void;
  hideTopNav?: boolean;
  selectedChatId?: string;
};

// Function to create fallback chats if no chats are found
const createFallbackChats = (currentUser: User): ChatWithLastMessage[] => {
  const now = new Date();

  // Create a single fallback chat
  return [
    {
      id: uuidv4(),
      name: 'Welcome to Periskope Clone',
      is_group: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message: {
        content: 'Click the + button to start a new chat',
        created_at: new Date().toISOString(),
        sender: {
          full_name: 'System'
        }
      },
      participants: [
        {
          user: {
            full_name: 'System',
            avatar_url: null
          }
        }
      ],
      labels: [
        {
          name: 'System',
          color: '#4CAF50'
        }
      ],
      unread_count: 0
    }
  ];
};

export default function Sidebar({ onChatSelect, hideTopNav = false, selectedChatId }: SidebarProps) {
  const [chats, setChats] = useState<ChatWithLastMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [customFilter, setCustomFilter] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const userPresence = {};
  const router = useRouter();

  // Get the current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
        } else {
          console.error('No authenticated user found');
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      // Get all chats the user is a participant in
      console.log("Fetching chats for user:", user.id);

      try {
        const { data: participantData, error: participantError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (participantError) {
          console.error('Error fetching chat participants:', participantError);
          setChats(createFallbackChats(user));
          return;
        }

        // Check if participantData is defined and is an array
        if (!participantData || !Array.isArray(participantData) || participantData.length === 0) {
          console.log("No chat participants found, using fallback chat");
          setChats(createFallbackChats(user));
          return;
        }

        console.log("Found", participantData.length, "chats for user");
        const chatIds = participantData.map(p => p.chat_id);

        // Get chat details with last message
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
            id,
            name,
            is_group,
            created_at,
            updated_at,
            chat_participants (
              user_id,
              users (
                id,
                full_name,
                avatar_url,
                email
              )
            ),
            messages (
              id,
              content,
              created_at,
              sender_id,
              is_read
            )
          `)
          .in('id', chatIds)
          .order('updated_at', { ascending: false });

        if (chatError) {
          console.error('Error fetching chats:', chatError);
          setChats(createFallbackChats(user));
          return;
        }

        // Check if chatData is defined and is an array
        if (!chatData || !Array.isArray(chatData) || chatData.length === 0) {
          console.log("No chat data found, using fallback chat");
          setChats(createFallbackChats(user));
          return;
        }

        console.log("Processing", chatData.length, "chats");

        // Process the data to get the last message for each chat
        const processedChats = chatData.map(chat => {
          const messages = chat.messages || [];

          // Sort messages by created_at in descending order
          const sortedMessages = [...messages].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : undefined;

          // Get other participants (not the current user)
          const otherParticipants = (chat.chat_participants || [])
            .filter(p => p.user_id !== user.id)
            .map(p => p.users);

          // For 1-to-1 chats, use the other participant's name if chat name is null
          let chatName = chat.name;
          if (!chat.is_group && !chatName && otherParticipants.length > 0) {
            chatName = otherParticipants[0].full_name;
          }

          // Count unread messages (not from current user and not read)
          const unreadCount = messages.filter(
            m => m.sender_id !== user.id && !m.is_read
          ).length;

          // Format the chat data
          return {
            id: chat.id,
            name: chatName || 'Unnamed Chat',
            is_group: chat.is_group,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            last_message: lastMessage ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              sender: {
                full_name: 'User' // We'll improve this later
              }
            } : undefined,
            participants: chat.chat_participants?.map(p => ({
              user: p.users
            })) || [],
            labels: [], // We'll add labels support later
            unread_count: unreadCount
          };
        });

        setChats(processedChats);
      } catch (error) {
        console.error("Error in fetchChats:", error);
        setChats(createFallbackChats(user));
      }
    };

    fetchChats();

    // Subscribe to new messages
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        // Update the chats when a new message is received
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Filter chats based on search term and active filter
  const filteredChats = chats.filter(chat => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.last_message?.content && chat.last_message.content.toLowerCase().includes(searchTerm.toLowerCase()));

    // Type filter
    let matchesFilter = true;
    if (activeFilter === 'unread') {
      matchesFilter = (chat.unread_count || 0) > 0;
    } else if (activeFilter === 'groups') {
      matchesFilter = chat.is_group;
    } else if (activeFilter === 'custom' && customFilter) {
      // Custom filter logic (e.g., by label)
      matchesFilter = chat.labels?.some(label =>
        label.name.toLowerCase() === customFilter.toLowerCase()
      ) || false;
    }

    return matchesSearch && matchesFilter;
  });

  const handleChatSelect = (chatId: string) => {
    // Call the onChatSelect callback first to update the parent component state
    if (onChatSelect) {
      onChatSelect(chatId);
    }

    // Only navigate to the chat page if we're not already on the home page
    if (window.location.pathname !== '/') {
      router.push(`/chat/${chatId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  return (
    <div className="h-full flex" style={{ position: 'relative' }}>
      {/* Left navigation bar - highest z-index */}
      <div className="w-14 bg-gray-100 flex flex-col items-center py-4 border-r" style={{ position: 'relative', zIndex: 90 }}>
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-6">
          <Image
            src="/Periskope-logo.svg"
            alt="Periskope"
            width={20}
            height={20}
          />
        </div>
        <div className="flex flex-col h-full">
          {/* Main icons */}
          <div className="flex flex-col space-y-3 items-center">
            {/* Home icon */}
            <button className="text-gray-500 hover:text-green-500">
              <IoHomeSharp className="h-4 w-4" />
            </button>
            {/* Separator after Home icon */}
            <div className="w-8 border-b border-gray-200 my-2"></div>

            {/* Chat icon */}
            <button className="text-green-500 hover:text-green-600">
              <IoChatbubbleEllipsesSharp className="h-4 w-4" />
            </button>
            {/* Ticket icon */}
            <button className="text-gray-500 hover:text-green-500">
              <IoTicket className="h-4 w-4" />
            </button>
            {/* Graph/Analytics icon */}
            <button className="text-gray-500 hover:text-green-500">
              <GoGraph className="h-4 w-4" />
            </button>
            {/* Separator after Graph/Analytics icon */}
            <div className="w-8 border-b border-gray-200 my-2"></div>

            {/* Announcement/Megaphone icon */}
            <button className="text-gray-500 hover:text-green-500">
              <HiMiniMegaphone className="h-4 w-4" />
            </button>
            {/* List icon */}
            <button className="text-gray-500 hover:text-green-500">
              <IoList className="h-4 w-4" />
            </button>
            {/* Contacts icon */}
            <button className="text-gray-500 hover:text-green-500">
              <RiContactsBookFill className="h-4 w-4" />
            </button>
            {/* Separator after Contacts icon */}
            <div className="w-8 border-b border-gray-200 my-2"></div>

            {/* Media/Gallery icon */}
            <button className="text-gray-500 hover:text-green-500">
              <RiFolderImageFill className="h-4 w-4" />
            </button>
            {/* Separator after Media/Gallery icon */}
            <div className="w-8 border-b border-gray-200 my-2"></div>

            {/* Tasks icon */}
            <button className="text-gray-500 hover:text-green-500">
              <FaTasks className="h-4 w-4" />
            </button>
            {/* Settings icon */}
            <button className="text-gray-500 hover:text-green-500">
              <IoIosSettings className="h-4 w-4" />
            </button>
          </div>

          {/* Bottom icons with auto spacing */}
          <div className="flex flex-col space-y-6 items-center mt-auto mb-4">
            {/* Stars icon */}
            <button className="text-gray-500 hover:text-green-500">
              <TbStarsFilled className="h-4 w-4" />
            </button>
            {/* Sidebar expand icon */}
            <button className="text-gray-500 hover:text-green-500">
              <TbLayoutSidebarLeftExpandFilled className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat list sidebar - second highest z-index */}
      <div className="w-80 flex flex-col bg-white border-r border-gray-200" style={{ position: 'relative', zIndex: 80 }}>
        {/* Header - only show if hideTopNav is false */}
        {!hideTopNav && (
          <div className="px-3 py-2 flex items-center justify-between border-b bg-gray-50">
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
              <button className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Phone
              </button>
              <button className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1">
                <MdOutlineInstallDesktop className="h-3.5 w-3.5 mr-1" />
                Install
              </button>
              <button className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1">
                <BiSolidBellOff className="h-3.5 w-3.5 mr-1" />
                Mute
              </button>
              <button className="text-gray-500 hover:text-gray-700 text-xs flex items-center border border-gray-200 rounded-md px-2 py-1 relative">
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                </div>
                <FaListUl className="h-3.5 w-3.5 mr-1" />
                List
              </button>
            </div>
          </div>
        )}

        {/* Filter options */}
        <div className="p-2 border-b bg-white">
          <div className="flex space-x-2">
            <div className="flex items-center bg-gray-100 rounded-md px-2 py-1 flex-grow">
              <span className="bg-green-500 text-white text-xs px-1 py-0.5 rounded mr-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              <span className="text-xs text-gray-700">Custom filter</span>
              <button className="ml-2 text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">Save</button>
            </div>
            <button className="bg-gray-100 p-1.5 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="bg-gray-100 p-1.5 rounded-md flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="ml-1 text-xs text-gray-700">Filtered</span>
              <span className="ml-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-start p-3 border-b hover:bg-gray-100 cursor-pointer transition-all ${
                selectedChatId === chat.id ? 'bg-gray-50' : ''
              }`}
              onClick={() => handleChatSelect(chat.id)}
            >
              <div className="relative mr-3">
                <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-200">
                  {chat.participants?.[0]?.user.avatar_url ? (
                    <Image
                      src={chat.participants[0].user.avatar_url}
                      alt={chat.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xl font-semibold">
                      {chat.name.charAt(0)}
                    </div>
                  )}

                  {/* Online status indicator */}
                  {!chat.is_group && chat.participants && chat.participants.length > 0 &&
                    userPresence[chat.participants[0]?.user?.id] && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                {(chat.unread_count || 0) > 0 && (
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {chat.unread_count}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                {/* Top section with name and labels on the same line */}
                <div className="mb-1.5 flex justify-between items-start">
                  {/* Chat name with proper truncation */}
                  <h3 className="text-xs font-medium text-gray-900 truncate max-w-[60%]">{chat.name}</h3>

                  {/* Labels at the top-right */}
                  <div className="flex space-x-1 flex-wrap justify-end">
                    {chat.labels && chat.labels.length > 0 ? (
                      // Display actual chat labels if they exist
                      chat.labels.map((label, index) => (
                        <div
                          key={index}
                          className="px-1.5 py-0.5 rounded-md text-[10px] text-white font-medium shadow-sm"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </div>
                      ))
                    ) : (
                      // Display example tags if no labels exist
                      <>
                        {chat.is_group ? (
                          <div className="px-1.5 py-0.5 rounded-md text-[10px] text-white font-medium bg-blue-500 shadow-sm">
                            Group
                          </div>
                        ) : null}
                        {Math.random() > 0.5 ? (
                          <div className="px-1.5 py-0.5 rounded-md text-[10px] text-white font-medium bg-purple-500 shadow-sm">
                            Work
                          </div>
                        ) : (
                          <div className="px-1.5 py-0.5 rounded-md text-[10px] text-white font-medium bg-green-500 shadow-sm">
                            Personal
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Middle section with participant info, message preview, and avatars */}
                <div className="mb-1.5 flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    {/* Group participants info */}
                    {chat.is_group && (
                      <div className="text-[10px] text-gray-400 truncate mt-0.5 max-w-[95%]">
                        {chat.participants && chat.participants.length > 0
                          ? `${chat.participants[0].user.full_name}${chat.participants.length > 1 ? ` +${chat.participants.length - 1}` : ''}`
                          : 'No participants'}
                      </div>
                    )}

                    {/* Message preview with proper truncation */}
                    <div className="text-[10px] text-gray-500 truncate mt-0.5 max-w-[95%]">
                      {chat.last_message ? (
                        chat.is_group && chat.last_message.sender ?
                          `${chat.last_message.sender.full_name}: ${chat.last_message.content}` :
                          chat.last_message.content
                      ) : 'No messages yet'}
                    </div>
                  </div>

                  {/* Display avatars for group chats at middle-right */}
                  {chat.is_group && chat.participants && chat.participants.length > 0 && (
                    <div className="flex -space-x-2 ml-1">
                      {chat.participants.slice(0, 3).map((participant, index) => (
                        <div key={index} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200 relative shadow-sm">
                          {participant.user.avatar_url ? (
                            <Image
                              src={participant.user.avatar_url}
                              alt={participant.user.full_name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-[8px] font-semibold">
                              {participant.user.full_name.charAt(0)}
                            </div>
                          )}
                        </div>
                      ))}
                      {chat.participants.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 shadow-sm">
                          +{chat.participants.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom section with phone number and timestamp */}
                <div className="mt-auto">
                  {/* Phone number and timestamp in a flex container */}
                  <div className="flex justify-between items-center">
                    {/* Phone number in light grey container */}
                    <div className="flex items-center text-[10px]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="bg-gray-100 text-gray-500 rounded-md px-1.5 py-0.5 shadow-sm">
                        {chat.phone || '+91 99778 44598'}
                      </span>
                    </div>

                    {/* Timestamp at bottom-right */}
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                      {chat.last_message ? formatDate(chat.last_message.created_at) : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
