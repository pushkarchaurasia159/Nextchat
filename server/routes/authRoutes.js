const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

module.exports = router;
