const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id', adminController.updateUser);
router.post('/users/:id/promote', adminController.promoteToAdmin);
router.post('/users/:id/deactivate', adminController.deactivateUser);



// Orders management
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.patch('/orders/:id/delivery-date', adminController.updateDeliveryDate);

// Categories management
router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

module.exports = router;