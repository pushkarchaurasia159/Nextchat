const prisma = require('../config/prisma');

// @desc    Search users by phone number or name
// @route   GET /api/users/search?q=query
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim() === '') {
      // Return recent active users if no query
      const users = await prisma.user.findMany({
        where: {
          id: { not: currentUserId }
        },
        take: 20,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          avatar: true,
          about: true,
          isOnline: true,
          lastSeen: true
        }
      });
      return res.status(200).json({ success: true, users });
    }

    const query = q.trim();

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { phone: { contains: query } },
              { name: { contains: query } }
            ]
          }
        ]
      },
      take: 25,
      select: {
        id: true,
        phone: true,
        name: true,
        avatar: true,
        about: true,
        isOnline: true,
        lastSeen: true
      }
    });

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('searchUsers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error searching users'
    });
  }
};

// @desc    Get user by id
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
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

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('getUserById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user details'
    });
  }
};

module.exports = {
  searchUsers,
  getUserById
};
