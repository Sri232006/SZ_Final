const { Wishlist, Product, ProductImage, Cart } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

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
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    results: wishlist.length,
    data: wishlist,
  });
});

// Add item to wishlist
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { notes, priority, reminderPrice, isReminderActive } = req.body;

  if (!productId) {
    return next(new AppError('Product ID is required', 400));
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const existingItem = await Wishlist.findOne({
    where: {
      userId: req.user.id,
      productId,
    },
  });

  if (existingItem) {
    return next(new AppError('Product already in wishlist', 400));
  }

  const wishlistItem = await Wishlist.create({
    userId: req.user.id,
    productId,
    notes: notes || null,
    priority: priority || 'medium',
    reminderPrice: reminderPrice || null,
    isReminderActive: isReminderActive || false,
  });

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
  const { quantity = 1, size = 'M', color = 'Black' } = req.body;

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

  if (product.stock < quantity) {
    return next(new AppError('Insufficient stock', 400));
  }

  const existingCartItem = await Cart.findOne({
    where: {
      userId: req.user.id,
      productId: product.id,
      size: size,
      color: color,
    },
  });

  if (existingCartItem) {
    await existingCartItem.update({
      quantity: existingCartItem.quantity + quantity,
    });
  } else {
    await Cart.create({
      userId: req.user.id,
      productId: product.id,
      quantity: quantity,
      size: size,
      color: color,
    });
  }

  await wishlistItem.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Product moved to cart successfully',
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