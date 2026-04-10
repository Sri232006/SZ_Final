const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(protect);

// Wishlist management
router.get('/', wishlistController.getWishlist);
router.get('/count', wishlistController.getWishlistCount);
router.delete('/clear', wishlistController.clearWishlist);

// Product specific routes
router.post('/product/:productId', wishlistController.addToWishlist);
router.get('/product/:productId/status', wishlistController.checkWishlistStatus);

// Item specific routes
router.delete('/item/:id', wishlistController.removeFromWishlist);
router.post('/item/:id/move-to-cart', wishlistController.moveToCart);

module.exports = router;