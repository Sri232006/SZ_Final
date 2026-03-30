const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes (rate-limited to prevent abuse)
router.post('/send-otp', authLimiter, whatsappController.sendOTP);
router.post('/verify-otp', authLimiter, whatsappController.verifyOTP);

// Protected routes
router.get('/status', protect, whatsappController.getVerificationStatus);

module.exports = router;
