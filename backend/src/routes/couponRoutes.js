const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', protect, couponController.getAllCoupons);
router.get('/validate/:code', protect, couponController.validateCoupon);
router.get('/:id', protect, couponController.getCoupon);

// Admin only routes
router.post('/', protect, restrictTo('admin'), couponController.createCoupon);
router.patch('/:id', protect, restrictTo('admin'), couponController.updateCoupon);
router.delete('/:id', protect, restrictTo('admin'), couponController.deleteCoupon);

module.exports = router;