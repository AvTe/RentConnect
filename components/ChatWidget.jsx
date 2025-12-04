'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, Send, X, Search, ChevronLeft, MoreVertical,
  Phone, Mail, User, Clock, Check, CheckCheck, Image, Paperclip
} from 'lucide-react';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
  getOrCreateConversation,
  getTotalUnreadCount
} from '@/lib/database';

export const ChatWidget = ({ user, isOpen, onClose, initialRecipient = null }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const result = await getUserConversations(user.id);
      if (result.success) {
        setConversations(result.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [user?.id]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const result = await getTotalUnreadCount(user.id);
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchConversations();
      fetchUnreadCount();
      setLoading(false);
    }
  }, [isOpen, user?.id, fetchConversations, fetchUnreadCount]);

  // Handle initial recipient (for starting new chat)
  useEffect(() => {
    if (initialRecipient && user?.id && isOpen) {
      startNewConversation(initialRecipient);
    }
  }, [initialRecipient, user?.id, isOpen]);

  // Start a new conversation with someone
  const startNewConversation = async (recipient) => {
    try {
      const result = await getOrCreateConversation(user.id, recipient.id);
      if (result.success) {
        const conv = {
          ...result.data,
          otherParticipant: recipient,
          unreadCount: 0
        };
        
        // Add to conversations if not exists
        setConversations(prev => {
          const exists = prev.find(c => c.id === conv.id);
          if (!exists) return [conv, ...prev];
          return prev;
        });
        
        selectConversation(conv);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Select a conversation and load messages
  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    
    // Unsubscribe from previous conversation
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      // Fetch messages
      const result = await getConversationMessages(conversation.id);
      if (result.success) {
        setMessages(result.data);
      }

      // Mark as read
      await markMessagesAsRead(conversation.id, user.id);
      
      // Update local unread count
      setConversations(prev => prev.map(c => 
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      ));
      fetchUnreadCount();

      // Subscribe to new messages
      unsubscribeRef.current = subscribeToMessages(conversation.id, (newMsg) => {
        setMessages(prev => [...prev, newMsg]);
        
        // Mark as read if chat is open
        if (newMsg.sender_id !== user.id) {
          markMessagesAsRead(conversation.id, user.id);
        }
      });

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const result = await sendMessage(
        selectedConversation.id,
        user.id,
        messageText
      );

      if (!result.success) {
        setNewMessage(messageText); // Restore message on failure
        alert('Failed to send message');
      } else {
        // Update conversation in list
        setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id 
            ? { ...c, last_message: messageText, last_message_at: new Date().toISOString() }
            : c
        ).sort((a, b) => new Date(b.last_message_at || b.updated_at) - new Date(a.last_message_at || a.updated_at)));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    } finally {
      setSending(false);
      messageInputRef.current?.focus();
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const name = conv.otherParticipant?.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-4 md:right-4 md:w-96 md:h-[600px] bg-white md:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
        {selectedConversation ? (
          <>
            <button 
              onClick={() => setSelectedConversation(null)} 
              className="p-1 hover:bg-white/20 rounded-lg mr-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {selectedConversation.otherParticipant?.avatar ? (
                  <img 
                    src={selectedConversation.otherParticipant.avatar} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {selectedConversation.otherParticipant?.name || 'Unknown'}
                </p>
                <p className="text-xs text-blue-100 truncate">
                  {selectedConversation.otherParticipant?.role === 'agent' ? 'Agent' : 'Tenant'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Messages</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 rounded-full text-xs">
                  {unreadCount}
                </span>
              )}
            </div>
          </>
        )}
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      {selectedConversation ? (
        /* Messages View */
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Send a message to start the conversation</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwn = msg.sender_id === user.id;
                const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_id !== msg.sender_id);
                
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2 flex-shrink-0">
                        {msg.sender?.avatar ? (
                          <img src={msg.sender.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                    )}
                    {!isOwn && !showAvatar && <div className="w-8 mr-2" />}
                    
                    <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                      <div 
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn 
                            ? 'bg-blue-600 text-white rounded-br-md' 
                            : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : ''}`}>
                        <span>{formatTime(msg.created_at)}</span>
                        {isOwn && (
                          msg.read_at ? (
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`p-2 rounded-full ${
                  newMessage.trim() && !sending
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400'
                } transition-colors`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </>
      ) : (
        /* Conversations List */
        <>
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-center">No conversations yet</p>
                <p className="text-sm text-center mt-1">
                  Start chatting with agents or tenants from their profile
                </p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      {conv.otherParticipant?.avatar ? (
                        <img 
                          src={conv.otherParticipant.avatar} 
                          alt="" 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conv.otherParticipant?.name || 'Unknown'}
                      </p>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {formatTime(conv.last_message_at || conv.updated_at)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {conv.last_message || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Floating Chat Button Component
export const ChatButton = ({ user, onClick, unreadCount = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 flex items-center justify-center z-40"
    >
      <MessageCircle className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

// Hook to use chat functionality
export const useChat = (user) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialRecipient, setInitialRecipient] = useState(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const result = await getTotalUnreadCount(user.id);
      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const openChat = (recipient = null) => {
    setInitialRecipient(recipient);
    setIsOpen(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setInitialRecipient(null);
    fetchUnreadCount();
  };

  return {
    isOpen,
    unreadCount,
    openChat,
    closeChat,
    initialRecipient,
    refreshUnread: fetchUnreadCount
  };
};

export default ChatWidget;
