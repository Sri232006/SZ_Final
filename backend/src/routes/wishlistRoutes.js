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
router.get('/price-drops', wishlistController.checkPriceDrops);

// Item specific routes
router.post('/product/:productId', wishlistController.addToWishlist);
router.get('/product/:productId/status', wishlistController.checkWishlistStatus);
router.patch('/item/:id', wishlistController.updateWishlistItem);
router.delete('/item/:id', wishlistController.removeFromWishlist);
router.post('/item/:id/move-to-cart', wishlistController.moveToCart);
router.post('/share/:id', wishlistController.shareWishlist);

module.exports = router;