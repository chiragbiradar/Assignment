'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, DEFAULT_USER } from '@/lib/supabase';
import { Message, User } from '@/lib/supabase';
import { db } from '@/lib/db';
import Image from 'next/image';
import { FiPaperclip, FiMic, FiSmile, FiMoreVertical, FiSearch, FiHelpCircle, FiSettings } from 'react-icons/fi';
import { GrAttachment } from 'react-icons/gr';
import { BsEmojiSmile, BsChevronUp, BsChatDotsFill } from 'react-icons/bs';
import { FaRegClock, FaMicrophone, FaListUl } from 'react-icons/fa6';
import { AiOutlineHistory } from 'react-icons/ai';
import { HiOutlineSparkles } from 'react-icons/hi';
import { PiTextAlignLeftFill } from 'react-icons/pi';
import { IoInformationCircleOutline, IoSend } from 'react-icons/io5';
import { MdOutlineInstallDesktop } from 'react-icons/md';
import { BiSolidBellOff } from 'react-icons/bi';
import { TbStarsFilled, TbLayoutSidebarLeftExpandFilled } from 'react-icons/tb';
import { v4 as uuidv4 } from 'uuid';

type ChatInfo = {
  id: string;
  name: string;
  is_group: boolean;
  participants: {
    user: User;
  }[];
};

export default function ChatArea({ chatId, hideTopNav = false }: { chatId: string, hideTopNav?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = DEFAULT_USER;
  const userPresence = {};
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle clicking outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch chat info and messages
  useEffect(() => {
    if (!chatId || !user) return;

    const fetchChatInfo = async () => {
      setLoading(true);

      // Get chat details
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          id,
          name,
          is_group,
          chat_participants (
            user:users (*)
          )
        `)
        .eq('id', chatId)
        .single();

      if (chatError) {
        console.error('Error fetching chat info:', chatError);
        setLoading(false);
        return;
      }

      // If no chat data is found, create a default chat info
      if (!chatData) {
        console.log('No chat data found, using default chat info');
        setChatInfo({
          id: chatId,
          name: 'Chat',
          is_group: false,
          participants: []
        });
        setLoading(false);
        return;
      }

      // If it's not a group chat and doesn't have a name, use the other participant's name
      let chatName = chatData.name || 'Chat';
      if (!chatData.is_group && !chatName) {
        const otherParticipants = chatData.chat_participants
          ?.filter((p: any) => p.user?.id !== user?.id)
          ?.map((p: any) => p.user?.full_name || 'Unknown') || [];
        chatName = otherParticipants.length > 0 ? otherParticipants.join(', ') : 'Chat';
      }

      setChatInfo({
        id: chatData.id,
        name: chatName,
        is_group: chatData.is_group || false,
        participants: chatData.chat_participants || []
      });

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          chat_id,
          sender_id,
          content,
          created_at,
          is_read
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        // Continue with empty messages array instead of returning
        setMessages([]);
        setLoading(false);
      } else {
        setMessages(messagesData || []);
        setLoading(false);

        // Mark messages as read
        const unreadMessages = messagesData
          ?.filter(m => !m.is_read && m.sender_id !== user.id)
          .map(m => m.id) || [];

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages);
        }
      }
    };

    fetchChatInfo();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        payload => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);

          // Mark message as read if it's not from the current user
          if (newMessage.sender_id !== user.id) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chatId, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !chatId) return;

    const messageId = uuidv4();
    const now = new Date().toISOString();

    // Optimistically add message to UI
    const newMsg: Message = {
      id: messageId,
      chat_id: chatId,
      sender_id: user.id,
      content: newMessage,
      created_at: now,
      is_read: false
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');

    try {
      // Store in local DB first (for offline support)
      await db.messages.add({
        ...newMsg,
        synced: navigator.onLine
      });

      // Send to Supabase if online
      if (navigator.onLine) {
        const { error } = await supabase
          .from('messages')
          .insert(newMsg);

        if (error) throw error;

        // Update chat's updated_at timestamp
        await supabase
          .from('chats')
          .update({ updated_at: now })
          .eq('id', chatId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Could add error handling UI here
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach(message => {
    const date = new Date(message.created_at).toDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!chatInfo) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ position: 'relative' }}>
      {/* Chat header - second highest z-index - only show if hideTopNav is false */}
      {!hideTopNav && (
        <div className="px-3 py-2 flex items-center justify-between border-b bg-gray-50" style={{ position: 'relative', zIndex: 40 }}>
          <div className="flex items-center">
            <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-200 mr-3">
              {chatInfo.participants && chatInfo.participants[0]?.user?.avatar_url ? (
                <Image
                  src={chatInfo.participants[0].user.avatar_url}
                  alt={chatInfo.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xl font-semibold">
                  {chatInfo.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">{chatInfo.name}</h2>
              <p className="text-xs text-gray-500 flex items-center">
                {chatInfo.is_group
                  ? `${chatInfo.participants?.length || 0} participants`
                  : 'Roshang Artel, Roshang Jio, Bharat Kumar Ramesh, Periskope'}
                {!chatInfo.is_group && chatInfo.participants && chatInfo.participants.length > 0 && (
                  <span className="ml-2 flex items-center">
                    <span className="text-xs text-gray-400">last seen recently</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages area - lower z-index */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100" style={{ position: 'relative', zIndex: 30 }}>
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex justify-center my-3">
              <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-500">
                {formatDate(date)}
              </div>
            </div>
            {msgs.map((message) => (
              <div
                key={message.id}
                className={`flex mb-3 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender_id !== user?.id && (
                  <div className="w-8 h-8 relative rounded-full overflow-hidden bg-gray-200 mr-2 mt-1 flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-sm font-semibold">
                      R
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    message.sender_id === user?.id
                      ? 'bg-green-100 text-gray-800'
                      : 'bg-white text-gray-800'
                  }`}
                >
                  {message.sender_id !== user?.id && (
                    <div className="text-xs font-medium text-green-600 mb-1">
                      Periskope
                    </div>
                  )}
                  <div className="text-sm">{message.content}</div>
                  <div className="text-right mt-1 flex items-center justify-end">
                    <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
                    {message.sender_id === user?.id && (
                      <>
                        {message.is_read ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input - lower z-index */}
      <div className="p-2 border-t bg-white" style={{ position: 'relative', zIndex: 30 }}>
        <div className="flex flex-col">
          {/* Text area and send button */}
          <div className="flex items-center mb-2">
            <textarea
              placeholder="Message..."
              className="flex-1 py-2 px-4 rounded-md bg-white border border-gray-200 focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              className="ml-2 text-green-500 hover:text-green-600 transition-colors"
              onClick={sendMessage}
            >
              <IoSend className="h-6 w-6" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-2">
            <div className="flex space-x-4">
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <GrAttachment className="h-5 w-5" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <BsEmojiSmile className="h-5 w-5" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <FaRegClock className="h-5 w-5" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <AiOutlineHistory className="h-5 w-5" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <HiOutlineSparkles className="h-5 w-5" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <PiTextAlignLeftFill className="h-5 w-5" />
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <FaMicrophone className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Periskope branding with dropdown at bottom right */}
        <div className="absolute bottom-2 right-3 z-40" ref={dropdownRef}>
          <button
            className="flex items-center text-xs text-gray-400 hover:text-gray-600 transition-colors focus:outline-none border border-gray-200 rounded-md px-2 py-1 shadow-sm hover:shadow-md"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-1">
              <span className="text-white text-[8px] font-bold">P</span>
            </div>
            <span className="mr-1">Periskope</span>
            <BsChevronUp className={`h-3 w-3 transition-transform ${dropdownOpen ? '' : 'transform rotate-180'}`} />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute bottom-6 right-0 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-48">
              <ul>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <IoInformationCircleOutline className="mr-2 h-4 w-4" />
                    About Periskope
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
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
