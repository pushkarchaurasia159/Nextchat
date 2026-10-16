import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { playSendSound, playReceiveSound, playReactionSound, playPopSound } from '../utils/sound';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, token, soundEnabled } = useAuth();
  const { socket, onlineUsersMap } = useSocket();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [tabFilter, setTabFilter] = useState('all'); // 'all', 'unread', 'groups', 'ai'

  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingChats(true);
      const res = await fetch('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoadingChats(false);
    }
  }, [token]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Fetch messages for active chat
  const fetchMessages = useCallback(async (chatId) => {
    if (!token || !chatId) return;
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [token]);

  // Select active chat
  const selectChat = useCallback(async (chatId) => {
    if (!chatId) {
      setActiveChatId(null);
      setActiveChat(null);
      setMessages([]);
      setReplyingTo(null);
      return;
    }

    if (activeChatIdRef.current && socket) {
      socket.emit('leave_chat', activeChatIdRef.current);
    }

    setActiveChatId(chatId);
    setReplyingTo(null);
    playPopSound(soundEnabled);

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveChat(data.chat);
      }
    } catch (e) {
      console.error('Error fetching single chat info:', e);
    }

    if (socket) {
      socket.emit('join_chat', chatId);
      socket.emit('read_messages', { chatId });
    }

    setChats(prev =>
      prev.map(c => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );

    fetchMessages(chatId);
  }, [token, socket, soundEnabled, fetchMessages]);

  // Send message
  const sendMessage = async ({
    content,
    type = 'TEXT',
    file = null,
    replyToId = null,
    selfDestructDuration = null,
    pollData = null
  }) => {
    if (!activeChatId || !token) return;

    if (file) {
      const formData = new FormData();
      if (content) formData.append('content', content);
      formData.append('type', type);
      if (replyToId) formData.append('replyToId', replyToId);
      if (selfDestructDuration) formData.append('selfDestructDuration', selfDestructDuration);
      formData.append('media', file);

      try {
        const res = await fetch(`/api/chats/${activeChatId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (data.success && data.message) {
          setMessages(prev => [...prev, data.message]);
          setReplyingTo(null);
          playSendSound(soundEnabled);
          if (socket) {
            socket.emit('send_message', {
              chatId: activeChatId,
              ...data.message
            });
          }
          fetchChats();
          return data.message;
        } else {
          throw new Error(data.message || 'Failed to send media');
        }
      } catch (err) {
        console.error('Error uploading media:', err);
        throw err;
      }
    } else {
      if (socket) {
        socket.emit('send_message', {
          chatId: activeChatId,
          content,
          type,
          replyToId,
          selfDestructDuration,
          pollData
        });
        setReplyingTo(null);
        playSendSound(soundEnabled);
      }
    }
  };

  // Toggle emoji reaction
  const reactToMessage = async (messageId, emoji) => {
    if (!token) return;
    playReactionSound(soundEnabled);
    try {
      const res = await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emoji })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? data.message : m))
        );
        if (socket && activeChatId) {
          socket.emit('react_message', {
            chatId: activeChatId,
            messageId,
            emoji,
            reactions: data.reactions
          });
        }
      }
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  };

  // Pin / Unpin message
  const pinMessage = async (messageId) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/messages/${messageId}/pin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, isPinned: data.isPinned } : m))
        );
        if (socket && activeChatId) {
          socket.emit('pin_message', {
            chatId: activeChatId,
            messageId,
            isPinned: data.isPinned
          });
        }
      }
    } catch (err) {
      console.error('Error pinning message:', err);
    }
  };

  // Vote in Poll
  const votePoll = async (messageId, optionId) => {
    if (!token) return;
    playPopSound(soundEnabled);
    try {
      const res = await fetch(`/api/messages/${messageId}/poll/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ optionId })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? data.message : m))
        );
        if (socket && activeChatId) {
          socket.emit('poll_vote', {
            chatId: activeChatId,
            messageId,
            pollData: data.pollData
          });
        }
      }
    } catch (err) {
      console.error('Error voting in poll:', err);
    }
  };

  // Ask AI Assistant
  const askAI = async ({ prompt, type = 'CHAT', targetLanguage = 'Spanish' }) => {
    if (!token) return;
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          type,
          chatId: activeChatId,
          targetLanguage
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.message && activeChatId) {
          setMessages(prev => [...prev, data.message]);
          playReceiveSound(soundEnabled);
        }
        return data.response;
      } else {
        throw new Error(data.message || 'AI processing failed');
      }
    } catch (err) {
      console.error('Ask AI error:', err);
      throw err;
    }
  };

  // Delete message
  const deleteMessage = async (messageId, forEveryone = false) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/messages/${messageId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ forEveryone })
      });
      const data = await res.json();
      if (data.success) {
        if (forEveryone) {
          setMessages(prev =>
            prev.map(m => (m.id === messageId ? data.deletedMessage : m))
          );
        } else {
          setMessages(prev => prev.filter(m => m.id !== messageId));
        }
        fetchChats();
      } else {
        alert(data.message || 'Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Group Admin actions
  const addMembersToGroup = async (chatId, userIds) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/admin/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userIds })
      });
      const data = await res.json();
      if (data.success) {
        setActiveChat(data.chat);
        if (data.systemMessage) {
          setMessages(prev => [...prev, data.systemMessage]);
        }
        fetchChats();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      throw err;
    }
  };

  const removeMemberFromGroup = async (chatId, targetUserId) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/admin/members/${targetUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveChat(data.chat);
        if (data.systemMessage) {
          setMessages(prev => [...prev, data.systemMessage]);
        }
        fetchChats();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      throw err;
    }
  };

  const changeGroupRole = async (chatId, targetUserId, role) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/admin/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId, role })
      });
      const data = await res.json();
      if (data.success) {
        setActiveChat(data.chat);
        if (data.systemMessage) {
          setMessages(prev => [...prev, data.systemMessage]);
        }
        fetchChats();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      throw err;
    }
  };

  const updateGroupSettings = async (chatId, settings) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setActiveChat(data.chat);
        if (data.systemMessage) {
          setMessages(prev => [...prev, data.systemMessage]);
        }
        fetchChats();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      throw err;
    }
  };

  const updateGroupInfo = async (chatId, formData) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/info`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setActiveChat(data.chat);
        if (data.systemMessage) {
          setMessages(prev => [...prev, data.systemMessage]);
        }
        fetchChats();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      throw err;
    }
  };

  const leaveGroup = async (chatId) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        selectChat(null);
        fetchChats();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      throw err;
    }
  };

  const deleteChat = async (chatId) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (activeChatId === chatId) {
          selectChat(null);
        }
        fetchChats();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      throw err;
    }
  };

  const createDirectChat = async (targetUserId) => {
    try {
      const res = await fetch('/api/chats/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });
      const data = await res.json();
      if (data.success && data.chat) {
        await fetchChats();
        selectChat(data.chat.id);
        return data.chat;
      } else {
        throw new Error(data.message || 'Failed to create chat');
      }
    } catch (err) {
      throw err;
    }
  };

  const createGroupChat = async (formData) => {
    try {
      const res = await fetch('/api/chats/group', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.chat) {
        await fetchChats();
        selectChat(data.chat.id);
        return data.chat;
      } else {
        throw new Error(data.message || 'Failed to create group');
      }
    } catch (err) {
      throw err;
    }
  };

  // Socket listeners for incoming real-time events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ chatId, message }) => {
      if (activeChatIdRef.current === chatId) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        playReceiveSound(soundEnabled);
        socket.emit('read_messages', { chatId });
      }

      setChats(prev => {
        const index = prev.findIndex(c => c.id === chatId);
        if (index !== -1) {
          const updatedChat = {
            ...prev[index],
            latestMessage: message,
            updatedAt: message.createdAt,
            unreadCount:
              activeChatIdRef.current === chatId || message.senderId === user?.id
                ? 0
                : (prev[index].unreadCount || 0) + 1
          };
          const rest = prev.filter(c => c.id !== chatId);
          return [updatedChat, ...rest];
        }
        return prev;
      });
    };

    const handleMessageReaction = ({ chatId, messageId, emoji, reactions }) => {
      if (activeChatIdRef.current === chatId) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, reactions: typeof reactions === 'string' ? reactions : JSON.stringify(reactions) }
              : m
          )
        );
      }
    };

    const handleMessagePinned = ({ chatId, messageId, isPinned }) => {
      if (activeChatIdRef.current === chatId) {
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, isPinned } : m))
        );
      }
    };

    const handlePollUpdated = ({ chatId, messageId, pollData }) => {
      if (activeChatIdRef.current === chatId) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, pollData: typeof pollData === 'string' ? pollData : JSON.stringify(pollData) }
              : m
          )
        );
      }
    };

    const handleMessageExpired = ({ chatId, messageId }) => {
      if (activeChatIdRef.current === chatId) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    };

    const handleMessagesReadReceipt = ({ chatId, readByUserId }) => {
      if (activeChatIdRef.current === chatId) {
        setMessages(prev =>
          prev.map(m => (m.senderId === user?.id ? { ...m, status: 'READ' } : m))
        );
      }
    };

    const handleTyping = ({ chatId, userId, userName }) => {
      setTypingUsers(prev => {
        const currentList = prev[chatId] || [];
        if (currentList.some(u => u.userId === userId)) return prev;
        return {
          ...prev,
          [chatId]: [...currentList, { userId, userName }]
        };
      });
    };

    const handleStopTyping = ({ chatId, userId }) => {
      setTypingUsers(prev => {
        const currentList = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: currentList.filter(u => u.userId !== userId)
        };
      });
    };

    const handleChatNotification = ({ chatId, message }) => {
      fetchChats();
    };

    const handleGroupEvent = ({ chatId }) => {
      if (activeChatIdRef.current === chatId) {
        selectChat(chatId);
      }
      fetchChats();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_reaction', handleMessageReaction);
    socket.on('message_pinned', handleMessagePinned);
    socket.on('poll_updated', handlePollUpdated);
    socket.on('message_expired', handleMessageExpired);
    socket.on('messages_read_receipt', handleMessagesReadReceipt);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('chat_notification', handleChatNotification);
    socket.on('group_event', handleGroupEvent);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_reaction', handleMessageReaction);
      socket.off('message_pinned', handleMessagePinned);
      socket.off('poll_updated', handlePollUpdated);
      socket.off('message_expired', handleMessageExpired);
      socket.off('messages_read_receipt', handleMessagesReadReceipt);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('chat_notification', handleChatNotification);
      socket.off('group_event', handleGroupEvent);
    };
  }, [socket, user?.id, soundEnabled, selectChat, fetchChats]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        activeChat,
        messages,
        loadingChats,
        loadingMessages,
        typingUsers,
        replyingTo,
        setReplyingTo,
        searchFilter,
        setSearchFilter,
        tabFilter,
        setTabFilter,
        fetchChats,
        selectChat,
        sendMessage,
        reactToMessage,
        pinMessage,
        votePoll,
        askAI,
        deleteMessage,
        createDirectChat,
        createGroupChat,
        addMembersToGroup,
        removeMemberFromGroup,
        changeGroupRole,
        updateGroupSettings,
        updateGroupInfo,
        leaveGroup,
        deleteChat,
        onlineUsersMap
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
