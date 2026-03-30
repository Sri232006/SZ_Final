const { Wishlist, Product, ProductImage } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

// Get user's wishlist
exports.getWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Product,
        as: 'product',
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
    order: [['priority', 'DESC'], ['createdAt', 'DESC']],
  });

  // Group by priority for better UX
  const groupedWishlist = {
    high: wishlist.filter(item => item.priority === 'high'),
    medium: wishlist.filter(item => item.priority === 'medium'),
    low: wishlist.filter(item => item.priority === 'low'),
    all: wishlist,
  };

  res.status(200).json({
    status: 'success',
    results: wishlist.length,
    data: groupedWishlist,
  });
});

// Add item to wishlist
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { notes, priority, reminderPrice, isReminderActive } = req.body;

  // Check if product exists
  const product = await Product.findByPk(productId);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if already in wishlist
  const existingItem = await Wishlist.findOne({
    where: {
      userId: req.user.id,
      productId,
    },
  });

  if (existingItem) {
    return next(new AppError('Product already in wishlist', 400));
  }

  // Add to wishlist
  const wishlistItem = await Wishlist.create({
    userId: req.user.id,
    productId,
    notes,
    priority: priority || 'medium',
    reminderPrice: reminderPrice || null,
    isReminderActive: isReminderActive || false,
  });

  // Fetch the created item with product details
  const newItem = await Wishlist.findByPk(wishlistItem.id, {
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'url', 'isPrimary'],
          },
        ],
      },
    ],
  });

  res.status(201).json({
    status: 'success',
    message: 'Product added to wishlist',
    data: newItem,
  });
});

// Remove from wishlist
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const wishlistItem = await Wishlist.findOne({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!wishlistItem) {
    return next(new AppError('Wishlist item not found', 404));
  }

  await wishlistItem.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Product removed from wishlist',
  });
});

// Update wishlist item
exports.updateWishlistItem = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { notes, priority, reminderPrice, isReminderActive } = req.body;

  const wishlistItem = await Wishlist.findOne({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!wishlistItem) {
    return next(new AppError('Wishlist item not found', 404));
  }

  await wishlistItem.update({
    notes: notes !== undefined ? notes : wishlistItem.notes,
    priority: priority || wishlistItem.priority,
    reminderPrice: reminderPrice !== undefined ? reminderPrice : wishlistItem.reminderPrice,
    isReminderActive: isReminderActive !== undefined ? isReminderActive : wishlistItem.isReminderActive,
  });

  // Fetch updated item with product details
  const updatedItem = await Wishlist.findByPk(id, {
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'url', 'isPrimary'],
          },
        ],
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: updatedItem,
  });
});

// Clear entire wishlist
exports.clearWishlist = catchAsync(async (req, res, next) => {
  await Wishlist.destroy({
    where: { userId: req.user.id },
  });

  res.status(200).json({
    status: 'success',
    message: 'Wishlist cleared successfully',
  });
});

// Check if product is in wishlist
exports.checkWishlistStatus = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const wishlistItem = await Wishlist.findOne({
    where: {
      userId: req.user.id,
      productId,
    },
  });

  res.status(200).json({
    status: 'success',
    data: {
      isInWishlist: !!wishlistItem,
      item: wishlistItem || null,
    },
  });
});

// Get wishlist count
exports.getWishlistCount = catchAsync(async (req, res, next) => {
  const count = await Wishlist.count({
    where: { userId: req.user.id },
  });

  res.status(200).json({
    status: 'success',
    data: { count },
  });
});

// Move wishlist item to cart
exports.moveToCart = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { quantity, size, color } = req.body;

  const wishlistItem = await Wishlist.findOne({
    where: {
      id,
      userId: req.user.id,
    },
    include: [
      {
        model: Product,
        as: 'product',
      },
    ],
  });

  if (!wishlistItem) {
    return next(new AppError('Wishlist item not found', 404));
  }

  const product = wishlistItem.product;

  // Check stock
  if (product.stock < (quantity || 1)) {
    return next(new AppError('Insufficient stock', 400));
  }

  // Add to cart (assuming you have a Cart model)
  const { Cart } = require('../models');
  
  const existingCartItem = await Cart.findOne({
    where: {
      userId: req.user.id,
      productId: product.id,
      size: size || 'M',
      color: color || product.color,
    },
  });

  if (existingCartItem) {
    await existingCartItem.update({
      quantity: existingCartItem.quantity + (quantity || 1),
    });
  } else {
    await Cart.create({
      userId: req.user.id,
      productId: product.id,
      quantity: quantity || 1,
      size: size || 'M',
      color: color || product.color,
    });
  }

  // Optionally remove from wishlist after moving to cart
  await wishlistItem.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Product moved to cart successfully',
  });
});

// Share wishlist (generate public link)
exports.shareWishlist = catchAsync(async (req, res, next) => {
  const { id } = req.params; // wishlist item id or 'all' for entire wishlist
  
  // Generate a unique share token
  const crypto = require('crypto');
  const shareToken = crypto.randomBytes(16).toString('hex');
  
  // You might want to store this token in a separate Share model
  // For now, we'll just return the shareable link
  
  const shareableLink = `${process.env.FRONTEND_URL}/shared-wishlist/${shareToken}`;
  
  // If email is provided, send share link via email
  const { email } = req.body;
  if (email) {
    const userName = req.user.name;
    await emailService.sendWishlistShare(email, userName, shareableLink);
  }

  res.status(200).json({
    status: 'success',
    data: {
      shareableLink,
      message: email ? 'Wishlist shared via email' : 'Shareable link generated',
    },
  });
});

// Get price drop notifications
exports.checkPriceDrops = catchAsync(async (req, res, next) => {
  const wishlistItems = await Wishlist.findAll({
    where: {
      userId: req.user.id,
      isReminderActive: true,
      reminderPrice: { [Op.not]: null },
    },
    include: [
      {
        model: Product,
        as: 'product',
      },
    ],
  });

  const priceDrops = [];

  for (const item of wishlistItems) {
    if (item.product.price <= item.reminderPrice) {
      priceDrops.push({
        product: item.product,
        currentPrice: item.product.price,
        targetPrice: item.reminderPrice,
      });

      // Send notification email
      await emailService.sendPriceDropNotification(
        req.user.email,
        item.product.name,
        item.product.price,
        item.reminderPrice
      );
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      priceDrops,
      count: priceDrops.length,
    },
  });
});