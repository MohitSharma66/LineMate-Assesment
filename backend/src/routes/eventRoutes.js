const express = require('express');
const { body } = require('express-validator');
const { getAllEvents, getEventById, createEvent, verifyBooking } = require('../controllers/eventController');
const auth = require('../middleware/auth');
const { sanitizeInput, sanitizeEventInput } = require('../middleware/sanitize');

const router = express.Router();

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', auth, sanitizeInput, sanitizeEventInput, [
  body('name').notEmpty().withMessage('Event name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('venue').notEmpty().withMessage('Venue is required'),
  body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be at least 1')
], createEvent);

// QR Code verification (public)
router.get('/verify/:bookingId', verifyBooking);

module.exports = router;