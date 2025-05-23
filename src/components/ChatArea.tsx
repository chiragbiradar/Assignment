'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Message, User } from '@/lib/supabase';
import { db, syncOfflineMessages } from '@/lib/db';
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
import GroupContactInfoBar from './GroupContactInfoBar';
import AttachmentUploader, { AttachmentFile } from './AttachmentUploader';
import MessageAttachment from './MessageAttachment';
import { uploadAttachment, getFileType } from '@/lib/fileUpload';
import { handleSupabaseError } from '@/utils/errorHandling';

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
  const [user, setUser] = useState<any>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentFile | null>(null);
  const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
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

  // Fetch chat info and messages
  useEffect(() => {
    if (!chatId || !user) return;

    const fetchChatInfo = async () => {
      setLoading(true);
      console.log('Fetching chat info for chat ID:', chatId);

      try {
        // Get chat details
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
            )
          `)
          .eq('id', chatId)
          .single();

        if (chatError) {
          handleSupabaseError(chatError, 'Error fetching chat info', () => {
            // Create a default chat info as fallback
            setChatInfo({
              id: chatId,
              name: 'Chat',
              is_group: false,
              participants: []
            });
          });
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

        console.log('Chat data:', chatData);

        // Get other participants (not the current user)
        const otherParticipants = (chatData.chat_participants || [])
          .filter(p => p.user_id !== user.id)
          .map(p => ({
            user: p.users
          }));

        // If it's not a group chat and doesn't have a name, use the other participant's name
        let chatName = chatData.name;
        if (!chatData.is_group && !chatName && otherParticipants.length > 0) {
          chatName = otherParticipants[0].user.full_name;
        }

        setChatInfo({
          id: chatData.id,
          name: chatName || 'Chat',
          is_group: chatData.is_group || false,
          participants: chatData.chat_participants?.map(p => ({
            user: p.users
          })) || []
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
          handleSupabaseError(messagesError, 'Error fetching messages', () => {
            // Continue with empty messages array as fallback
            setMessages([]);
          });
          setLoading(false);
        } else {
          console.log('Found', messagesData?.length || 0, 'messages');
          setMessages(messagesData || []);
          setLoading(false);

          // Mark messages as read
          const unreadMessages = messagesData
            ?.filter(m => !m.is_read && m.sender_id !== user.id)
            .map(m => m.id) || [];

          if (unreadMessages.length > 0) {
            console.log('Marking', unreadMessages.length, 'messages as read');
            const { error: readError } = await supabase
              .from('messages')
              .update({ is_read: true })
              .in('id', unreadMessages);

            if (readError) {
              console.error('Error marking messages as read:', readError);
            } else {
              console.log('Messages marked as read successfully');

              // Update the messages in the local state to reflect read status
              setMessages(prev =>
                prev.map(msg =>
                  unreadMessages.includes(msg.id)
                    ? { ...msg, is_read: true }
                    : msg
                )
              );
            }
          }
        }
      } catch (error) {
        handleSupabaseError(error, 'Error in fetchChatInfo', () => {
          // Create a default chat info as fallback
          setChatInfo({
            id: chatId,
            name: 'Chat',
            is_group: false,
            participants: []
          });
          setMessages([]);
        });
        setLoading(false);
      }
    };

    fetchChatInfo();

    // Subscribe to new messages and updates
    console.log('Setting up real-time subscription for chat ID:', chatId);

    let subscription: any;

    try {
      subscription = supabase
        .channel(`chat:${chatId}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
          payload => {
            console.log('Received new message:', payload.new);
            const newMessage = payload.new as Message;
            setMessages(prev => {
              // Check if message with this ID already exists
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) {
                console.log(`Message with ID ${newMessage.id} already exists, not adding duplicate`);
                return prev;
              }
              return [...prev, newMessage];
            });

            // Mark message as read if it's not from the current user
            if (newMessage.sender_id !== user.id) {
              console.log('Marking new message as read');
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id)
                .then(({ error }) => {
                  if (error) {
                    console.error('Error marking message as read:', error);
                  } else {
                    console.log('Message marked as read successfully');

                    // Update the message in the local state to reflect read status
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === newMessage.id ? { ...msg, is_read: true } : msg
                      )
                    );
                  }
                });
            }
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
          payload => {
            console.log('Message updated:', payload.new);
            // Update the message in the state
            const updatedMessage = payload.new as Message;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            );
          }
        )
        .subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to chat channel:', `chat:${chatId}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to chat channel:', `chat:${chatId}`);
          }
        });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(subscription);
    };
  }, [chatId, user]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedAttachment) || !user || !chatId) return;
    if (sendingMessage) return;

    setSendingMessage(true);
    const messageId = uuidv4();
    const now = new Date().toISOString();

    console.log('Sending message:', newMessage, selectedAttachment ? 'with attachment' : '');

    // Prepare message object
    let newMsg: Message = {
      id: messageId,
      chat_id: chatId,
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: now,
      is_read: false,
      has_attachment: !!selectedAttachment,
      attachment_type: selectedAttachment ? getFileType(selectedAttachment.file) : undefined,
      attachment_name: selectedAttachment?.file.name,
      attachment_size: selectedAttachment?.file.size
    };

    try {
      // If there's an attachment, upload it first
      if (selectedAttachment) {
        // Update attachment status
        setSelectedAttachment({
          ...selectedAttachment,
          uploading: true,
          progress: 0
        });

        // Upload the file to Supabase Storage
        const uploadResult = await uploadAttachment(
          selectedAttachment.file,
          chatId,
          messageId,
          (progress) => {
            setSelectedAttachment(prev =>
              prev ? { ...prev, progress } : null
            );
          }
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload attachment');
        }

        // Update message with attachment URL
        newMsg.attachment_url = uploadResult.url;

        console.log('Attachment uploaded successfully:', uploadResult.url);
      }

      // Optimistically add message to UI
      setMessages(prev => {
        // Check if message with this ID already exists
        const exists = prev.some(msg => msg.id === newMsg.id);
        if (exists) {
          console.log(`Message with ID ${newMsg.id} already exists, not adding duplicate`);
          return prev;
        }
        return [...prev, newMsg];
      });

      setNewMessage('');
      setSelectedAttachment(null);
      setShowAttachmentUploader(false);

      // Store in local DB first (for offline support)
      await db.messages.add({
        ...newMsg,
        synced: navigator.onLine
      });

      console.log('Message stored in local DB');

      // Send to Supabase if online
      if (navigator.onLine) {
        console.log('Sending message to Supabase');
        const { error } = await supabase
          .from('messages')
          .insert(newMsg);

        if (error) {
          console.error('Error inserting message into Supabase:', error);
          throw error;
        }

        console.log('Message sent to Supabase successfully');

        // Update chat's updated_at timestamp
        const { error: updateError } = await supabase
          .from('chats')
          .update({ updated_at: now })
          .eq('id', chatId);

        if (updateError) {
          console.error('Error updating chat timestamp:', updateError);
        } else {
          console.log('Chat timestamp updated');
        }

        // Mark the message as synced in the local DB
        await db.messages.update(messageId, { synced: true });
        console.log('Message marked as synced in local DB');
      } else {
        console.log('Device is offline, message will be synced later');
        // We'll sync this message when the device comes back online
        window.addEventListener('online', async () => {
          console.log('Device is back online, syncing pending messages');
          await syncOfflineMessages(supabase);
        }, { once: true });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error in attachment uploader if it's an attachment error
      if (selectedAttachment) {
        setSelectedAttachment({
          ...selectedAttachment,
          uploading: false,
          error: 'Failed to upload attachment'
        });
      }
    } finally {
      setSendingMessage(false);
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

  // Group messages by date and ensure no duplicates
  const groupedMessages: { [date: string]: Message[] } = {};
  const processedMessageIds = new Set<string>();

  messages.forEach(message => {
    // Skip if we've already processed this message ID
    if (processedMessageIds.has(message.id)) {
      console.log(`Skipping duplicate message with ID: ${message.id}`);
      return;
    }

    // Add to processed set
    processedMessageIds.add(message.id);

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
      {/* Chat header - lower z-index than sidebar but higher than content - only show if hideTopNav is false */}
      {!hideTopNav && (
        <div className="px-3 py-2 flex items-center justify-between border-b bg-gray-50" style={{ position: 'relative', zIndex: 70 }}>
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
                  : 'Roshang Artel, Roshang Jio, Bharat Kumar Ramesh, whatsapp'}
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

      {/* Group/Contact Info Bar - positioned below navbar with lower z-index */}
      <GroupContactInfoBar
        groupName={chatInfo?.name || 'Test El Centro'}
        participants={chatInfo?.participants?.map(p => ({
          id: p.user.id,
          full_name: p.user.full_name,
          avatar_url: p.user.avatar_url
        })) || []}
        isGroup={chatInfo?.is_group || false}
        onViewDetails={() => console.log('View details clicked')}
      />

      {/* Messages area - lower z-index */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100" style={{ position: 'relative', zIndex: 30 }}>
        {Object.entries(groupedMessages).map(([date, msgs], dateIndex) => (
          <div key={`date-group-${date}-${dateIndex}`}>
            <div className="flex justify-center my-3">
              <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-500">
                {formatDate(date)}
              </div>
            </div>
            {msgs.map((message, msgIndex) => (
              <div
                key={`msg-${message.id}-${msgIndex}`}
                className={`flex mb-3 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender_id !== user?.id && (
                  <div className="w-8 h-8 relative rounded-full overflow-hidden bg-gray-200 mr-2 mt-1 flex-shrink-0">
                    {chatInfo?.participants?.find(p => p.user.id === message.sender_id)?.user.avatar_url ? (
                      <Image
                        src={chatInfo.participants.find(p => p.user.id === message.sender_id)?.user.avatar_url || ''}
                        alt="User avatar"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-sm font-semibold">
                        {chatInfo?.participants?.find(p => p.user.id === message.sender_id)?.user.full_name.charAt(0) || '?'}
                      </div>
                    )}
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
                      {chatInfo?.participants?.find(p => p.user.id === message.sender_id)?.user.full_name || 'Unknown User'}
                    </div>
                  )}
                  {/* Attachment if present */}
                  {message.has_attachment && (
                    <MessageAttachment message={message} />
                  )}

                  {/* Message content */}
                  {message.content && (
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  )}

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
              className="flex-1 py-2 px-4 rounded-md bg-white border border-gray-200 text-gray-900 focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-none"
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

          {/* Attachment uploader */}
          {showAttachmentUploader && (
            <div className="mb-3">
              <AttachmentUploader
                onAttachmentSelect={setSelectedAttachment}
                selectedAttachment={selectedAttachment}
              />
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between px-2">
            <div className="flex space-x-4">
              <button
                className={`transition-colors ${showAttachmentUploader ? 'text-green-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setShowAttachmentUploader(!showAttachmentUploader)}
              >
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

        {/* whatsapp branding with dropdown at bottom right */}
        <div className="absolute bottom-2 right-3 z-40" ref={dropdownRef}>
          <button
            className="flex items-center text-xs text-gray-400 hover:text-gray-600 transition-colors focus:outline-none border border-gray-200 rounded-md px-2 py-1 shadow-sm hover:shadow-md"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-1">
              <span className="text-white text-[8px] font-bold">P</span>
            </div>
            <span className="mr-1">whatsapp</span>
            <BsChevronUp className={`h-3 w-3 transition-transform ${dropdownOpen ? '' : 'transform rotate-180'}`} />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute bottom-6 right-0 bg-white rounded-md shadow-lg border border-gray-200 py-1 w-48">
              <ul>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <IoInformationCircleOutline className="mr-2 h-4 w-4" />
                    About whatsapp
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
