const express = require('express');
const router = express.Router();
const { generateAIResponse } = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

router.post('/generate', protect, generateAIResponse);

module.exports = router;
