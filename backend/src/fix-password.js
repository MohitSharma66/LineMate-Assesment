const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fixPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('./models/User');
    
    // Fix Admin password
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (admin) {
      admin.password = 'admin123';  // This triggers the pre-save hook
      await admin.save();
      console.log('✅ Password updated for admin@example.com');
    } else {
      console.log('❌ Admin user not found');
    }

    // Fix Test Leader password
    const leader = await User.findOne({ email: 'leader@example.com' });
    if (leader) {
      leader.password = 'leader123';  // This triggers the pre-save hook
      await leader.save();
      console.log('✅ Password updated for leader@example.com');
    } else {
      console.log('❌ Leader user not found');
    }

    await mongoose.disconnect();
    console.log('✅ All passwords fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixPassword();