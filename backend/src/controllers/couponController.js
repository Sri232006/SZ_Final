const { Coupon } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

exports.getAllCoupons = catchAsync(async (req, res, next) => {
  const whereClause = {};
  
  // Regular users can only see public coupons
  if (req.user.role !== 'admin') {
    whereClause.isPublic = true;
  }

  const coupons = await Coupon.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    results: coupons.length,
    data: coupons,
  });
});

exports.getCoupon = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByPk(id);

  if (!coupon) {
    return next(new AppError('Coupon not found', 404));
  }

  // Check if coupon is public or user is admin
  if (!coupon.isPublic && req.user.role !== 'admin') {
    return next(new AppError('Coupon not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: coupon,
  });
});

exports.validateCoupon = catchAsync(async (req, res, next) => {
  const { code } = req.params;
  const { orderAmount } = req.query;

  const coupon = await Coupon.findOne({
    where: {
      code,
      isActive: true,
      startDate: { [Op.lte]: new Date() },
      endDate: { [Op.gte]: new Date() },
    },
  });

  if (!coupon) {
    return next(new AppError('Invalid or expired coupon', 400));
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return next(new AppError('Coupon usage limit exceeded', 400));
  }

  if (orderAmount && orderAmount < coupon.minOrderValue) {
    return next(new AppError(`Minimum order value should be ${coupon.minOrderValue}`, 400));
  }

  res.status(200).json({
    status: 'success',
    data: {
      isValid: true,
      coupon,
    },
  });
});

exports.createCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.create(req.body);

  res.status(201).json({
    status: 'success',
    data: coupon,
  });
});

exports.updateCoupon = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByPk(id);
  if (!coupon) {
    return next(new AppError('Coupon not found', 404));
  }

  await coupon.update(req.body);

  res.status(200).json({
    status: 'success',
    data: coupon,
  });
});

exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByPk(id);
  if (!coupon) {
    return next(new AppError('Coupon not found', 404));
  }

  await coupon.destroy();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});