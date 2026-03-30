const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { 
  registerValidation, 
  loginValidation, 
  passwordValidation 
} = require('../validations/authValidation');

router.post('/register', authLimiter, validate(registerValidation), authController.register);
router.post('/login', authLimiter, validate(loginValidation), authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(passwordValidation), authController.resetPassword);
router.post('/update-password', protect, validate(passwordValidation), authController.updatePassword);

module.exports = router;