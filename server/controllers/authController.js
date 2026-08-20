const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'nextchat_jwt_secret', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user with phone & password
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { phone, name, password, about } = req.body;

    if (!phone || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, name, and password are required'
      });
    }

    // Normalize phone number (trim and remove extra spaces)
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanPhone }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle avatar if uploaded
    let avatarUrl = null;
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        phone: cleanPhone,
        name: name.trim(),
        password: hashedPassword,
        avatar: avatarUrl,
        about: about ? about.trim() : 'Hey there! I am using NextChat.',
        isOnline: true,
        lastSeen: new Date()
      },
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        about: true,
        isOnline: true,
        lastSeen: true,
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

// @desc    Authenticate user & get token
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

    // Find user
    const user = await prisma.user.findUnique({
      where: { phone: cleanPhone }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Update status to online
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

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, about } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (about !== undefined) updateData.about = about.trim();
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
  register,
  login,
  getMe,
  updateProfile
};
