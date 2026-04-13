const { Product, Category, ProductImage, Review, User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const cacheService = require('../services/cacheService');
const imageService = require('../services/imageService');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
exports.getAllProducts = catchAsync(async (req, res, next) => {
  const cacheKey = `products:${JSON.stringify(req.query)}`;
  
  // Try to get from cache
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    return res.status(200).json({
      status: 'success',
      fromCache: true,
      data: cachedData,
    });
  }

  // Build query using APIFeatures
  const features = new APIFeatures(req.query)
    .filter()
    .search()
    .sort()
    .paginate();

  const queryOptions = features.build();

  const products = await Product.findAll({
    where: queryOptions.where,
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary', 'order'],
        separate: true,
        order: [['order', 'ASC']],
      },
      {
        model: Category,
        attributes: ['id', 'name', 'type'],
      },
      {
        model: Review,
        as: 'reviews',
        attributes: ['id', 'rating'],
        separate: true,
        limit: 5,
      },
    ],
    order: queryOptions.order,
    limit: queryOptions.limit,
    offset: queryOptions.offset,
  });

  const totalCount = await Product.count({ where: queryOptions.where });

  // Calculate average rating for each product
  const productsWithRating = products.map(product => {
    const productData = product.toJSON();
    if (productData.reviews && productData.reviews.length > 0) {
      const avgRating = productData.reviews.reduce((sum, review) => sum + review.rating, 0) / productData.reviews.length;
      productData.averageRating = Math.round(avgRating * 10) / 10;
      productData.reviewCount = productData.reviews.length;
    } else {
      productData.averageRating = 0;
      productData.reviewCount = 0;
    }
    delete productData.reviews;
    return productData;
  });

  const response = {
    products: productsWithRating,
    pagination: {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      total: totalCount,
      pages: Math.ceil(totalCount / (parseInt(req.query.limit, 10) || 10)),
    },
    filters: {
      categories: await Category.findAll({ attributes: ['id', 'name', 'type'] }),
      brands: await Product.findAll({ 
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('brand')), 'brand']],
        where: { brand: { [Op.ne]: null } },
        raw: true,
      }),
      priceRange: {
        min: await Product.min('price'),
        max: await Product.max('price'),
      },
    },
  };

  // Cache for 5 minutes
  await cacheService.set(cacheKey, response, 300);

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: response,
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const cacheKey = `product:${id}`;
  
  // Try to get from cache
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    return res.status(200).json({
      status: 'success',
      fromCache: true,
      data: cachedData,
    });
  }

  const product = await Product.findByPk(id, {
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary', 'order'],
      },
      {
        model: Category,
        attributes: ['id', 'name', 'type'],
      },
      {
        model: Review,
        as: 'reviews',
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'profileImage'],
          },
        ],
        limit: 20,
        separate: true,
        order: [['createdAt', 'DESC']],
      },
    ],
    order: [
      [{ model: ProductImage, as: 'images' }, 'order', 'ASC'],
    ],
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Calculate average rating
  const productData = product.toJSON();
  if (productData.reviews && productData.reviews.length > 0) {
    const avgRating = productData.reviews.reduce((sum, review) => sum + review.rating, 0) / productData.reviews.length;
    productData.averageRating = Math.round(avgRating * 10) / 10;
    productData.reviewCount = productData.reviews.length;
    
    // Calculate rating distribution
    productData.ratingDistribution = {
      5: productData.reviews.filter(r => r.rating === 5).length,
      4: productData.reviews.filter(r => r.rating === 4).length,
      3: productData.reviews.filter(r => r.rating === 3).length,
      2: productData.reviews.filter(r => r.rating === 2).length,
      1: productData.reviews.filter(r => r.rating === 1).length,
    };
  } else {
    productData.averageRating = 0;
    productData.reviewCount = 0;
    productData.ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  }

  // Get related products (same category)
  const relatedProducts = await Product.findAll({
    where: {
      categoryId: product.categoryId,
      id: { [Op.ne]: id },
    },
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary'],
        where: { isPrimary: true },
        required: false,
      },
    ],
    limit: 8,
  });

  productData.relatedProducts = relatedProducts;

  // Set estimated delivery (7 days from now)
  productData.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Cache for 5 minutes
  await cacheService.set(cacheKey, productData, 300);

  res.status(200).json({
    status: 'success',
    data: productData,
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    brand,
    description,
    categoryId,
    price,
    color,
    size,
    material,
    stock,
    discount,
    isFeatured,
    isNew,
    isTrending,
  } = req.body;

  // Validate category
  const category = await Category.findByPk(categoryId);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Create product
  const product = await Product.create({
    name,
    brand,
    description,
    categoryId,
    price,
    color,
    size,
    material,
    stock,
    discount: discount || 0,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    isNew: isNew === 'true' || isNew === true,
    isTrending: isTrending === 'true' || isTrending === true,
  });

  // Handle images if uploaded
  if (req.files && req.files.length > 0) {
    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      // Upload to cloud storage or save locally
      let imageUrl;
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
        try {
          imageUrl = await imageService.uploadImage(file, 'products');
        } catch (uploadError) {
          console.error('Cloudinary upload failed, falling back to local storage:', uploadError.message);
          imageUrl = `/uploads/products/${file.filename}`;
        }
      } else {
        // Local storage fallback
        imageUrl = `/uploads/products/${file.filename}`;
      }
      
      images.push({
        productId: product.id,
        url: imageUrl,
        isPrimary: i === 0,
        order: i,
      });
    }
    
    await ProductImage.bulkCreate(images);
  }

  // Fetch created product with images
  const newProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary', 'order'],
      },
      {
        model: Category,
        attributes: ['id', 'name', 'type'],
      },
    ],
  });

  // Clear cache
  await cacheService.delByPattern('products:*');

  res.status(201).json({
    status: 'success',
    data: newProduct,
  });
});

// @desc    Update product
// @route   PATCH /api/products/:id
// @access  Private/Admin
exports.updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findByPk(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // If category is being updated, validate it
  if (req.body.categoryId) {
    const category = await Category.findByPk(req.body.categoryId);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }
  }

  // Update product
  await product.update(req.body);

  // Handle new images if uploaded
  if (req.files && req.files.length > 0) {
    const existingImageCount = await ProductImage.count({ where: { productId: id } });
    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      let imageUrl;
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
        imageUrl = await imageService.uploadImage(file, 'products');
      } else {
        imageUrl = `/uploads/products/${file.filename}`;
      }
      
      images.push({
        productId: id,
        url: imageUrl,
        isPrimary: i === 0 && req.body.setAsPrimary === 'true',
        order: existingImageCount + i,
      });
    }
    
    await ProductImage.bulkCreate(images);
  }

  // Fetch updated product with images
  const updatedProduct = await Product.findByPk(id, {
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary', 'order'],
      },
      {
        model: Category,
        attributes: ['id', 'name', 'type'],
      },
    ],
  });

  // Clear cache
  await cacheService.del(`product:${id}`);
  await cacheService.delByPattern('products:*');

  res.status(200).json({
    status: 'success',
    data: updatedProduct,
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findByPk(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Delete product images from storage
  const images = await ProductImage.findAll({ where: { productId: id } });
  for (const image of images) {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
      await imageService.deleteImage(image.url);
    }
  }

  await product.destroy();

  // Clear cache
  await cacheService.del(`product:${id}`);
  await cacheService.delByPattern('products:*');

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;

  const category = await Category.findByPk(categoryId);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  const products = await Product.findAll({
    where: { categoryId },
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary'],
        where: { isPrimary: true },
        required: false,
      },
    ],
    limit: 20,
  });

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      category,
      products,
    },
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = catchAsync(async (req, res, next) => {
  const cacheKey = 'products:featured';
  
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    return res.status(200).json({
      status: 'success',
      fromCache: true,
      data: cachedData,
    });
  }

  const products = await Product.findAll({
    where: { isFeatured: true },
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary'],
        where: { isPrimary: true },
        required: false,
      },
    ],
    limit: 10,
    order: [['createdAt', 'DESC']],
  });

  await cacheService.set(cacheKey, products, 300);

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
exports.getNewArrivals = catchAsync(async (req, res, next) => {
  const cacheKey = 'products:new-arrivals';
  
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    return res.status(200).json({
      status: 'success',
      fromCache: true,
      data: cachedData,
    });
  }

  const products = await Product.findAll({
    where: { isNew: true },
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary'],
        where: { isPrimary: true },
        required: false,
      },
    ],
    limit: 10,
    order: [['createdAt', 'DESC']],
  });

  await cacheService.set(cacheKey, products, 300);

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});

// @desc    Get trending products
// @route   GET /api/products/trending
// @access  Public
exports.getTrendingProducts = catchAsync(async (req, res, next) => {
  const cacheKey = 'products:trending';
  
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    return res.status(200).json({
      status: 'success',
      fromCache: true,
      data: cachedData,
    });
  }

  const products = await Product.findAll({
    where: { isTrending: true },
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary'],
        where: { isPrimary: true },
        required: false,
      },
    ],
    limit: 10,
    order: [['createdAt', 'DESC']],
  });

  await cacheService.set(cacheKey, products, 300);

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return next(new AppError('Please provide at least 2 characters for search', 400));
  }

  const products = await Product.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { brand: { [Op.iLike]: `%${q}%` } },
      ],
    },
    include: [
      {
        model: ProductImage,
        as: 'images',
        attributes: ['id', 'url', 'isPrimary'],
        where: { isPrimary: true },
        required: false,
      },
    ],
    limit: 20,
  });

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { quantity, operation } = req.body; // operation: 'add' or 'remove'

  const product = await Product.findByPk(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  let newStock;
  if (operation === 'add') {
    newStock = product.stock + quantity;
  } else if (operation === 'remove') {
    newStock = product.stock - quantity;
    if (newStock < 0) {
      return next(new AppError('Insufficient stock', 400));
    }
  } else {
    return next(new AppError('Invalid operation. Use "add" or "remove"', 400));
  }

  await product.update({ stock: newStock });

  // Clear cache
  await cacheService.del(`product:${id}`);
  await cacheService.delByPattern('products:*');

  res.status(200).json({
    status: 'success',
    data: { stock: newStock },
  });
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.addReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  const product = await Product.findByPk(id);
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    where: {
      userId: req.user.id,
      productId: id,
    },
  });

  if (existingReview) {
    return next(new AppError('You have already reviewed this product', 400));
  }

  // Create review
  const review = await Review.create({
    userId: req.user.id,
    productId: id,
    rating,
    title,
    comment,
    isVerifiedPurchase: await checkVerifiedPurchase(req.user.id, id),
  });

  // Update product rating
  const reviews = await Review.findAll({ where: { productId: id } });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  await product.update({
    rating: avgRating,
    numReviews: reviews.length,
  });

  // Clear cache
  await cacheService.del(`product:${id}`);
  await cacheService.delByPattern('products:*');

  res.status(201).json({
    status: 'success',
    data: review,
  });
});

// @desc    Delete product image
// @route   DELETE /api/products/:productId/images/:imageId
// @access  Private/Admin
exports.deleteProductImage = catchAsync(async (req, res, next) => {
  const { productId, imageId } = req.params;

  const image = await ProductImage.findOne({
    where: {
      id: imageId,
      productId,
    },
  });

  if (!image) {
    return next(new AppError('Image not found', 404));
  }

  // Delete from storage
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
    await imageService.deleteImage(image.url);
  }

  await image.destroy();

  // If this was primary image, set another as primary
  if (image.isPrimary) {
    const nextImage = await ProductImage.findOne({
      where: { productId },
      order: [['order', 'ASC']],
    });
    
    if (nextImage) {
      await nextImage.update({ isPrimary: true });
    }
  }

  // Clear cache
  await cacheService.del(`product:${productId}`);
  await cacheService.delByPattern('products:*');

  res.status(200).json({
    status: 'success',
    message: 'Image deleted successfully',
  });
});

// @desc    Set primary product image
// @route   PATCH /api/products/:productId/images/:imageId/primary
// @access  Private/Admin
exports.setPrimaryImage = catchAsync(async (req, res, next) => {
  const { productId, imageId } = req.params;

  // Remove primary from all images
  await ProductImage.update(
    { isPrimary: false },
    { where: { productId } }
  );

  // Set new primary
  const image = await ProductImage.findOne({
    where: {
      id: imageId,
      productId,
    },
  });

  if (!image) {
    return next(new AppError('Image not found', 404));
  }

  await image.update({ isPrimary: true });

  // Clear cache
  await cacheService.del(`product:${productId}`);
  await cacheService.delByPattern('products:*');

  res.status(200).json({
    status: 'success',
    data: image,
  });
});

// Helper function to check verified purchase
async function checkVerifiedPurchase(userId, productId) {
  const { Order, OrderItem } = require('../models');
  
  const order = await Order.findOne({
    where: { userId, status: 'delivered' },
    include: [
      {
        model: OrderItem,
        as: 'orderItems',
        where: { productId },
        required: true,
      },
    ],
  });

  return !!order;
}