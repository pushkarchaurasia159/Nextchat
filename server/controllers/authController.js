const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'nextchat_jwt_secret', {
    expiresIn: '30d'
  });
};

// @desc    Send 6-digit OTP to phone number
// @route   POST /api/auth/send-otp
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Invalidate old unverified OTPs for this phone
    await prisma.otpCode.deleteMany({
      where: { phone: cleanPhone }
    });

    // Save new OTP
    await prisma.otpCode.create({
      data: {
        phone: cleanPhone,
        code: otpCode,
        expiresAt,
        verified: false
      }
    });

    console.log(`📱 [NextChat OTP Service] Sent OTP ${otpCode} to ${cleanPhone}`);

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${cleanPhone}`,
      phone: cleanPhone,
      otp: otpCode, // Provided for instant in-app toast & testing
      expiresIn: 300
    });
  } catch (error) {
    console.error('sendOtp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate OTP',
      error: error.message
    });
  }
};

// @desc    Verify OTP and log in / register passwordlessly
// @route   POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanOtp = otp.trim();

    // Find valid OTP record
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone: cleanPhone,
        code: cleanOtp,
        verified: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new code.'
      });
    }

    // Mark OTP verified
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        about: true,
        isOnline: true,
        lastSeen: true,
        ghostMode: true,
        preferredTheme: true,
        soundEnabled: true,
        createdAt: true
      }
    });

    let isNewUser = false;

    if (!user) {
      // Auto-register new user with OTP
      isNewUser = true;
      const defaultName = name && name.trim() ? name.trim() : `User ${cleanPhone.slice(-4)}`;

      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          name: defaultName,
          about: 'Exploring the future on NextChat ⚡',
          isOnline: true,
          lastSeen: new Date(),
          ghostMode: false,
          preferredTheme: 'cyber',
          soundEnabled: true
        },
        select: {
          id: true,
          phone: true,
          name: true,
          avatar: true,
          about: true,
          isOnline: true,
          lastSeen: true,
          ghostMode: true,
          preferredTheme: true,
          soundEnabled: true,
          createdAt: true
        }
      });
    } else {
      // Existing user online update (respecting ghost mode)
      if (!user.ghostMode) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isOnline: true, lastSeen: new Date() },
          select: {
            id: true,
            phone: true,
            name: true,
            avatar: true,
            about: true,
            isOnline: true,
            lastSeen: true,
            ghostMode: true,
            preferredTheme: true,
            soundEnabled: true,
            createdAt: true
          }
        });
      }
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: isNewUser ? 'Account registered successfully!' : 'Login successful!',
      user,
      token,
      isNewUser
    });
  } catch (error) {
    console.error('verifyOtp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
};

// @desc    Register a new user with phone & password (Alternative fallback)
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { phone, name, password, about } = req.body;

    if (!phone || !name) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and name are required'
      });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');

    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanPhone }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number already exists'
      });
    }

    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    let avatarUrl = null;
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }

    const user = await prisma.user.create({
      data: {
        phone: cleanPhone,
        name: name.trim(),
        password: hashedPassword,
        avatar: avatarUrl,
        about: about ? about.trim() : 'Exploring the future on NextChat ⚡',
        isOnline: true,
        lastSeen: new Date(),
        ghostMode: false,
        preferredTheme: 'cyber',
        soundEnabled: true
      },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        about: true,
        isOnline: true,
        lastSeen: true,
        ghostMode: true,
        preferredTheme: true,
        soundEnabled: true,
        createdAt: true
      }
    });

    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Authenticate user with password (Fallback)
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required'
      });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');

    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone }
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password. Try logging in with OTP!'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        about: true,
        isOnline: true,
        lastSeen: true,
        ghostMode: true,
        preferredTheme: true,
        soundEnabled: true,
        createdAt: true
      }
    });

    const token = generateToken(updatedUser.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: updatedUser,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        about: true,
        isOnline: true,
        lastSeen: true,
        ghostMode: true,
        preferredTheme: true,
        soundEnabled: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
};

// @desc    Update user profile & preferences
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, about, ghostMode, preferredTheme, soundEnabled } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (about !== undefined) updateData.about = about.trim();
    if (ghostMode !== undefined) updateData.ghostMode = Boolean(ghostMode);
    if (preferredTheme !== undefined) updateData.preferredTheme = preferredTheme;
    if (soundEnabled !== undefined) updateData.soundEnabled = Boolean(soundEnabled);
    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        about: true,
        isOnline: true,
        lastSeen: true,
        ghostMode: true,
        preferredTheme: true,
        soundEnabled: true,
        createdAt: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  login,
  getMe,
  updateProfile
};
