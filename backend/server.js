require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
require('./src/config/passport');
const { apiLimiter } = require('./src/middleware/rateLimiter');

const authRoutes = require('./src/routes/authRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const waitlistRoutes = require('./src/routes/waitlistRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const adminRequestRoutes = require('./src/routes/adminRequestRoutes');

const app = express();
const httpServer = createServer(app);
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const bcrypt = require('bcryptjs');

app.set('trust proxy', 1);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Make io available to controllers
const { setIO } = require('./src/controllers/bookingController');
setIO(io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

// Rate limiting (applied to all routes)
app.use('/api', apiLimiter);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-requests', adminRequestRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join event room
  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
    console.log(`Socket ${socket.id} joined event-${eventId}`);
  });

  // Join user room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Socket ${socket.id} joined user-${userId}`);
  });

  // Leave event room
  socket.on('leave-event', (eventId) => {
    socket.leave(`event-${eventId}`);
    console.log(`Socket ${socket.id} left event-${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Auto-seed if database is empty
    await autoSeedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Auto-seed function
const autoSeedDatabase = async () => {
  try {
    // Check if users exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('✅ Database already seeded. Skipping...');
      return;
    }

    console.log('🌱 Seeding database...');

    // Create admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      adminRequest: { status: 'none' }
    });
    await admin.save();

    // Create test leader
    const leaderPassword = await bcrypt.hash('leader123', 10);
    const testLeader = new User({
      name: 'Test Leader',
      email: 'leader@example.com',
      password: leaderPassword,
      role: 'test_leader',
      adminRequest: { status: 'none' }
    });
    await testLeader.save();

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = new User({
      name: 'Regular User',
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
      adminRequest: { status: 'none' }
    });
    await user.save();

    // Create sample events
    const events = [
      {
        name: 'Tech Conference 2027',
        description: 'Annual technology conference featuring top industry speakers',
        date: new Date('2027-03-15'),
        time: '09:00 AM',
        venue: 'Convention Center, Hall A',
        totalSeats: 100,
        availableSeats: 100,
        bookedSeats: [],
        createdBy: admin._id
      },
      {
        name: 'Music Festival',
        description: 'Outdoor music festival with multiple artists',
        date: new Date('2027-04-20'),
        time: '02:00 PM',
        venue: 'City Park',
        totalSeats: 500,
        availableSeats: 500,
        bookedSeats: [],
        createdBy: admin._id
      },
      {
        name: 'Startup Pitch Night',
        description: 'Networking event for startups and investors',
        date: new Date('2027-02-28'),
        time: '06:30 PM',
        venue: 'Innovation Hub, Floor 3',
        totalSeats: 50,
        availableSeats: 50,
        bookedSeats: [],
        createdBy: admin._id
      }
    ];

    await Event.insertMany(events);

    console.log('✅ Database seeded successfully!');
    console.log('📋 Test Credentials:');
    console.log('  Admin: admin@example.com / admin123');
    console.log('  Test Leader: leader@example.com / leader123');
    console.log(`  Events created: ${events.length}`);

  } catch (error) {
    console.error('❌ Seed error:', error);
  }
};

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready`);
});