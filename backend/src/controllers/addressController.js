const { Address, User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

// @desc    Get all addresses for current user
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = catchAsync(async (req, res, next) => {
  const addresses = await Address.findAll({
    where: { userId: req.user.id },
    order: [
      ['isDefault', 'DESC'],
      ['isShippingDefault', 'DESC'],
      ['isBillingDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });

  res.status(200).json({
    status: 'success',
    results: addresses.length,
    data: addresses,
  });
});

// @desc    Get single address
// @route   GET /api/addresses/:id
// @access  Private
exports.getAddress = catchAsync(async (req, res, next) => {
  const address = await Address.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!address) {
    return next(new AppError('Address not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: address,
  });
});

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
exports.createAddress = catchAsync(async (req, res, next) => {
  const {
    type, name, phone, addressLine1, addressLine2,
    landmark, city, state, pincode, country,
    isDefault, isBillingDefault, isShippingDefault,
    latitude, longitude, instructions,
  } = req.body;

  // If setting as default, remove default from other addresses
  if (isDefault || isBillingDefault || isShippingDefault) {
    const updateFields = {};
    if (isDefault) updateFields.isDefault = false;
    if (isBillingDefault) updateFields.isBillingDefault = false;
    if (isShippingDefault) updateFields.isShippingDefault = false;

    await Address.update(updateFields, {
      where: { userId: req.user.id },
    });
  }

  const address = await Address.create({
    userId: req.user.id,
    type: type || 'home',
    name,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
    country: country || 'India',
    isDefault: isDefault || false,
    isBillingDefault: isBillingDefault || false,
    isShippingDefault: isShippingDefault || false,
    latitude,
    longitude,
    instructions,
  });

  res.status(201).json({
    status: 'success',
    data: address,
  });
});

// @desc    Update address
// @route   PATCH /api/addresses/:id
// @access  Private
exports.updateAddress = catchAsync(async (req, res, next) => {
  const address = await Address.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!address) {
    return next(new AppError('Address not found', 404));
  }

  // If setting as default, remove default from others
  if (req.body.isDefault || req.body.isBillingDefault || req.body.isShippingDefault) {
    const updateFields = {};
    if (req.body.isDefault) updateFields.isDefault = false;
    if (req.body.isBillingDefault) updateFields.isBillingDefault = false;
    if (req.body.isShippingDefault) updateFields.isShippingDefault = false;

    await Address.update(updateFields, {
      where: {
        userId: req.user.id,
        id: { [Op.ne]: req.params.id },
      },
    });
  }

  await address.update(req.body);

  res.status(200).json({
    status: 'success',
    data: address,
  });
});

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = catchAsync(async (req, res, next) => {
  const address = await Address.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!address) {
    return next(new AppError('Address not found', 404));
  }

  await address.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Address deleted successfully',
  });
});

// @desc    Set address as default
// @route   PATCH /api/addresses/:id/default
// @access  Private
exports.setDefaultAddress = catchAsync(async (req, res, next) => {
  const { type } = req.body; // 'shipping', 'billing', or 'both'

  const address = await Address.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id,
    },
  });

  if (!address) {
    return next(new AppError('Address not found', 404));
  }

  // Reset existing defaults
  const updateFields = {};
  const addressUpdate = {};

  if (type === 'shipping' || type === 'both') {
    updateFields.isShippingDefault = false;
    addressUpdate.isShippingDefault = true;
  }
  if (type === 'billing' || type === 'both') {
    updateFields.isBillingDefault = false;
    addressUpdate.isBillingDefault = true;
  }
  if (!type) {
    updateFields.isDefault = false;
    addressUpdate.isDefault = true;
  }

  await Address.update(updateFields, {
    where: {
      userId: req.user.id,
      id: { [Op.ne]: req.params.id },
    },
  });

  await address.update(addressUpdate);

  res.status(200).json({
    status: 'success',
    message: 'Default address updated',
    data: address,
  });
});

// @desc    Get default addresses
// @route   GET /api/addresses/defaults
// @access  Private
exports.getDefaultAddresses = catchAsync(async (req, res, next) => {
  const [shippingDefault, billingDefault, generalDefault] = await Promise.all([
    Address.findOne({
      where: { userId: req.user.id, isShippingDefault: true },
    }),
    Address.findOne({
      where: { userId: req.user.id, isBillingDefault: true },
    }),
    Address.findOne({
      where: { userId: req.user.id, isDefault: true },
    }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      shipping: shippingDefault || generalDefault || null,
      billing: billingDefault || generalDefault || null,
      default: generalDefault || null,
    },
  });
});

// @desc    Validate pincode format
// @route   GET /api/addresses/validate-pincode/:pincode
// @access  Public
exports.validatePincode = catchAsync(async (req, res, next) => {
  const { pincode } = req.params;

  // Indian pincode format: 6 digits, first digit 1-9
  const isValid = /^[1-9][0-9]{5}$/.test(pincode);

  res.status(200).json({
    status: 'success',
    data: {
      pincode,
      isValid,
      message: isValid ? 'Valid pincode format' : 'Invalid pincode format. Must be a 6-digit Indian pincode.',
    },
  });
});

// @desc    Get pincode details
// @route   GET /api/addresses/pincode/:pincode
// @access  Private
exports.getPincodeDetails = catchAsync(async (req, res, next) => {
  const { pincode } = req.params;

  // Validate format
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return next(new AppError('Invalid pincode format', 400));
  }

  // Return basic pincode info (in production, integrate with a pincode API)
  res.status(200).json({
    status: 'success',
    data: {
      pincode,
      deliveryAvailable: true,
      estimatedDelivery: '3-7 business days',
      message: 'Delivery available for this pincode',
    },
  });
});
