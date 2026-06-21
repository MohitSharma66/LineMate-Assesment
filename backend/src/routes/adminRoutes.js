const express = require('express');
const { 
  getEventRegistrations, 
  getAdminDashboard,
  makeAdmin
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(auth);
router.use(admin);

// Dashboard - all events with stats
router.get('/dashboard', getAdminDashboard);

// Event registrations
router.get('/events/:eventId/registrations', getEventRegistrations);

// Make a user admin (optional - for testing)
router.put('/users/:userId/make-admin', makeAdmin);

module.exports = router;