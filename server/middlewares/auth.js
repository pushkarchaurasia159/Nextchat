const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nextchat_jwt_secret');

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
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
        return res.status(401).json({ success: false, message: 'User no longer exists' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
