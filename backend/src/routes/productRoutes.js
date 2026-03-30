const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// Public routes
router.get('/', apiLimiter, productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/trending', productController.getTrendingProducts);
router.get('/search', productController.searchProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/:id', productController.getProduct);

// Protected routes (require authentication)
router.use(protect);

// Review routes
router.post('/:id/reviews', productController.addReview);

// Admin only routes
router.use(restrictTo('admin'));

// Product management
router.post(
  '/',
  upload.array('images', 10), // Max 10 images
  productController.createProduct
);

router.patch(
  '/:id',
  upload.array('images', 10),
  productController.updateProduct
);

router.delete('/:id', productController.deleteProduct);

// Stock management
router.patch('/:id/stock', productController.updateStock);

// Image management
router.delete('/:productId/images/:imageId', productController.deleteProductImage);
router.patch('/:productId/images/:imageId/primary', productController.setPrimaryImage);

module.exports = router;