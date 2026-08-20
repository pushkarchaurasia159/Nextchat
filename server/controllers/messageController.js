const prisma = require('../config/prisma');

// @desc    Get messages for a chat
// @route   GET /api/chats/:chatId/messages
const getChatMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { chatId } = req.params;
    const { cursor, limit = 50 } = req.query;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const isMember = chat.participants.some(p => p.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this chat' });
    }

    const queryOptions = {
      where: {
        chatId
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
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
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const messages = await prisma.message.findMany(queryOptions);

    // Filter out messages deleted for this user
    const filtered = messages
      .filter(m => {
        try {
          const deletedList = JSON.parse(m.deletedFor || '[]');
          return !deletedList.includes(currentUserId);
        } catch {
          return true;
        }
      })
      .reverse();

    // Mark messages from others as READ for current user
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId: currentUserId },
      data: { lastReadAt: new Date() }
    });

    // Mark unread messages sent by others in this chat as READ
    await prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: currentUserId },
        status: { not: 'READ' }
      },
      data: { status: 'READ' }
    });

    return res.status(200).json({
      success: true,
      messages: filtered,
      nextCursor: messages.length === parseInt(limit) ? messages[0].id : null
    });
  } catch (error) {
    console.error('getChatMessages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching messages',
      error: error.message
    });
  }
};

// @desc    Send a message (Text / Media / Audio / Document)
// @route   POST /api/chats/:chatId/messages
const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { chatId } = req.params;
    const { content, type = 'TEXT', replyToId } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const myParticipant = chat.participants.find(p => p.userId === currentUserId);
    if (!myParticipant) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this chat' });
    }

    // Check if group is in "Only Admins can send messages" mode
    if (chat.isGroup && chat.adminOnlyMessage && myParticipant.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can send messages to this group'
      });
    }

    let mediaUrl = null;
    let fileName = null;
    let fileSize = null;
    let messageType = type;

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;

      // Auto detect type if not set
      if (req.file.mimetype.startsWith('image/')) {
        messageType = 'IMAGE';
      } else if (req.file.mimetype.startsWith('audio/')) {
        messageType = 'AUDIO';
      } else {
        messageType = 'DOCUMENT';
      }
    }

    if (!content && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Message content or media is required' });
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: currentUserId,
        content: content ? content.trim() : null,
        type: messageType,
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

    // Touch chat updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    return res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending message',
      error: error.message
    });
  }
};

// @desc    Delete message (for me or for everyone)
// @route   POST /api/messages/:id/delete
const deleteMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { forEveryone = false } = req.body;

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        chat: {
          include: { participants: true }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const myParticipant = message.chat.participants.find(p => p.userId === currentUserId);
    if (!myParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (forEveryone) {
      // Must be sender OR group ADMIN
      const isSender = message.senderId === currentUserId;
      const isAdmin = myParticipant.role === 'ADMIN';

      if (!isSender && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the sender or a group admin can delete a message for everyone'
        });
      }

      // Mark as deleted for everyone
      const updatedMessage = await prisma.message.update({
        where: { id },
        data: {
          isDeleted: true,
          content: '🚫 This message was deleted',
          mediaUrl: null,
          fileName: null,
          fileSize: null
        },
        include: {
          sender: {
            select: { id: true, name: true, phone: true, avatar: true }
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Message deleted for everyone',
        deletedMessage: updatedMessage,
        forEveryone: true
      });
    } else {
      // Delete for me
      let deletedList = [];
      try {
        deletedList = JSON.parse(message.deletedFor || '[]');
      } catch {
        deletedList = [];
      }

      if (!deletedList.includes(currentUserId)) {
        deletedList.push(currentUserId);
      }

      await prisma.message.update({
        where: { id },
        data: {
          deletedFor: JSON.stringify(deletedList)
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Message deleted for you',
        messageId: id,
        forEveryone: false
      });
    }
  } catch (error) {
    console.error('deleteMessage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting message',
      error: error.message
    });
  }
};

module.exports = {
  getChatMessages,
  sendMessage,
  deleteMessage
};
