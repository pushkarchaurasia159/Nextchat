const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/chatController');
const { getChatMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Base chat routes
router.get('/', protect, getUserChats);
router.post('/direct', protect, getOrCreateDirectChat);
router.post('/group', protect, upload.single('avatar'), createGroupChat);
router.get('/:id', protect, getChatById);
router.delete('/:id', protect, deleteChat);

// Messages in chat
router.get('/:chatId/messages', protect, getChatMessages);
router.post('/:chatId/messages', protect, upload.single('media'), sendMessage);

// Group management routes (Admin)
router.post('/:id/admin/members', protect, addMembers);
router.delete('/:id/admin/members/:userId', protect, removeMember);
router.put('/:id/admin/role', protect, changeRole);
router.put('/:id/admin/settings', protect, updateGroupSettings);
router.put('/:id/info', protect, upload.single('avatar'), updateGroupInfo);
router.post('/:id/leave', protect, leaveGroup);

module.exports = router;
