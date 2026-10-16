require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const prisma = require('./config/prisma');
const { initializeSocket } = require('./socket');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve uploaded files
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    app: 'NextChat 2.0 API',
    version: '2.0.0',
    time: new Date().toISOString()
  });
});

// Pass IO instance to socket handler
initializeSocket(io);

// Make IO accessible to controllers via req.app.get('io')
app.set('io', io);

// Periodic cleanup of expired ephemeral messages (every 5 seconds)
setInterval(async () => {
  try {
    const now = new Date();
    const expiredMessages = await prisma.message.findMany({
      where: {
        expiresAt: { lte: now },
        isDeleted: false
      },
      select: { id: true, chatId: true }
    });

    if (expiredMessages.length > 0) {
      await prisma.message.deleteMany({
        where: {
          id: { in: expiredMessages.map(m => m.id) }
        }
      });

      expiredMessages.forEach(m => {
        io.to(`chat_${m.chatId}`).emit('message_expired', {
          chatId: m.chatId,
          messageId: m.id
        });
      });
    }
  } catch (e) {
    // Ignore cleanup errors quietly
  }
}, 5000);

// Serve Frontend in Production or if dist folder exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 NextChat 2.0 Server running on http://localhost:${PORT}`);
});
