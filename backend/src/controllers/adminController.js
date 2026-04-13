const { User, Product, Order, Coupon, LandingConfig, Category } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: users,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Order,
        limit: 10,
        order: [['createdAt', 'DESC']],
      },
    ],
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent role update through this endpoint for security
  const { role, ...updateData } = req.body;

  await user.update(updateData);

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.promoteToAdmin = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  await user.update({ role: 'admin' });

  res.status(200).json({
    status: 'success',
    message: 'User promoted to admin successfully',
  });
});

exports.deactivateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.role === 'admin') {
    // Check if this is the last admin
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      return next(new AppError('Cannot deactivate the last admin', 400));
    }
  }

  await user.update({ isActive: false });

  res.status(200).json({
    status: 'success',
    message: 'User deactivated successfully',
  });
});

exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [
    totalUsers,
    newUsersThisMonth,
    totalProducts,
    totalOrders,
    ordersThisMonth,
    revenueThisMonth,
    recentOrders,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
    Product.count(),
    Order.count(),
    Order.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
    Order.sum('finalAmount', {
      where: {
        createdAt: { [Op.gte]: startOfMonth },
        paymentStatus: 'completed',
      },
    }),
    Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
        },
      ],
    }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      products: totalProducts,
      orders: {
        total: totalOrders,
        thisMonth: ordersThisMonth,
      },
      revenue: {
        thisMonth: revenueThisMonth || 0,
      },
      recentOrders,
    },
  });
});

// ─── Landing Page Config ─────────────────────────────
exports.getLandingConfig = catchAsync(async (req, res) => {
  let config = await LandingConfig.findOne();
  if (!config) {
    config = await LandingConfig.create({});
  }
  res.status(200).json({ status: 'success', data: config });
});

exports.updateLandingConfig = catchAsync(async (req, res) => {
  const { sections } = req.body;
  let config = await LandingConfig.findOne();
  if (!config) {
    config = await LandingConfig.create({ sections, updatedBy: req.user.id });
  } else {
    await config.update({ sections, updatedBy: req.user.id });
  }
  res.status(200).json({ status: 'success', data: config });
});

// ─── Admin Orders ────────────────────────────────────
exports.getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
    ],
  });
  res.status(200).json({ status: 'success', results: orders.length, data: orders });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, trackingNumber, carrier } = req.body;
  const order = await Order.findByPk(id);
  if (!order) return next(new AppError('Order not found', 404));
  const updateData = { status };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (carrier) updateData.carrier = carrier;
  await order.update(updateData);
  res.status(200).json({ status: 'success', data: order });
});

// ─── Admin Delivery Date ────────────────────────────────
exports.updateDeliveryDate = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { deliveryDate } = req.body;

  const order = await Order.findByPk(id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Format delivery date with day name
  const formattedDate = new Date(deliveryDate);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDeliveryDate = formattedDate.toLocaleDateString('en-IN', options);

  await order.update({
    deliveryDate,
    estimatedDelivery: deliveryDate,
    deliveryDateFormatted: formattedDeliveryDate, // Store formatted date
  });

  res.status(200).json({
    status: 'success',
    message: 'Delivery date updated successfully',
    data: { 
      deliveryDate,
      formattedDeliveryDate,
    },
  });
});

// ─── Admin Categories ────────────────────────────────
exports.getAllCategories = catchAsync(async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  res.status(200).json({ status: 'success', data: categories });
});

exports.createCategory = catchAsync(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ status: 'success', data: category });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const category = await Category.findByPk(id);
  if (!category) return next(new AppError('Category not found', 404));
  await category.update(req.body);
  res.status(200).json({ status: 'success', data: category });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const category = await Category.findByPk(id);
  if (!category) return next(new AppError('Category not found', 404));
  await category.destroy();
  res.status(204).json({ status: 'success', data: null });
});