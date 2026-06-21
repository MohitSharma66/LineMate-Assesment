const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  numberOfSeats: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'fulfilled'],
    default: 'waiting'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  notifiedAt: Date,
  fulfilledAt: Date
});

// Ensure user can only be in waitlist once per event
waitlistSchema.index({ user: 1, event: 1 }, { unique: true });
waitlistSchema.index({ event: 1, joinedAt: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);