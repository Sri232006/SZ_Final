const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

// Public routes (for pincode validation)
router.get('/validate-pincode/:pincode', addressController.validatePincode);

// All other routes require authentication
router.use(protect);

// Address management
router.get('/', addressController.getAddresses);
router.get('/defaults', addressController.getDefaultAddresses);
router.post('/', addressController.createAddress);
router.get('/:id', addressController.getAddress);
router.patch('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/default', addressController.setDefaultAddress);

// Pincode details (authenticated)
router.get('/pincode/:pincode', addressController.getPincodeDetails);

module.exports = router;