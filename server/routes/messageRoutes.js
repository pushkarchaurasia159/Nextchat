const express = require('express');
const router = express.Router();
const {
  toggleReaction,
  togglePin,
  votePoll,
  deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middlewares/auth');

router.post('/:id/react', protect, toggleReaction);
router.post('/:id/pin', protect, togglePin);
router.post('/:id/poll/vote', protect, votePoll);
router.post('/:id/delete', protect, deleteMessage);

module.exports = router;
