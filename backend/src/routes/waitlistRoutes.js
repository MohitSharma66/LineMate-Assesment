const express = require('express');
const { getWaitlistStatus, leaveWaitlist } = require('../controllers/waitlistController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.get('/:eventId/status', getWaitlistStatus);
router.delete('/:eventId/leave', leaveWaitlist);

module.exports = router;