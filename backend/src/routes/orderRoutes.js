const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// All order routes require authentication
router.use(protect);

// Order management
router.post('/', orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrder);
router.post('/:id/cancel', orderController.cancelOrder);
router.get('/:id/track', orderController.trackOrder);
router.post('/:id/return', orderController.requestReturn);
router.post('/:id/reorder', orderController.reorder);
router.get('/:id/invoice', orderController.getInvoice);

// Payment
router.post('/verify-payment', orderController.verifyPayment);

module.exports = router;