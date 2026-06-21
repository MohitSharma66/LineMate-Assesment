const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 })
      .populate('createdBy', 'name email');
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, date, time, venue, totalSeats } = req.body;

    const event = new Event({
      name,
      description,
      date,
      time,
      venue,
      totalSeats,
      availableSeats: totalSeats,
      createdBy: req.userId
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify QR code endpoint
exports.verifyBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('event', 'name date time venue');

    if (!booking) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Invalid booking ID' 
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        valid: false,
        message: 'This booking has been cancelled'
      });
    }

    // Check if event date has passed
    const eventDate = new Date(booking.event.date);
    if (eventDate < new Date()) {
      return res.status(400).json({
        valid: false,
        message: 'This event has already passed'
      });
    }

    res.json({
      valid: true,
      booking: {
        id: booking._id,
        eventName: booking.event.name,
        eventDate: booking.event.date,
        eventTime: booking.event.time,
        venue: booking.event.venue,
        user: booking.user.name,
        seats: booking.numberOfSeats,
        bookingDate: booking.bookingDate
      }
    });
  } catch (error) {
    res.status(500).json({ 
      valid: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};