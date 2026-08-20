const prisma = require('../config/prisma');

// Helper to format chat for the requesting user
const formatChat = (chat, currentUserId) => {
  let displayName = chat.name;
  let displayAvatar = chat.avatar;
  let displayAbout = chat.description;
  let isOnline = false;
  let lastSeen = null;
  let otherUser = null;

  if (!chat.isGroup) {
    const otherParticipant = chat.participants.find(p => p.userId !== currentUserId);
    if (otherParticipant && otherParticipant.user) {
      otherUser = otherParticipant.user;
      displayName = otherUser.name;
      displayAvatar = otherUser.avatar;
      displayAbout = otherUser.about;
      isOnline = otherUser.isOnline;
      lastSeen = otherUser.lastSeen;
    }
  }

  const currentUserParticipant = chat.participants.find(p => p.userId === currentUserId);
  const myRole = currentUserParticipant ? currentUserParticipant.role : 'MEMBER';
  const lastReadAt = currentUserParticipant ? currentUserParticipant.lastReadAt : new Date(0);

  // Unread messages count
  const unreadCount = chat.messages
    ? chat.messages.filter(
        m => m.senderId !== currentUserId && new Date(m.createdAt) > new Date(lastReadAt) && !m.isDeleted
      ).length
    : 0;

  const latestMessage = chat.messages && chat.messages.length > 0 ? chat.messages[0] : null;

  return {
    id: chat.id,
    isGroup: chat.isGroup,
    name: displayName,
    rawName: chat.name,
    avatar: displayAvatar,
    description: displayAbout,
    creatorId: chat.creatorId,
    adminOnlyMessage: chat.adminOnlyMessage,
    adminOnlyInfo: chat.adminOnlyInfo,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    isOnline,
    lastSeen,
    otherUser,
    myRole,
    unreadCount,
    latestMessage,
    participants: chat.participants.map(p => ({
      id: p.id,
      userId: p.userId,
      role: p.role,
      joinedAt: p.joinedAt,
      name: p.user.name,
      phone: p.user.phone,
      avatar: p.user.avatar,
      about: p.user.about,
      isOnline: p.user.isOnline,
      lastSeen: p.user.lastSeen
    }))
  };
};

// @desc    Get all chats for current user
// @route   GET /api/chats
const getUserChats = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: currentUserId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true, phone: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedChats = chats.map(c => formatChat(c, currentUserId));

    return res.status(200).json({
      success: true,
      chats: formattedChats
    });
  } catch (error) {
    console.error('getUserChats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user chats',
      error: error.message
    });
  }
};

// @desc    Get single chat by ID
// @route   GET /api/chats/:id
const getChatById = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
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
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const isMember = chat.participants.some(p => p.userId === currentUserId);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this chat' });
    }

    // Update last read timestamp
    await prisma.chatParticipant.updateMany({
      where: { chatId: id, userId: currentUserId },
      data: { lastReadAt: new Date() }
    });

    const formatted = formatChat(chat, currentUserId);
    formatted.messages = (chat.messages || []).reverse();

    return res.status(200).json({
      success: true,
      chat: formatted
    });
  } catch (error) {
    console.error('getChatById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching chat',
      error: error.message
    });
  }
};

// @desc    Get or create 1-on-1 direct chat
// @route   POST /api/chats/direct
const getOrCreateDirectChat = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required' });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot create chat with yourself' });
    }

    // Find existing direct chat with these two participants
    const existingChats = await prisma.chat.findMany({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (existingChats.length > 0) {
      const formatted = formatChat(existingChats[0], currentUserId);
      return res.status(200).json({ success: true, chat: formatted, isNew: false });
    }

    // Create new direct chat
    const newChat = await prisma.chat.create({
      data: {
        isGroup: false,
        creatorId: currentUserId,
        participants: {
          create: [
            { userId: currentUserId, role: 'MEMBER' },
            { userId: targetUserId, role: 'MEMBER' }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        messages: true
      }
    });

    const formatted = formatChat(newChat, currentUserId);
    return res.status(201).json({ success: true, chat: formatted, isNew: true });
  } catch (error) {
    console.error('getOrCreateDirectChat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating direct chat',
      error: error.message
    });
  }
};

// @desc    Create a new Group Chat
// @route   POST /api/chats/group
const createGroupChat = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { name, description, memberIds } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Group subject is required' });
    }

    let parsedMembers = [];
    if (memberIds) {
      parsedMembers = Array.isArray(memberIds) ? memberIds : JSON.parse(memberIds);
    }

    // Ensure unique IDs and exclude creator from memberIds list to avoid duplicate
    const uniqueMemberIds = [...new Set(parsedMembers.filter(id => id !== currentUserId))];

    let avatarUrl = null;
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }

    const participantsData = [
      { userId: currentUserId, role: 'ADMIN' },
      ...uniqueMemberIds.map(uid => ({ userId: uid, role: 'MEMBER' }))
    ];

    const groupChat = await prisma.chat.create({
      data: {
        isGroup: true,
        name: name.trim(),
        description: description ? description.trim() : null,
        avatar: avatarUrl,
        creatorId: currentUserId,
        adminOnlyMessage: false,
        adminOnlyInfo: false,
        participants: {
          create: participantsData
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        messages: true
      }
    });

    // Create a system message announcing group creation
    const systemMsg = await prisma.message.create({
      data: {
        chatId: groupChat.id,
        senderId: currentUserId,
        content: `${req.user.name} created group "${groupChat.name}"`,
        type: 'SYSTEM',
        status: 'READ'
      },
      include: {
        sender: {
          select: { id: true, name: true, phone: true, avatar: true }
        }
      }
    });

    const formatted = formatChat(groupChat, currentUserId);
    formatted.latestMessage = systemMsg;

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      chat: formatted,
      systemMessage: systemMsg
    });
  } catch (error) {
    console.error('createGroupChat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating group',
      error: error.message
    });
  }
};

// @desc    Add members to group (Admin only)
// @route   POST /api/chats/:id/admin/members
const addMembers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide user IDs to add' });
    }

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if requester is admin
    const myParticipant = chat.participants.find(p => p.userId === currentUserId);
    if (!myParticipant || myParticipant.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only group admins can add members' });
    }

    const existingMemberIds = chat.participants.map(p => p.userId);
    const toAdd = userIds.filter(uid => !existingMemberIds.includes(uid));

    if (toAdd.length === 0) {
      return res.status(400).json({ success: false, message: 'All selected users are already in the group' });
    }

    // Add participants
    await prisma.chatParticipant.createMany({
      data: toAdd.map(uid => ({
        chatId: id,
        userId: uid,
        role: 'MEMBER'
      }))
    });

    // Fetch added users names for system message
    const addedUsers = await prisma.user.findMany({
      where: { id: { in: toAdd } },
      select: { id: true, name: true }
    });
    const names = addedUsers.map(u => u.name).join(', ');

    const systemMsg = await prisma.message.create({
      data: {
        chatId: id,
        senderId: currentUserId,
        content: `${req.user.name} added ${names}`,
        type: 'SYSTEM',
        status: 'READ'
      },
      include: {
        sender: { select: { id: true, name: true, phone: true } }
      }
    });

    const updatedChat = await prisma.chat.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Members added successfully',
      chat: formatChat(updatedChat, currentUserId),
      systemMessage: systemMsg
    });
  } catch (error) {
    console.error('addMembers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error adding members',
      error: error.message
    });
  }
};

// @desc    Remove member from group (Admin power)
// @route   DELETE /api/chats/:id/admin/members/:userId
const removeMember = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id, userId: targetUserId } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check requester role
    const myParticipant = chat.participants.find(p => p.userId === currentUserId);
    if (!myParticipant || myParticipant.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only group admins can remove members' });
    }

    // Target check
    const targetParticipant = chat.participants.find(p => p.userId === targetUserId);
    if (!targetParticipant) {
      return res.status(404).json({ success: false, message: 'User is not a member of this group' });
    }

    // Prevent non-creator admin from removing creator
    if (chat.creatorId === targetUserId && chat.creatorId !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Cannot remove the group creator' });
    }

    // Remove participant
    await prisma.chatParticipant.delete({
      where: {
        chatId_userId: {
          chatId: id,
          userId: targetUserId
        }
      }
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { name: true }
    });

    const systemMsg = await prisma.message.create({
      data: {
        chatId: id,
        senderId: currentUserId,
        content: `${req.user.name} removed ${targetUser ? targetUser.name : 'a member'}`,
        type: 'SYSTEM',
        status: 'READ'
      },
      include: {
        sender: { select: { id: true, name: true, phone: true } }
      }
    });

    const updatedChat = await prisma.chat.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      chat: formatChat(updatedChat, currentUserId),
      systemMessage: systemMsg,
      removedUserId: targetUserId
    });
  } catch (error) {
    console.error('removeMember error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error removing member',
      error: error.message
    });
  }
};

// @desc    Promote or Demote member as Admin
// @route   PUT /api/chats/:id/admin/role
const changeRole = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { targetUserId, role } = req.body; // role: 'ADMIN' or 'MEMBER'

    if (!targetUserId || !['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid target user or role' });
    }

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check requester role
    const myParticipant = chat.participants.find(p => p.userId === currentUserId);
    if (!myParticipant || myParticipant.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only group admins can change member roles' });
    }

    const targetParticipant = chat.participants.find(p => p.userId === targetUserId);
    if (!targetParticipant) {
      return res.status(404).json({ success: false, message: 'User is not in this group' });
    }

    // Update role
    await prisma.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId: id,
          userId: targetUserId
        }
      },
      data: { role }
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { name: true }
    });

    const actionText = role === 'ADMIN' ? 'made' : 'dismissed';
    const postFix = role === 'ADMIN' ? 'a group admin' : 'as group admin';
    const systemMsg = await prisma.message.create({
      data: {
        chatId: id,
        senderId: currentUserId,
        content: `${req.user.name} ${actionText} ${targetUser ? targetUser.name : 'a user'} ${postFix}`,
        type: 'SYSTEM',
        status: 'READ'
      },
      include: {
        sender: { select: { id: true, name: true, phone: true } }
      }
    });

    const updatedChat = await prisma.chat.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: `Role changed to ${role}`,
      chat: formatChat(updatedChat, currentUserId),
      systemMessage: systemMsg
    });
  } catch (error) {
    console.error('changeRole error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error changing role',
      error: error.message
    });
  }
};

// @desc    Update Group Info (name, description, avatar)
// @route   PUT /api/chats/:id/info
const updateGroupInfo = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { name, description } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const myParticipant = chat.participants.find(p => p.userId === currentUserId);
    if (!myParticipant) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    if (chat.adminOnlyInfo && myParticipant.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only admins can edit this group’s info' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (req.file) updateData.avatar = `/uploads/${req.file.filename}`;

    const updated = await prisma.chat.update({
      where: { id },
      data: updateData,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    const systemMsg = await prisma.message.create({
      data: {
        chatId: id,
        senderId: currentUserId,
        content: `${req.user.name} changed the group info`,
        type: 'SYSTEM',
        status: 'READ'
      },
      include: {
        sender: { select: { id: true, name: true, phone: true } }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Group info updated',
      chat: formatChat(updated, currentUserId),
      systemMessage: systemMsg
    });
  } catch (error) {
    console.error('updateGroupInfo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating group info',
      error: error.message
    });
  }
};

// @desc    Update Group Admin Settings (Send Messages / Edit Info permissions)
// @route   PUT /api/chats/:id/admin/settings
const updateGroupSettings = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { adminOnlyMessage, adminOnlyInfo } = req.body;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const myParticipant = chat.participants.find(p => p.userId === currentUserId);
    if (!myParticipant || myParticipant.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only admins can modify group settings' });
    }

    const updateData = {};
    let noticeText = '';

    if (adminOnlyMessage !== undefined) {
      updateData.adminOnlyMessage = Boolean(adminOnlyMessage);
      noticeText = adminOnlyMessage
        ? `${req.user.name} changed group settings to allow only admins to send messages`
        : `${req.user.name} changed group settings to allow all participants to send messages`;
    }

    if (adminOnlyInfo !== undefined) {
      updateData.adminOnlyInfo = Boolean(adminOnlyInfo);
      noticeText = adminOnlyInfo
        ? `${req.user.name} changed group settings to allow only admins to edit group info`
        : `${req.user.name} changed group settings to allow all participants to edit group info`;
    }

    const updated = await prisma.chat.update({
      where: { id },
      data: updateData,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                name: true,
                avatar: true,
                about: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    let systemMsg = null;
    if (noticeText) {
      systemMsg = await prisma.message.create({
        data: {
          chatId: id,
          senderId: currentUserId,
          content: noticeText,
          type: 'SYSTEM',
          status: 'READ'
        },
        include: {
          sender: { select: { id: true, name: true, phone: true } }
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Group settings updated',
      chat: formatChat(updated, currentUserId),
      systemMessage: systemMsg
    });
  } catch (error) {
    console.error('updateGroupSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating group settings',
      error: error.message
    });
  }
};

// @desc    Leave Group
// @route   POST /api/chats/:id/leave
const leaveGroup = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!chat || !chat.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const myParticipant = chat.participants.find(p => p.userId === currentUserId);
    if (!myParticipant) {
      return res.status(400).json({ success: false, message: 'You are not a participant in this group' });
    }

    // Remove user
    await prisma.chatParticipant.delete({
      where: {
        chatId_userId: {
          chatId: id,
          userId: currentUserId
        }
      }
    });

    // Check remaining participants
    const remaining = chat.participants.filter(p => p.userId !== currentUserId);

    // If leaving user was an admin and there are no other admins left, make the earliest member an admin
    const remainingAdmins = remaining.filter(p => p.role === 'ADMIN');
    if (myParticipant.role === 'ADMIN' && remainingAdmins.length === 0 && remaining.length > 0) {
      const nextAdmin = remaining[0];
      await prisma.chatParticipant.update({
        where: { id: nextAdmin.id },
        data: { role: 'ADMIN' }
      });
    }

    const systemMsg = await prisma.message.create({
      data: {
        chatId: id,
        senderId: currentUserId,
        content: `${req.user.name} left`,
        type: 'SYSTEM',
        status: 'READ'
      },
      include: {
        sender: { select: { id: true, name: true, phone: true } }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'You left the group',
      systemMessage: systemMsg,
      leftUserId: currentUserId
    });
  } catch (error) {
    console.error('leaveGroup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error leaving group',
      error: error.message
    });
  }
};

// @desc    Delete chat (Direct chat or Group disband)
// @route   DELETE /api/chats/:id
const deleteChat = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (chat.isGroup) {
      // Must be admin or creator
      const myParticipant = chat.participants.find(p => p.userId === currentUserId);
      if (!myParticipant || myParticipant.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only admins can delete the group' });
      }
    }

    // Delete chat and cascade relations
    await prisma.chat.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Chat deleted successfully',
      chatId: id
    });
  } catch (error) {
    console.error('deleteChat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting chat',
      error: error.message
    });
  }
};

module.exports = {
  getUserChats,
  getChatById,
  getOrCreateDirectChat,
  createGroupChat,
  addMembers,
  removeMember,
  changeRole,
  updateGroupInfo,
  updateGroupSettings,
  leaveGroup,
  deleteChat
};
