'use client';

import { useState, useEffect } from 'react';
import { supabase, DEFAULT_USER } from '@/lib/supabase';
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
};

// Function to create mock chats for development
const createMockChats = (currentUser: User): ChatWithLastMessage[] => {
  const now = new Date();

  // Create mock chats to match the image
  return [
    {
      id: uuidv4(),
      name: 'Test El Centro',
      is_group: true,
      created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: {
        content: 'Hello, South Euna!',
        created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        sender: {
          full_name: 'Roshang Artel'
        }
      },
      participants: [
        {
          user: {
            full_name: 'Roshang Artel',
            avatar_url: null
          }
        },
        {
          user: {
            full_name: 'Roshang Jio',
            avatar_url: null
          }
        },
        {
          user: {
            full_name: 'Bharat Kumar Ramesh',
            avatar_url: null
          }
        },
        {
          user: {
            full_name: 'Periskope',
            avatar_url: null
          }
        }
      ],
      labels: [
        {
          name: 'CVFER',
          color: '#4CAF50'
        }
      ],
      phone: '+91 99999 99999',
      unread_count: 2
    },
    {
      id: uuidv4(),
      name: 'Test Skope Final 5',
      is_group: false,
      created_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: {
        content: 'Support? This doesn\'t go on Tuesday...',
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        sender: {
          full_name: 'Test Skope Final'
        }
      },
      participants: [
        {
          user: {
            full_name: 'Test Skope Final 5',
            avatar_url: null
          }
        }
      ],
      phone: '+91 99778 44598 +1',
      unread_count: 1
    },
    {
      id: uuidv4(),
      name: 'Periskope Team Chat',
      is_group: true,
      created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: {
        content: 'Periskope: Test message',
        created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        sender: {
          full_name: 'Periskope'
        }
      },
      participants: [
        {
          user: {
            full_name: 'Periskope',
            avatar_url: null
          }
        }
      ],
      labels: [
        {
          name: 'Demo',
          color: '#FFC107'
        },
        {
          name: 'Internal',
          color: '#4CAF50'
        }
      ],
      phone: '+91 99778 44598 +3',
      unread_count: 0
    },
    {
      id: uuidv4(),
      name: '+91 99999 99999',
      is_group: false,
      created_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: {
        content: 'Hi there, I\'m Swapnika, Co-Founder of...',
        created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        sender: {
          full_name: 'Swapnika'
        }
      },
      participants: [
        {
          user: {
            full_name: 'Swapnika',
            avatar_url: null
          }
        }
      ],
      labels: [
        {
          name: 'Demo',
          color: '#FFC107'
        },
        {
          name: 'Signup',
          color: '#2196F3'
        }
      ],
      phone: '+91 99999 99999 +1',
      unread_count: 0
    },
    {
      id: uuidv4(),
      name: 'Test Demo17',
      is_group: false,
      created_at: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: {
        content: 'Rohosen 123',
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        sender: {
          full_name: 'Test Demo17'
        }
      },
      participants: [
        {
          user: {
            full_name: 'Test Demo17',
            avatar_url: null
          }
        }
      ],
      labels: [
        {
          name: 'Content',
          color: '#4CAF50'
        },
        {
          name: 'Demo',
          color: '#FFC107'
        }
      ],
      phone: '+91 99778 44598 +1',
      unread_count: 0
    },
    {
      id: uuidv4(),
      name: 'Test El Centro',
      is_group: false,
      created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: {
        content: 'Rohitagi Hello, Ahmadpur!',
        created_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        sender: {
          full_name: 'Test El Centro'
        }
      },
      participants: [
        {
          user: {
            full_name: 'Test El Centro',
            avatar_url: null
          }
        }
      ],
      labels: [
        {
          name: 'Demo',
          color: '#FFC107'
        }
      ],
      phone: '+91 99778 44598',
      unread_count: 0
    },
    {
      id: uuidv4(),
      name: 'Testing group',
      is_group: true,
      created_at: new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: {
        content: 'Testing 12345',
        created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        sender: {
          full_name: 'Testing group'
        }
      },
      participants: [
        {
          user: {
            full_name: 'Testing group',
            avatar_url: null
          }
        }
      ],
      labels: [
        {
          name: 'Demo',
          color: '#FFC107'
        }
      ],
      phone: '+91 99999 99999',
      unread_count: 0
    },
    {
      id: uuidv4(),
      name: 'Yasin 3',
      is_group: false,
      created_at: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      last_message: {
        content: 'First Bulk Message',
        created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        sender: {
          full_name: 'Yasin 3'
        }
      },
      participants: [
        {
          user: {
            full_name: 'Yasin 3',
            avatar_url: null
          }
        }
      ],
      labels: [
        {
          name: 'Demo',
          color: '#FFC107'
        },
        {
          name: 'Dont Send',
          color: '#F44336'
        }
      ],
      phone: '+91 99778 44598 +3',
      unread_count: 0
    }
  ];
};

export default function Sidebar({ onChatSelect, hideTopNav = false }: SidebarProps) {
  const [chats, setChats] = useState<ChatWithLastMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [customFilter, setCustomFilter] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const user = DEFAULT_USER;
  const userPresence = {};
  const router = useRouter();

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
          return;
        }

        // Check if participantData is defined and is an array
        if (!participantData || !Array.isArray(participantData)) {
          console.log("No chat participants found or using mock data");
          // For development, create some mock chats
          if (process.env.NODE_ENV === 'development') {
            setChats(createMockChats(user));
          }
          return;
        }

        console.log("Found", participantData.length, "chats for user");
        const chatIds = participantData.map(p => p.chat_id);

        if (chatIds.length === 0) return;

        // Get chat details with last message
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select(`
            id,
            name,
            is_group,
            created_at,
            updated_at,
            chat_participants!inner (
              user:users (
                full_name,
                avatar_url
              )
            ),
            chat_labels (
              label:labels (
                name,
                color
              )
            ),
            messages (
              content,
              created_at,
              sender:users (
                full_name
              )
            )
          `)
          .in('id', chatIds)
          .order('updated_at', { ascending: false });

        if (chatError) {
          console.error('Error fetching chats:', chatError);
          return;
        }

        // Check if chatData is defined and is an array
        if (!chatData || !Array.isArray(chatData)) {
          console.log("No chat data found");
          return;
        }

        console.log("Processing", chatData.length, "chats");

        // Process the data to get the last message for each chat
        const processedChats = chatData.map(chat => {
          const messages = chat.messages || [];
          const lastMessage = messages.length > 0
            ? messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            : undefined;

          // Format the chat data
          return {
            id: chat.id,
            name: chat.name || chat.chat_participants
              .filter(p => p.user.full_name !== user.full_name)
              .map(p => p.user.full_name)
              .join(', '),
            is_group: chat.is_group,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            last_message: lastMessage,
            participants: chat.chat_participants,
            labels: chat.chat_labels?.map(cl => cl.label) || [],
            unread_count: messages.filter(m => !m.is_read && m.sender?.id !== user.id).length
          };
        });

        setChats(processedChats);
      } catch (error) {
        console.error("Error in fetchChats:", error);
        // For development, create some mock chats if there's an error
        if (process.env.NODE_ENV === 'development') {
          console.log("Using mock chats due to error");
          setChats(createMockChats(user));
        }
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
      {/* Left navigation bar - highest z-index (80) */}
      <div className="w-14 bg-gray-100 flex flex-col items-center py-4 border-r" style={{ position: 'relative', zIndex: 80 }}>
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-6">
          <Image
            src="/whatsapp-logo.svg"
            alt="WhatsApp"
            width={20}
            height={20}
          />
        </div>
        <div className="flex flex-col h-full">
          {/* Main icons */}
          <div className="flex flex-col space-y-6 items-center">
            {/* Home icon */}
            <button className="text-gray-500 hover:text-green-500">
              <IoHomeSharp className="h-4 w-4" />
            </button>
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
            {/* Media/Gallery icon */}
            <button className="text-gray-500 hover:text-green-500">
              <RiFolderImageFill className="h-4 w-4" />
            </button>
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
      <div className="w-80 flex flex-col bg-white border-r border-gray-200" style={{ position: 'relative', zIndex: 40 }}>
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
                  <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
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
              className="flex items-start p-3 border-b hover:bg-gray-50 cursor-pointer"
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

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-medium text-gray-900 truncate">{chat.name}</h3>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap ml-1">
                    {chat.last_message ? formatDate(chat.last_message.created_at) : ''}
                  </span>
                </div>

                {chat.is_group && (
                  <div className="text-[10px] text-gray-400 truncate mt-0.5">
                    {chat.participants?.map(p => p.user.full_name).join(', ')}
                  </div>
                )}

                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                  {chat.last_message ? (
                    chat.is_group && chat.last_message.sender ?
                      `${chat.last_message.sender.full_name}: ${chat.last_message.content}` :
                      chat.last_message.content
                  ) : 'No messages yet'}
                </div>

                {/* Phone number or additional info */}
                <div className="flex items-center text-[10px] text-gray-400 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {chat.phone || '+91 99778 44598'}
                </div>

                {/* Labels */}
                <div className="flex mt-1 space-x-1">
                  {chat.labels && chat.labels.map((label, index) => (
                    <div
                      key={index}
                      className="px-1.5 py-0.5 rounded text-[10px] text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
