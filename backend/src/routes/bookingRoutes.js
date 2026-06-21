const express = require('express');
const { body } = require('express-validator');
const { createBooking, getUserBookings, cancelBooking } = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(auth);

router.post('/', bookingLimiter, [
  body('eventId').notEmpty().withMessage('Event ID is required'),
  body('numberOfSeats').isInt({ min: 1 }).withMessage('Number of seats must be at least 1'),
  body('seatLabels').optional().isArray().withMessage('Seat labels must be an array')
], createBooking);

router.get('/', getUserBookings);
router.put('/:id/cancel', cancelBooking);

module.exports = router;

