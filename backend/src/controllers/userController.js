const { User, Order, Wishlist, Review, Address, Product, ProductImage, OrderItem, Coupon } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const imageService = require('../services/imageService');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
    include: [
      {
        model: Address,
        as: 'addresses',
        required: false,
        separate: true,
        order: [
          ['isDefault', 'DESC'],
          ['isShippingDefault', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: 10,
      },
      {
        model: Order,
        as: 'orders',
        required: false,
        limit: 5,
        separate: true,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'orderNumber', 'finalAmount', 'status', 'createdAt'],
        include: [
          {
            model: Address,
            as: 'shippingAddress',
            attributes: ['id', 'addressLine1', 'city', 'state', 'pincode']
          }
        ]
      },
      {
        model: Wishlist,
        as: 'wishlist',
        required: false,
        limit: 5,
        separate: true,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'brand', 'price'],
            include: [
              {
                model: ProductImage,
                as: 'images',
                attributes: ['id', 'url', 'isPrimary'],
                where: { isPrimary: true },
                required: false,
              }
            ]
          }
        ],
      },
      {
        model: Review,
        as: 'reviews',
        required: false,
        limit: 5,
        separate: true,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'brand']
          }
        ]
      },
    ],
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get default addresses
  const defaultAddresses = {
    shipping: user.addresses?.find(addr => addr.isShippingDefault) || user.addresses?.[0] || null,
    billing: user.addresses?.find(addr => addr.isBillingDefault) || user.addresses?.[0] || null,
  };

  // Get statistics
  const stats = {
    orders: {
      total: await Order.count({ where: { userId: req.user.id } }),
      completed: await Order.count({ where: { userId: req.user.id, status: 'delivered' } }),
      cancelled: await Order.count({ where: { userId: req.user.id, status: 'cancelled' } }),
    },
    spending: {
      total: await Order.sum('finalAmount', { 
        where: { 
          userId: req.user.id,
          paymentStatus: 'completed' 
        } 
      }) || 0,
      average: await Order.findOne({
        where: { userId: req.user.id, paymentStatus: 'completed' },
        attributes: [[sequelize.fn('AVG', sequelize.col('finalAmount')), 'average']],
        raw: true,
      }).then(result => result?.average || 0),
    },
    wishlist: {
      total: await Wishlist.count({ where: { userId: req.user.id } }),
      withReminders: await Wishlist.count({ 
        where: { 
          userId: req.user.id,
          isReminderActive: true 
        } 
      }),
    },
    reviews: {
      total: await Review.count({ where: { userId: req.user.id } }),
      average: await Review.findOne({
        where: { userId: req.user.id },
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'average']],
        raw: true,
      }).then(result => result?.average || 0),
    },
    addresses: {
      total: user.addresses?.length || 0,
    },
  };

  // Format the response
  const userData = user.toJSON();
  
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        profileImage: userData.profileImage,
        isActive: userData.isActive,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        addresses: userData.addresses || [],
        recentOrders: userData.orders || [],
        wishlist: userData.wishlist || [],
        recentReviews: userData.reviews || [],
      },
      defaultAddresses,
      stats,
    },
  });
});

// @desc    Update user profile
// @route   PATCH /api/users/profile
// @access  Private
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { name, email, phone } = req.body;
  
  // Check if at least one field is provided
  if (!name && !email && !phone) {
    return next(new AppError('Please provide at least one field to update', 400));
  }

  // Check if email/phone already taken by another user
  if (email || phone) {
    const conditions = [];
    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });

    const existingUser = await User.findOne({
      where: {
        [Op.or]: conditions,
        id: { [Op.ne]: req.user.id },
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Phone';
      return next(new AppError(`${field} already in use by another account`, 400));
    }
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;

  await req.user.update(updateData);

  // Fetch updated user without sensitive data
  const updatedUser = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
    include: [
      {
        model: Address,
        as: 'addresses',
        required: false,
        limit: 10,
      }
    ],
  });

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image', 400));
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new AppError('Invalid file type. Please upload JPEG, PNG, GIF, or WEBP', 400));
  }

  // Validate file size (max 2MB)
  if (req.file.size > 2 * 1024 * 1024) {
    return next(new AppError('File too large. Maximum size is 2MB', 400));
  }

  let imageUrl;
  
  // Upload to cloud storage or save locally
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
    imageUrl = await imageService.uploadImage(req.file, 'profiles');
  } else {
    // Local storage fallback
    imageUrl = `/uploads/profiles/${req.file.filename}`;
  }

  // Delete old profile image if exists and not default
  if (req.user.profileImage && !req.user.profileImage.includes('default')) {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
      await imageService.deleteImage(req.user.profileImage);
    }
  }

  await req.user.update({ profileImage: imageUrl });

  res.status(200).json({
    status: 'success',
    data: {
      profileImage: imageUrl,
      message: 'Profile picture updated successfully',
    },
  });
});

// @desc    Delete profile picture
// @route   DELETE /api/users/profile/picture
// @access  Private
exports.deleteProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.user.profileImage || req.user.profileImage.includes('default')) {
    return next(new AppError('No profile picture to delete', 400));
  }

  // Delete from storage
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
    await imageService.deleteImage(req.user.profileImage);
  }

  // Set to null
  await req.user.update({ profileImage: null });

  res.status(200).json({
    status: 'success',
    message: 'Profile picture deleted successfully',
  });
});

// @desc    Get user orders with pagination and filters
// @route   GET /api/users/orders
// @access  Private
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, fromDate, toDate } = req.query;
  
  const whereClause = { userId: req.user.id };
  
  // Filter by status
  if (status) {
    whereClause.status = status;
  }

  // Filter by date range
  if (fromDate || toDate) {
    whereClause.createdAt = {};
    if (fromDate) {
      whereClause.createdAt[Op.gte] = new Date(fromDate);
    }
    if (toDate) {
      whereClause.createdAt[Op.lte] = new Date(toDate);
    }
  }

  const orders = await Order.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'brand', 'price'],
            include: [
              {
                model: ProductImage,
                as: 'images',
                attributes: ['id', 'url', 'isPrimary'],
                where: { isPrimary: true },
                required: false,
              }
            ]
          }
        ]
      },
      {
        model: Address,
        as: 'shippingAddress',
        attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] }
      },
      {
        model: Address,
        as: 'billingAddress',
        attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] }
      },
      {
        model: Coupon,
        as: 'coupon',
        attributes: ['id', 'code', 'discountType', 'discountValue']
      }
    ],
  });

  // Calculate order summaries
  const ordersWithSummary = orders.rows.map(order => {
    const orderData = order.toJSON();
    orderData.itemCount = orderData.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    return orderData;
  });

  res.status(200).json({
    status: 'success',
    data: {
      orders: ordersWithSummary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: orders.count,
        pages: Math.ceil(orders.count / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(orders.count / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
      summary: {
        totalAmount: ordersWithSummary.reduce((sum, order) => sum + parseFloat(order.finalAmount || 0), 0),
        averageOrderValue: orders.count > 0 
          ? ordersWithSummary.reduce((sum, order) => sum + parseFloat(order.finalAmount || 0), 0) / orders.count 
          : 0,
      }
    },
  });
});

// @desc    Get single order details
// @route   GET /api/users/orders/:id
// @access  Private
exports.getOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findOne({
    where: {
      id,
      userId: req.user.id,
    },
    include: [
      {
        model: OrderItem,
        as: 'orderItems',
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'brand', 'description', 'price', 'material'],
            include: [
              {
                model: ProductImage,
                as: 'images',
                attributes: ['id', 'url', 'isPrimary'],
              }
            ]
          }
        ]
      },
      {
        model: Address,
        as: 'shippingAddress',
        attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] }
      },
      {
        model: Address,
        as: 'billingAddress',
        attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] }
      },
      {
        model: Coupon,
        as: 'coupon',
        attributes: ['id', 'code', 'discountType', 'discountValue', 'description']
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'phone']
      }
    ],
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Get order timeline/status history
  const timeline = [
    {
      status: 'pending',
      date: order.createdAt,
      completed: true,
      description: 'Order placed successfully'
    },
    {
      status: 'confirmed',
      date: order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' 
        ? order.updatedAt : null,
      completed: order.status !== 'pending',
      description: 'Order confirmed by seller'
    },
    {
      status: 'processing',
      date: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' 
        ? order.updatedAt : null,
      completed: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered',
      description: 'Order is being processed'
    },
    {
      status: 'shipped',
      date: order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null,
      completed: order.status === 'shipped' || order.status === 'delivered',
      description: 'Order has been shipped'
    },
    {
      status: 'delivered',
      date: order.status === 'delivered' ? order.updatedAt : null,
      completed: order.status === 'delivered',
      description: 'Order delivered successfully'
    }
  ];

  // Add cancellation info if applicable
  if (order.status === 'cancelled') {
    timeline.push({
      status: 'cancelled',
      date: order.cancelledAt || order.updatedAt,
      completed: true,
      description: 'Order cancelled'
    });
  }

  const orderData = order.toJSON();
  orderData.timeline = timeline;

  res.status(200).json({
    status: 'success',
    data: orderData,
  });
});

// @desc    Cancel order
// @route   POST /api/users/orders/:id/cancel
// @access  Private
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findOne({
    where: {
      id,
      userId: req.user.id,
      status: {
        [Op.in]: ['pending', 'confirmed'] // Only allow cancellation for pending/confirmed orders
      }
    },
    include: [{ model: OrderItem, as: 'orderItems' }]
  });

  if (!order) {
    return next(new AppError('Order not found or cannot be cancelled', 404));
  }

  // Check if order is eligible for cancellation (within 24 hours of placement)
  const hoursSinceOrder = (new Date() - new Date(order.createdAt)) / (1000 * 60 * 60);
  if (hoursSinceOrder > 24) {
    return next(new AppError('Order cannot be cancelled after 24 hours. Please contact customer support.', 400));
  }

  // Update order status
  await order.update({ 
    status: 'cancelled',
    cancellationReason: reason,
    cancelledAt: new Date()
  });

  // Restore product stock
  for (const item of order.orderItems) {
    await Product.increment('stock', {
      by: item.quantity,
      where: { id: item.productId }
    });
  }

  // Process refund if payment was completed
  if (order.paymentStatus === 'completed' && order.paymentId) {
    try {
      // Initiate refund through payment service
      const paymentService = require('../services/paymentService');
      await paymentService.refundPayment(order.paymentId, order.finalAmount);
      
      await order.update({ paymentStatus: 'refunded' });
    } catch (error) {
      console.error('Refund failed:', error);
      // Log refund failure but don't block order cancellation
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Order cancelled successfully',
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      refundStatus: order.paymentStatus === 'completed' ? 'processing' : 'not_applicable'
    }
  });
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
exports.getWishlist = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, priority } = req.query;

  const whereClause = { userId: req.user.id };
  if (priority) {
    whereClause.priority = priority;
  }

  const wishlist = await Wishlist.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'brand', 'description', 'price', 'discount', 'stock', 'rating'],
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'url', 'isPrimary'],
          },
        ],
      },
    ],
    order: [
      ['priority', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });

  // Group by priority for better UX
  const groupedWishlist = {
    high: wishlist.rows.filter(item => item.priority === 'high'),
    medium: wishlist.rows.filter(item => item.priority === 'medium'),
    low: wishlist.rows.filter(item => item.priority === 'low'),
  };

  res.status(200).json({
    status: 'success',
    data: {
      items: wishlist.rows,
      grouped: groupedWishlist,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: wishlist.count,
        pages: Math.ceil(wishlist.count / parseInt(limit)),
      },
      summary: {
        total: wishlist.count,
        withReminders: wishlist.rows.filter(item => item.isReminderActive).length,
      },
    },
  });
});

// @desc    Get user reviews
// @route   GET /api/users/reviews
// @access  Private
exports.getMyReviews = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const reviews = await Review.findAndCountAll({
    where: { userId: req.user.id },
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    include: [
      {
        model: Product,
        attributes: ['id', 'name', 'brand', 'price'],
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'url', 'isPrimary'],
            where: { isPrimary: true },
            required: false,
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  // Calculate statistics
  const ratingStats = await Review.findAll({
    where: { userId: req.user.id },
    attributes: [
      'rating',
      [sequelize.fn('COUNT', sequelize.col('rating')), 'count'],
    ],
    group: ['rating'],
    raw: true,
  });

  const stats = {
    total: reviews.count,
    average: reviews.rows.length > 0
      ? reviews.rows.reduce((sum, r) => sum + r.rating, 0) / reviews.rows.length
      : 0,
    distribution: {
      5: parseInt(ratingStats.find(r => r.rating === 5)?.count || 0),
      4: parseInt(ratingStats.find(r => r.rating === 4)?.count || 0),
      3: parseInt(ratingStats.find(r => r.rating === 3)?.count || 0),
      2: parseInt(ratingStats.find(r => r.rating === 2)?.count || 0),
      1: parseInt(ratingStats.find(r => r.rating === 1)?.count || 0),
    },
  };

  res.status(200).json({
    status: 'success',
    data: {
      reviews: reviews.rows,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: reviews.count,
        pages: Math.ceil(reviews.count / parseInt(limit)),
      },
    },
  });
});

// @desc    Update user password
// @route   POST /api/users/change-password
// @access  Private
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  // Check current password
  const user = await User.findByPk(req.user.id);
  const isPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Validate new password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return next(new AppError('Password must contain at least 8 characters, including uppercase, lowercase, number and special character', 400));
  }

  // Update password
  await user.update({ password: newPassword });

  // Send email notification (don't block on failure)
  const emailService = require('../services/emailService');
  emailService.sendPasswordChangeNotification(user.email, user.name)
    .catch(err => console.error('Password change notification email failed:', err));

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
  });
});

// @desc    Deactivate account
// @route   POST /api/users/deactivate
// @access  Private
exports.deactivateAccount = catchAsync(async (req, res, next) => {
  const { password, reason } = req.body;

  if (!password) {
    return next(new AppError('Please provide your password', 400));
  }

  // Verify password
  const isPasswordCorrect = await req.user.comparePassword(password);
  if (!isPasswordCorrect) {
    return next(new AppError('Incorrect password', 401));
  }

  // Check for pending orders
  const pendingOrders = await Order.count({
    where: {
      userId: req.user.id,
      status: { [Op.in]: ['pending', 'confirmed', 'processing', 'shipped'] }
    }
  });

  if (pendingOrders > 0) {
    return next(new AppError('Cannot deactivate account with pending orders. Please complete or cancel your orders first.', 400));
  }

  // Deactivate account
  await req.user.update({ 
    isActive: false,
    deactivationReason: reason,
    deactivatedAt: new Date()
  });

  // Send farewell email (don't block on failure)
  const emailService = require('../services/emailService');
  emailService.sendAccountDeactivationEmail(req.user.email, req.user.name)
    .catch(err => console.error('Deactivation email failed:', err));

  res.status(200).json({
    status: 'success',
    message: 'Account deactivated successfully',
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = catchAsync(async (req, res, next) => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);

  const [
    orderStats,
    spendingStats,
    wishlistStats,
    reviewStats,
    monthlyOrders,
    recentActivity
  ] = await Promise.all([
    // Order statistics
    Order.findAll({
      where: { userId: req.user.id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count'],
        [sequelize.fn('SUM', sequelize.col('finalAmount')), 'total']
      ],
      group: ['status'],
      raw: true,
    }),

    // Spending statistics
    Order.findAll({
      where: { 
        userId: req.user.id,
        paymentStatus: 'completed'
      },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('SUM', sequelize.col('finalAmount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'DESC']],
      limit: 6,
      raw: true,
    }),

    // Wishlist statistics
    Wishlist.findAll({
      where: { userId: req.user.id },
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('priority')), 'count']
      ],
      group: ['priority'],
      raw: true,
    }),

    // Review statistics
    Review.findAll({
      where: { userId: req.user.id },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('rating')), 'count']
      ],
      group: ['rating'],
      raw: true,
    }),

    // Monthly orders for current year
    Order.findAll({
      where: {
        userId: req.user.id,
        createdAt: { [Op.gte]: startOfYear }
      },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
      raw: true,
    }),

    // Recent activity
    Order.findAll({
      where: { userId: req.user.id },
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'orderNumber', 'finalAmount', 'status', 'createdAt'],
      raw: true,
    }),
  ]);

  // Format statistics
  const stats = {
    orders: {
      total: orderStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      byStatus: orderStats.reduce((acc, stat) => ({ ...acc, [stat.status]: parseInt(stat.count) }), {}),
    },
    spending: {
      total: orderStats.find(s => s.status === 'delivered')?.total || 0,
      monthly: spendingStats,
      average: orderStats.find(s => s.status === 'delivered')?.total / 
                (orderStats.find(s => s.status === 'delivered')?.count || 1) || 0,
    },
    wishlist: {
      total: wishlistStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      byPriority: wishlistStats.reduce((acc, stat) => ({ ...acc, [stat.priority]: parseInt(stat.count) }), {}),
    },
    reviews: {
      total: reviewStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      byRating: reviewStats.reduce((acc, stat) => ({ ...acc, [stat.rating]: parseInt(stat.count) }), {}),
    },
    trends: {
      monthly: monthlyOrders,
    },
    recentActivity,
    membership: {
      joined: req.user.createdAt,
      daysActive: Math.floor((new Date() - new Date(req.user.createdAt)) / (1000 * 60 * 60 * 24)),
    },
  };

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});