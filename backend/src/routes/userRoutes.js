const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All user routes require authentication
router.use(protect);

// Profile management
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.post(
  '/profile/picture',
  upload.single('profile'),
  userController.uploadProfilePicture
);
router.delete('/profile/picture', userController.deleteProfilePicture);

// Password management
router.post('/change-password', userController.changePassword);

// Account management
router.post('/deactivate', userController.deactivateAccount);

// Order routes
router.get('/orders', userController.getMyOrders);
router.get('/orders/:id', userController.getOrder);
router.post('/orders/:id/cancel', userController.cancelOrder);

// Wishlist routes
router.get('/wishlist', userController.getWishlist);

// Review routes
router.get('/reviews', userController.getMyReviews);

// Statistics
router.get('/stats', userController.getUserStats);

module.exports = router;