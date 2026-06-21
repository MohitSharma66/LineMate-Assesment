const User = require('../models/User');

// User requests admin access
exports.requestAdminAccess = async (req, res) => {
  try {
    const { secretPhrase } = req.body;
    const userId = req.userId;

    // Check if user already has admin role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'You are already an admin' });
    }

    // ✅ CHECK SECRET PHRASE
    const correctPhrase = process.env.ADMIN_SECRET_PHRASE;
    if (!secretPhrase || secretPhrase !== correctPhrase) {
      return res.status(400).json({ 
        message: 'Invalid secret phrase. Please contact the test leader.' 
      });
    }

    // Check if request already pending
    if (user.adminRequest.status === 'pending') {
      return res.status(400).json({ 
        message: 'Admin request already pending. Please wait for approval.' 
      });
    }

    // Check for recent denied request (prevent spam)
    if (user.adminRequest.status === 'denied') {
      const deniedAt = new Date(user.adminRequest.reviewedAt);
      const now = new Date();
      const hoursSinceDenied = (now - deniedAt) / (1000 * 60 * 60);
      if (hoursSinceDenied < 24) {
        return res.status(400).json({
          message: 'Your admin request was denied. Please wait 24 hours before requesting again.'
        });
      }
    }

    // Update user with admin request
    user.adminRequest = {
      status: 'pending',
      secretPhrase: secretPhrase,
      requestedAt: new Date()
    };
    await user.save();

    res.json({
      message: 'Admin request submitted successfully. Please wait for approval.',
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Test Leader: Get all pending admin requests
exports.getPendingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'test_leader') {
      return res.status(403).json({ message: 'Only test leaders can view pending requests' });
    }

    const pendingRequests = await User.find({
      'adminRequest.status': 'pending'
    }).select('name email adminRequest createdAt');

    res.json({
      count: pendingRequests.length,
      requests: pendingRequests,
      secretPhrase: process.env.ADMIN_SECRET_PHRASE // Show the current secret phrase
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Test Leader: Approve or deny admin request
exports.reviewAdminRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, notes } = req.body;

    const reviewer = await User.findById(req.userId);
    if (reviewer.role !== 'test_leader') {
      return res.status(403).json({ message: 'Only test leaders can review admin requests' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.adminRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: `No pending request for this user. Current status: ${user.adminRequest.status}` 
      });
    }

    if (action === 'approve') {
      user.role = 'admin';
      user.adminRequest.status = 'approved';
      user.adminRequest.reviewedAt = new Date();
      user.adminRequest.reviewedBy = req.userId;
      user.adminRequest.notes = notes || 'Approved by test leader';
      await user.save();

      res.json({
        message: `Admin access approved for ${user.name}`,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } else if (action === 'deny') {
      user.adminRequest.status = 'denied';
      user.adminRequest.reviewedAt = new Date();
      user.adminRequest.reviewedBy = req.userId;
      user.adminRequest.notes = notes || 'Denied by test leader';
      await user.save();

      res.json({
        message: `Admin request denied for ${user.name}`,
        user: { id: user._id, name: user.name, email: user.email }
      });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "deny"' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's admin request status
exports.getRequestStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    res.json({
      status: user.adminRequest.status,
      requestedAt: user.adminRequest.requestedAt,
      reviewedAt: user.adminRequest.reviewedAt,
      notes: user.adminRequest.notes,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};