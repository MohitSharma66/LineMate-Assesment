const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');

// Get all bookings for an event (admin only)
exports.getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get all bookings for this event
    const bookings = await Booking.find({ 
      event: eventId, 
      status: 'confirmed' 
    })
    .populate('user', 'name email')
    .sort({ bookingDate: -1 });

    // Get waitlist entries
    const Waitlist = require('../models/Waitlist');
    const waitlist = await Waitlist.find({ 
      event: eventId, 
      status: 'waiting' 
    })
    .populate('user', 'name email')
    .sort({ joinedAt: 1 });

    res.json({
      event: {
        id: event._id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        totalSeats: event.totalSeats,
        availableSeats: event.availableSeats
      },
      registrations: {
        total: bookings.length,
        bookings: bookings.map(b => ({
          id: b._id,
          user: b.user,
          seats: b.numberOfSeats,
          bookingDate: b.bookingDate
        }))
      },
      waitlist: {
        total: waitlist.length,
        users: waitlist.map(w => ({
          id: w._id,
          user: w.user,
          seats: w.numberOfSeats,
          joinedAt: w.joinedAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all events with registration counts (admin dashboard)
exports.getAdminDashboard = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    const eventStats = await Promise.all(events.map(async (event) => {
      const bookingCount = await Booking.countDocuments({
        event: event._id,
        status: 'confirmed'
      });
      
      const waitlistCount = await require('../models/Waitlist').countDocuments({
        event: event._id,
        status: 'waiting'
      });

      return {
        ...event.toObject(),
        registrationCount: bookingCount,
        waitlistCount: waitlistCount
      };
    }));

    res.json(eventStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Make a user admin (super admin only - optional)
exports.makeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role: 'admin' },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'User is now an admin',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};