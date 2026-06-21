const Waitlist = require('../models/Waitlist');
const Event = require('../models/Event');

exports.getWaitlistStatus = async (req, res) => {
  try {
    const { eventId } = req.params;

    const waitlistEntry = await Waitlist.findOne({
      user: req.userId,
      event: eventId,
      status: 'waiting'
    });

    const position = await Waitlist.countDocuments({
      event: eventId,
      status: 'waiting',
      joinedAt: { $lt: waitlistEntry?.joinedAt || new Date() }
    });

    const totalWaiting = await Waitlist.countDocuments({
      event: eventId,
      status: 'waiting'
    });

    res.json({
      isWaitlisted: !!waitlistEntry,
      position: waitlistEntry ? position + 1 : null,
      totalWaiting,
      waitlistEntry
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.leaveWaitlist = async (req, res) => {
  try {
    const { eventId } = req.params;

    const waitlistEntry = await Waitlist.findOneAndDelete({
      user: req.userId,
      event: eventId,
      status: 'waiting'
    });

    if (!waitlistEntry) {
      return res.status(404).json({ message: 'Not in waitlist' });
    }

    res.json({ message: 'Removed from waitlist successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};