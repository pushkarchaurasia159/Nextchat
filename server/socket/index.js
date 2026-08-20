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
        select: { id: true, name: true, phone: true, avatar: true }
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

    // Add socket to user's active set
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user's personal private room for direct notifications
    socket.join(`user_${userId}`);

    // Update database status to online
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true }
      });
      // Broadcast online status to all
      io.emit('user_status_change', {
        userId,
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (e) {
      console.error('Error updating user online status:', e.message);
    }

    // Join specific chat room
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    // Leave specific chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
    });

    // Typing indicators
    socket.on('typing', ({ chatId, userName }) => {
      socket.to(`chat_${chatId}`).emit('typing', {
        chatId,
        userId: socket.user.id,
        userName: userName || socket.user.name
      });
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
        const { chatId, content, type = 'TEXT', mediaUrl, fileName, fileSize, replyToId } = messageData;

        // Fetch chat and verify sender
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { participants: true }
        });

        if (!chat) return;

        const myParticipant = chat.participants.find(p => p.userId === userId);
        if (!myParticipant) return;

        // Check group admin message restriction
        if (chat.isGroup && chat.adminOnlyMessage && myParticipant.role !== 'ADMIN') {
          socket.emit('error_message', { message: 'Only admins can send messages in this group' });
          return;
        }

        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: userId,
            content: content ? content.trim() : null,
            type,
            mediaUrl,
            fileName,
            fileSize,
            replyToId: replyToId || null,
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

        // Also notify all chat participants who might not be actively looking inside this chat room
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

    // Mark messages as read
    socket.on('read_messages', async ({ chatId }) => {
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

        // Notify chat participants that messages are read (blue ticks)
        io.to(`chat_${chatId}`).emit('messages_read_receipt', {
          chatId,
          readByUserId: userId
        });
      } catch (e) {
        console.error('Socket read_messages error:', e.message);
      }
    });

    // Notify group update (admin actions, member changes, settings)
    socket.on('group_event', ({ chatId, type, data }) => {
      io.to(`chat_${chatId}`).emit('group_event', { chatId, type, data });
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
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
    });
  });
};

module.exports = { initializeSocket, onlineUsers };
