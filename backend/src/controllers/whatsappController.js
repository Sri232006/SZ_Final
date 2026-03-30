const whatsappService = require('../services/whatsappService');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// @desc    Send OTP via WhatsApp
// @route   POST /api/whatsapp/send-otp
// @access  Public (for registration) / Private (for verification)
exports.sendOTP = catchAsync(async (req, res, next) => {
  const { phone, purpose } = req.body;

  if (!phone) {
    return next(new AppError('Phone number is required', 400));
  }

  // Validate phone format (10-digit Indian number)
  if (!/^[0-9]{10}$/.test(phone)) {
    return next(new AppError('Please provide a valid 10-digit phone number', 400));
  }

  // For registration — check phone isn't already taken
  if (purpose === 'registration') {
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return next(new AppError('Phone number already registered', 400));
    }
  }

  // For verification — ensure the user is authenticated and owns the number
  if (purpose === 'verification' && req.user) {
    if (req.user.phone !== phone) {
      return next(new AppError('Phone number does not match your account', 400));
    }
  }

  const result = await whatsappService.sendOTP(phone, purpose || 'verification');

  res.status(200).json({
    status: 'success',
    data: {
      phone: phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3'), // Mask phone
      expiresIn: result.expiresIn,
      message: result.message,
    },
  });
});

// @desc    Verify OTP
// @route   POST /api/whatsapp/verify-otp
// @access  Public
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { phone, otp, purpose } = req.body;

  if (!phone || !otp) {
    return next(new AppError('Phone number and OTP are required', 400));
  }

  if (!/^[0-9]{6}$/.test(otp)) {
    return next(new AppError('OTP must be a 6-digit number', 400));
  }

  const result = await whatsappService.verifyOTP(phone, otp, purpose || 'verification');

  if (!result.verified) {
    return res.status(400).json({
      status: 'fail',
      message: result.message,
      data: {
        attemptsRemaining: result.attemptsRemaining,
      },
    });
  }

  // If user is authenticated and verifying their number, mark as verified
  if (req.user && purpose === 'verification') {
    await User.update(
      { phoneVerified: true },
      { where: { id: req.user.id } }
    );
  }

  res.status(200).json({
    status: 'success',
    message: result.message,
    data: {
      verified: true,
      phone,
    },
  });
});

// @desc    Get verification status for current user
// @route   GET /api/whatsapp/status
// @access  Private
exports.getVerificationStatus = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'phone', 'phoneVerified'],
  });

  res.status(200).json({
    status: 'success',
    data: {
      phone: user.phone ? user.phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3') : null,
      verified: user.phoneVerified || false,
    },
  });
});
