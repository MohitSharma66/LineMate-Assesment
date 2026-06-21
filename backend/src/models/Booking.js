const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  seatLabels: {
    type: [String], // e.g., ['A-1', 'A-2', 'A-3']
    default: []
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  cancelledAt: Date,
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  }
});

module.exports = mongoose.model('Booking', bookingSchema);