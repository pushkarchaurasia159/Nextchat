const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// Map of active connected users: userId -> Set of socketIds
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Socket auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nextchat_jwt_secret');
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
          ghostMode: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: ' + err.message));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    const isGhost = socket.user.ghostMode;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user's personal private room for direct notifications
    socket.join(`user_${userId}`);

    // Update database status to online (if not in Ghost Mode)
    if (!isGhost) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true }
        });
        io.emit('user_status_change', {
          userId,
          isOnline: true,
          lastSeen: new Date()
        });
      } catch (e) {
        console.error('Error updating user online status:', e.message);
      }
    }

    // Join / Leave chat rooms
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    // Typing indicators (suppressed in ghost mode)
    socket.on('typing', ({ chatId, userName }) => {
      if (!socket.user.ghostMode) {
        socket.to(`chat_${chatId}`).emit('typing', {
          chatId,
          userId: socket.user.id,
          userName: userName || socket.user.name
        });
      }
    });

    socket.on('stop_typing', ({ chatId }) => {
      socket.to(`chat_${chatId}`).emit('stop_typing', {
        chatId,
        userId: socket.user.id
      });
    });

    // Real-time message dispatch
    socket.on('send_message', async (messageData) => {
      try {
        const {
          chatId,
          content,
          type = 'TEXT',
          mediaUrl,
          fileName,
          fileSize,
          replyToId,
          selfDestructDuration,
          pollData
        } = messageData;

        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { participants: true }
        });

        if (!chat) return;

        const myParticipant = chat.participants.find(p => p.userId === userId);
        if (!myParticipant) return;

        if (chat.isGroup && chat.adminOnlyMessage && myParticipant.role !== 'ADMIN') {
          socket.emit('error_message', { message: 'Only admins can send messages in this group' });
          return;
        }

        let expiresAt = null;
        let durationNumber = selfDestructDuration ? parseInt(selfDestructDuration) : null;
        if (durationNumber && durationNumber > 0) {
          expiresAt = new Date(Date.now() + durationNumber * 1000);
        }

        let finalPollData = null;
        let messageType = type;
        if (pollData) {
          finalPollData = typeof pollData === 'string' ? pollData : JSON.stringify(pollData);
          messageType = 'POLL';
        }

        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: userId,
            content: content ? content.trim() : null,
            type: messageType,
            mediaUrl,
            fileName,
            fileSize,
            replyToId: replyToId || null,
            selfDestructDuration: durationNumber,
            expiresAt,
            pollData: finalPollData,
            reactions: '{}',
            status: 'SENT'
          },
          include: {
            sender: {
              select: { id: true, name: true, phone: true, avatar: true }
            },
            replyTo: {
              include: {
                sender: { select: { id: true, name: true } }
              }
            }
          }
        });

        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() }
        });

        // Broadcast to chat room
        io.to(`chat_${chatId}`).emit('new_message', { chatId, message });

        // Notify participants
        chat.participants.forEach((p) => {
          if (p.userId !== userId) {
            io.to(`user_${p.userId}`).emit('chat_notification', {
              chatId,
              message,
              chatName: chat.isGroup ? chat.name : socket.user.name,
              isGroup: chat.isGroup
            });
          }
        });
      } catch (err) {
        console.error('Socket send_message error:', err);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });

    // Real-time Reaction
    socket.on('react_message', ({ chatId, messageId, emoji, reactions }) => {
      io.to(`chat_${chatId}`).emit('message_reaction', {
        chatId,
        messageId,
        emoji,
        userId: socket.user.id,
        reactions
      });
    });

    // Real-time Pin
    socket.on('pin_message', ({ chatId, messageId, isPinned }) => {
      io.to(`chat_${chatId}`).emit('message_pinned', {
        chatId,
        messageId,
        isPinned
      });
    });

    // Real-time Poll Vote
    socket.on('poll_vote', ({ chatId, messageId, pollData }) => {
      io.to(`chat_${chatId}`).emit('poll_updated', {
        chatId,
        messageId,
        pollData
      });
    });

    // Mark messages as read (unless in ghost mode)
    socket.on('read_messages', async ({ chatId }) => {
      if (socket.user.ghostMode) return;
      try {
        await prisma.chatParticipant.updateMany({
          where: { chatId, userId },
          data: { lastReadAt: new Date() }
        });

        await prisma.message.updateMany({
          where: {
            chatId,
            senderId: { not: userId },
            status: { not: 'READ' }
          },
          data: { status: 'READ' }
        });

        io.to(`chat_${chatId}`).emit('messages_read_receipt', {
          chatId,
          readByUserId: userId
        });
      } catch (e) {
        console.error('Socket read_messages error:', e.message);
      }
    });

    // Group update events
    socket.on('group_event', ({ chatId, type, data }) => {
      io.to(`chat_${chatId}`).emit('group_event', { chatId, type, data });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          if (!socket.user.ghostMode) {
            const lastSeen = new Date();
            try {
              await prisma.user.update({
                where: { id: userId },
                data: { isOnline: false, lastSeen }
              });
              io.emit('user_status_change', {
                userId,
                isOnline: false,
                lastSeen
              });
            } catch (e) {
              console.error('Error updating offline status:', e.message);
            }
          }
        }
      }
    });
  });
};

module.exports = { initializeSocket, onlineUsers };
