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

    // Filter out expired ephemeral messages
    const now = new Date();
    const queryOptions = {
      where: {
        chatId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
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

    // Respect ghost mode for read receipts
    if (!req.user.ghostMode) {
      await prisma.chatParticipant.updateMany({
        where: { chatId, userId: currentUserId },
        data: { lastReadAt: new Date() }
      });

      await prisma.message.updateMany({
        where: {
          chatId,
          senderId: { not: currentUserId },
          status: { not: 'READ' }
        },
        data: { status: 'READ' }
      });
    }

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

// @desc    Send a message (Text / Media / Audio / Document / Code / Poll / Ephemeral)
// @route   POST /api/chats/:chatId/messages
const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { chatId } = req.params;
    const { content, type = 'TEXT', replyToId, selfDestructDuration, pollData } = req.body;

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

      if (req.file.mimetype.startsWith('image/')) {
        messageType = 'IMAGE';
      } else if (req.file.mimetype.startsWith('audio/')) {
        messageType = 'AUDIO';
      } else {
        messageType = 'DOCUMENT';
      }
    }

    // Ephemeral self-destruct calculation
    let expiresAt = null;
    let durationNumber = selfDestructDuration ? parseInt(selfDestructDuration) : null;
    if (durationNumber && durationNumber > 0) {
      expiresAt = new Date(Date.now() + durationNumber * 1000);
    }

    let finalPollData = null;
    if (pollData) {
      finalPollData = typeof pollData === 'string' ? pollData : JSON.stringify(pollData);
      messageType = 'POLL';
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

// @desc    Toggle emoji reaction on a message
// @route   POST /api/messages/:id/react
const toggleReaction = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const message = await prisma.message.findUnique({
      where: { id },
      include: { chat: { include: { participants: true } } }
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isMember = message.chat.participants.some(p => p.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let reactions = {};
    try {
      reactions = JSON.parse(message.reactions || '{}');
    } catch {
      reactions = {};
    }

    // Toggle reaction for current user
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    const userIndex = reactions[emoji].indexOf(currentUserId);
    if (userIndex > -1) {
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Remove other reactions by this user if single reaction policy or allow multi
      reactions[emoji].push(currentUserId);
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { reactions: JSON.stringify(reactions) },
      include: {
        sender: {
          select: { id: true, name: true, phone: true, avatar: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: updated,
      reactions: JSON.parse(updated.reactions)
    });
  } catch (error) {
    console.error('toggleReaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update reaction',
      error: error.message
    });
  }
};

// @desc    Toggle pin status of a message
// @route   POST /api/messages/:id/pin
const togglePin = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const message = await prisma.message.findUnique({
      where: { id },
      include: { chat: { include: { participants: true } } }
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const myParticipant = message.chat.participants.find(p => p.userId === currentUserId);
    if (!myParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (message.chat.isGroup && myParticipant.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only group admins can pin messages' });
    }

    const newPinnedStatus = !message.isPinned;

    const updated = await prisma.message.update({
      where: { id },
      data: { isPinned: newPinnedStatus }
    });

    // Update chat pinnedMessageId
    await prisma.chat.update({
      where: { id: message.chatId },
      data: { pinnedMessageId: newPinnedStatus ? id : null }
    });

    return res.status(200).json({
      success: true,
      message: updated,
      isPinned: newPinnedStatus
    });
  } catch (error) {
    console.error('togglePin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to pin message',
      error: error.message
    });
  }
};

// @desc    Vote on an interactive Poll
// @route   POST /api/messages/:id/poll/vote
const votePoll = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { optionId } = req.body;

    const message = await prisma.message.findUnique({
      where: { id },
      include: { chat: { include: { participants: true } } }
    });

    if (!message || message.type !== 'POLL' || !message.pollData) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    const isMember = message.chat.participants.some(p => p.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let poll = JSON.parse(message.pollData);
    if (!poll.options) {
      return res.status(400).json({ success: false, message: 'Corrupt poll data' });
    }

    // Update votes
    poll.options = poll.options.map((opt) => {
      const votes = opt.votes || [];
      const hasVoted = votes.includes(currentUserId);

      if (opt.id === optionId) {
        // Toggle vote on selected option
        return {
          ...opt,
          votes: hasVoted ? votes.filter(uid => uid !== currentUserId) : [...votes, currentUserId]
        };
      } else if (!poll.isMulti) {
        // Single choice: remove from other options
        return {
          ...opt,
          votes: votes.filter(uid => uid !== currentUserId)
        };
      }
      return opt;
    });

    const updated = await prisma.message.update({
      where: { id },
      data: { pollData: JSON.stringify(poll) },
      include: {
        sender: { select: { id: true, name: true, phone: true, avatar: true } }
      }
    });

    return res.status(200).json({
      success: true,
      message: updated,
      pollData: poll
    });
  } catch (error) {
    console.error('votePoll error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cast vote',
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
      const isSender = message.senderId === currentUserId;
      const isAdmin = myParticipant.role === 'ADMIN';

      if (!isSender && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the sender or a group admin can delete a message for everyone'
        });
      }

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
  toggleReaction,
  togglePin,
  votePoll,
  deleteMessage
};
