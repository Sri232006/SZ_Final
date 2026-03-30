const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/env');
const { generateToken } = require('../utils/helpers');
const emailService = require('../services/emailService');

const signToken = (id) => {
  return jwt.sign({ id }, config.JWT.SECRET, {
    expiresIn: config.JWT.EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  // Remove password from output
  const userData = user.toJSON();
  delete userData.password;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userData,
    },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;

  // Check if user exists
  const checkEmail = email?.toLowerCase();
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email: checkEmail }, { phone }],
    },
  });

  if (existingUser) {
    return next(new AppError('User with this email or phone already exists', 400));
  }

  // Check if this is the first user
  const userCount = await User.count();
  const role = userCount === 0 ? 'admin' : 'user';

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
  });

  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    return next(new AppError('Please provide email/phone and password', 400));
  }

  const whereClause = {};
  if (email) whereClause.email = email.toLowerCase();
  if (phone) whereClause.phone = phone;

  const user = await User.findOne({
    where: whereClause,
  });

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email/phone or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }

  await user.update({ lastLogin: new Date() });

  createSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return next(new AppError('No user found with this email address', 404));
  }

  const resetToken = generateToken();
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  await user.update({
    resetPasswordToken,
    resetPasswordExpire: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  const resetURL = `${config.FRONTEND_URL}/auth/reset-password/${resetToken}`;

  try {
    await emailService.sendPasswordResetEmail(user.email, resetURL);

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    await user.update({
      resetPasswordToken: null,
      resetPasswordExpire: null,
    });

    return next(new AppError('Error sending email. Please try again later.', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    where: {
      resetPasswordToken,
      resetPasswordExpire: { [Op.gt]: Date.now() },
    },
  });

  if (!user) {
    return next(new AppError('Invalid or expired token', 400));
  }

  await user.update({
    password,
    resetPasswordToken: null,
    resetPasswordExpire: null,
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful',
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findByPk(req.user.id);

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  await user.update({ password: newPassword });

  createSendToken(user, 200, res);
});