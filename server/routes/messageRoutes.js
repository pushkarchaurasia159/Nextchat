const express = require('express');
const router = express.Router();
const { deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middlewares/auth');

router.post('/:id/delete', protect, deleteMessage);

module.exports = router;
