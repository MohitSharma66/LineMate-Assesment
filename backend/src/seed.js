const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });
    await admin.save();

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = new User({
      name: 'Regular User',
      email: 'user@example.com',
      password: userPassword,
      role: 'user'
    });
    await user.save();

    // Create sample events
    const events = [
      {
        name: 'Tech Conference 2024',
        description: 'Annual technology conference featuring top industry speakers',
        date: new Date('2024-03-15'),
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
        date: new Date('2024-04-20'),
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
        date: new Date('2024-02-28'),
        time: '06:30 PM',
        venue: 'Innovation Hub, Floor 3',
        totalSeats: 50,
        availableSeats: 50,
        bookedSeats: [],
        createdBy: admin._id
      }
    ];

    await Event.insertMany(events);
    const leaderPassword = await bcrypt.hash('leader123', 10);
    const testLeader = new User({
      name: 'Test Leader',
      email: 'leader@example.com',
      password: leaderPassword,
      role: 'test_leader'
    });
    await testLeader.save();

    console.log('Test Leader credentials:');
    console.log('Email: leader@example.com');
    console.log('Password: leader123');
    console.log('Role: test_leader (can approve/deny admin requests)');
    console.log('Database seeded successfully!');
    console.log('Admin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\nUser credentials:');
    console.log('Email: user@example.com');
    console.log('Password: user123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();