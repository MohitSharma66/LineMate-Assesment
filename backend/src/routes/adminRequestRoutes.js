const express = require('express');
const {
  requestAdminAccess,
  getPendingRequests,
  reviewAdminRequest,
  getRequestStatus
} = require('../controllers/adminRequestController');
const auth = require('../middleware/auth');

const router = express.Router();

// User routes
router.use(auth);
router.post('/request', requestAdminAccess);
router.get('/status', getRequestStatus);

// Test Leader routes
router.get('/pending', getPendingRequests);
router.put('/review/:userId', reviewAdminRequest);

module.exports = router;