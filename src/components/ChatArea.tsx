'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Message, User } from '@/lib/supabase';
import { db } from '@/lib/db';
import Image from 'next/image';
import { FiSend, FiPaperclip, FiMic, FiSmile, FiMoreVertical, FiSearch } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

type ChatInfo = {
  id: string;
  name: string;
  is_group: boolean;
  participants: {
    user: User;
  }[];
};

export default function ChatArea({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="h-full flex flex-col relative chat-container">
      {/* Chat header */}
      <div className="px-3 py-2 flex items-center justify-between border-b bg-gray-50 top-navbar">
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

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 right-sidebar">
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-2 border-t bg-white relative right-sidebar">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-2">
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            placeholder="Message..."
            className="flex-1 py-2 px-4 rounded-md bg-white border border-gray-200 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            className="ml-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white"
            onClick={sendMessage}
          >
            {newMessage.trim() ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        </div>

        {/* WhatsApp branding at bottom right */}
        <div className="absolute bottom-2 right-3 flex items-center text-xs text-gray-400">
          <span className="mr-1">Periskope</span>
        </div>
      </div>
    </div>
  );
}
