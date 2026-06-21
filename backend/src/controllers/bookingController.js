const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { generateQRCode } = require('../services/qrService');
const { sendBookingConfirmation, sendWaitlistNotification, sendBookingCancellation } = require('../services/emailService');
const { generateSeatLabels, bookSeats, releaseSeats } = require('../services/seatService');

let io;
const setIO = (ioInstance) => { io = ioInstance; };

exports.createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, numberOfSeats, seatLabels } = req.body;
    const seats = parseInt(numberOfSeats);
    
    if (isNaN(seats) || seats < 1) {
      return res.status(400).json({ message: 'Invalid number of seats' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existingBooking = await Booking.findOne({
      user: req.userId,
      event: eventId,
      status: 'confirmed'
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You already have a booking for this event' });
    }

    let selectedSeats = seatLabels || [];

    if (selectedSeats.length === 0) {
      const allSeats = generateSeatLabels(event.totalSeats);
      const booked = event.bookedSeats || [];
      const available = allSeats.filter(seat => !booked.includes(seat));
      selectedSeats = available.slice(0, seats);
    }

    if (selectedSeats.length === 0) {
      const existingWaitlist = await Waitlist.findOne({ user: req.userId, event: eventId, status: 'waiting' });
      if (existingWaitlist) {
        return res.status(400).json({ message: 'You are already on the waitlist' });
      }
      const position = await Waitlist.countDocuments({ event: eventId, status: 'waiting' });
      const waitlistEntry = new Waitlist({
        user: req.userId,
        event: eventId,
        numberOfSeats: seats,
        status: 'waiting'
      });
      await waitlistEntry.save();
      return res.status(200).json({ waitlisted: true, position: position + 1 });
    }

    const booked = event.bookedSeats || [];
    const invalidSeats = selectedSeats.filter(seat => booked.includes(seat));
    if (invalidSeats.length > 0) {
      return res.status(400).json({ message: `Seats already booked: ${invalidSeats.join(', ')}` });
    }

    console.log('Selected seats for booking:', selectedSeats);

    event.bookedSeats = [...booked, ...selectedSeats];
    event.availableSeats -= selectedSeats.length;
    await event.save();

    const booking = new Booking({
      user: req.userId,
      event: eventId,
      numberOfSeats: selectedSeats.length,
      seatLabels: selectedSeats
    });
    await booking.save();

    const qrCodeData = await generateQRCode(booking._id);
    booking.qrCode = qrCodeData;
    await booking.save();

    try {
      const user = await User.findById(req.userId);
      if (user && user.email) {
        await sendBookingConfirmation(
          user.email,
          user.name,
          event.name,
          selectedSeats.length,
          booking._id,
          selectedSeats
        );
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }

    if (io) {
      io.to(`event-${eventId}`).emit('seats-updated', {
        eventId,
        availableSeats: event.availableSeats,
        bookedSeats: event.bookedSeats,
        bookingId: booking._id
      });
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking,
      qrCode: qrCodeData,
      seatLabels: selectedSeats
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({
      _id: id,
      user: req.userId,
      status: 'confirmed'
    }).populate('event', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Release specific seats back to event
    const event = await Event.findById(booking.event._id);
    if (event) {
      // Remove the released seats from bookedSeats
      event.bookedSeats = event.bookedSeats.filter(
        seat => !booking.seatLabels.includes(seat)
      );
      event.availableSeats += booking.numberOfSeats;
      await event.save();

      // Emit WebSocket event
      if (io) {
        io.to(`event-${event._id}`).emit('seats-updated', {
          eventId: event._id,
          availableSeats: event.availableSeats,
          bookedSeats: event.bookedSeats,
          cancelled: true
        });
      }

      // Check waitlist and assign seats
      await processWaitlist(event._id, booking.numberOfSeats);
    }

    // Send cancellation email with seat labels
    try {
      const user = await User.findById(req.userId);
      if (user && user.email) {
        await sendBookingCancellation(
          user.email,
          user.name,
          booking.event.name,
          booking.numberOfSeats,
          booking.seatLabels
        );
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Process waitlist when seats become available
const processWaitlist = async (eventId, seatsReleased) => {
  try {
    const waitlistEntries = await Waitlist.find({
      event: eventId,
      status: 'waiting'
    })
    .sort({ joinedAt: 1 })
    .populate('user', 'email name');

    const event = await Event.findById(eventId);
    if (!event) return;

    const allSeats = generateSeatLabels(event.totalSeats);
    const availableSeats = allSeats.filter(seat => !event.bookedSeats.includes(seat));

    let remainingSeats = seatsReleased;

    for (const entry of waitlistEntries) {
      if (remainingSeats <= 0) break;

      const seatsToAssign = Math.min(entry.numberOfSeats, remainingSeats);
      
      // Check if enough seats available
      if (availableSeats.length < seatsToAssign) break;

      const assignedSeats = availableSeats.splice(0, seatsToAssign);

      // Create booking for waitlisted user
      const booking = new Booking({
        user: entry.user._id,
        event: eventId,
        numberOfSeats: seatsToAssign,
        seatLabels: assignedSeats
      });
      await booking.save();

      // Generate QR for waitlist booking
      const qrCodeData = await generateQRCode(booking._id);
      booking.qrCode = qrCodeData;
      await booking.save();

      // Update event booked seats
      event.bookedSeats = [...event.bookedSeats, ...assignedSeats];
      event.availableSeats -= seatsToAssign;
      await event.save();

      // Update waitlist status
      entry.status = 'fulfilled';
      entry.fulfilledAt = new Date();
      await entry.save();

      remainingSeats -= seatsToAssign;

      // Emit WebSocket notification
      if (io) {
        io.to(`user-${entry.user._id}`).emit('waitlist-fulfilled', {
          bookingId: booking._id,
          eventId: eventId,
          seatLabels: assignedSeats
        });
      }

      // Send waitlist notification email with seat labels
      try {
        await sendWaitlistNotification(
          entry.user.email,
          entry.user.name,
          event.name,
          assignedSeats
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
      }
    }
  } catch (error) {
    console.error('Error processing waitlist:', error);
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.userId,
      status: 'confirmed'
    })
    .populate({
      path: 'event',
      populate: {
        path: 'createdBy',
        select: 'name email'
      }
    })
    .sort({ bookingDate: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { ...exports, setIO };