const { Order, OrderItem, Cart, Product, Coupon, User, Address, ProductImage } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateOrderNumber, calculateDiscount } = require('../utils/helpers');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = catchAsync(async (req, res, next) => {
  const {
    shippingAddressId,
    paymentMethod,
    directBuy,
    items: directItems,
  } = req.body;

  console.log('=== CREATE ORDER ===');
  console.log('Direct buy:', directBuy);
  console.log('Items:', directItems);

  const transaction = await sequelize.transaction();

  try {
    let totalAmount = 0;
    let orderItems = [];
    let isDirectBuy = directBuy === true;

    // DIRECT BUY MODE
    if (isDirectBuy && directItems && directItems.length > 0) {
      for (const item of directItems) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          await transaction.rollback();
          return next(new AppError(`Product not found: ${item.productId}`, 404));
        }
        
        if (product.stock < item.quantity) {
          await transaction.rollback();
          return next(new AppError(`Insufficient stock for ${product.name}`, 400));
        }
        
        const itemPrice = product.discount > 0 
          ? product.price - (product.price * product.discount / 100)
          : product.price;
        const itemTotal = itemPrice * item.quantity;
        totalAmount += parseFloat(itemTotal);
        
        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: itemPrice,
          size: item.size || 'M',
          color: item.color || 'Black',
          productName: product.name,
        });
        
        await Product.decrement('stock', {
          by: item.quantity,
          where: { id: product.id },
          transaction,
        });
      }
    } else {
      // NORMAL CART CHECKOUT
      const cartItems = await Cart.findAll({
        where: { userId: req.user.id },
        include: [{ model: Product }],
        transaction,
      });

      if (cartItems.length === 0) {
        await transaction.rollback();
        return next(new AppError('Cart is empty', 400));
      }

      for (const item of cartItems) {
        const product = item.Product;
        if (product.stock < item.quantity) {
          await transaction.rollback();
          return next(new AppError(`Insufficient stock for ${product.name}`, 400));
        }
        
        const itemPrice = product.discount > 0 
          ? product.price - (product.price * product.discount / 100)
          : product.price;
        const itemTotal = itemPrice * item.quantity;
        totalAmount += parseFloat(itemTotal);
        
        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: itemPrice,
          size: item.size,
          color: item.color,
          productName: product.name,
        });
        
        await Product.decrement('stock', {
          by: item.quantity,
          where: { id: product.id },
          transaction,
        });
      }
    }

    // Get shipping address
    const shippingAddr = await Address.findOne({
      where: { id: shippingAddressId, userId: req.user.id },
      transaction,
    });

    if (!shippingAddr) {
      await transaction.rollback();
      return next(new AppError('Shipping address not found', 404));
    }

    const shippingSnapshot = shippingAddr.toJSON();
    delete shippingSnapshot.createdAt;
    delete shippingSnapshot.updatedAt;

    // Generate order number
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `SZ${timestamp}${random}`;
    const finalAmount = totalAmount;

    // Calculate delivery date (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    // Create order
    const order = await Order.create({
      orderNumber,
      userId: req.user.id,
      totalAmount,
      discountAmount: 0,
      finalAmount,
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      paymentMethod: paymentMethod || 'razorpay',
      shippingAddressId: shippingAddr.id,
      billingAddressId: shippingAddr.id,
      shippingAddressSnapshot: shippingSnapshot,
      billingAddressSnapshot: shippingSnapshot,
      phone: shippingAddr.phone || req.user.phone,
      email: req.user.email,
      estimatedDelivery,
    }, { transaction });

    // Create order items
    if (orderItems.length > 0) {
      await OrderItem.bulkCreate(
        orderItems.map(item => ({
          ...item,
          orderId: order.id,
        })),
        { transaction }
      );
    }

    // Clear cart only if not direct buy
    if (!isDirectBuy) {
      await Cart.destroy({
        where: { userId: req.user.id },
        transaction,
      });
    }

    // COMMIT transaction
    await transaction.commit();

    // Fetch complete order
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: Address, as: 'shippingAddress' },
      ],
    });

    res.status(201).json({
      status: 'success',
      data: {
        order: completeOrder,
      },
    });

  } catch (error) {
    // Rollback only if transaction is not already committed
    if (transaction && transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    console.error('Order creation error:', error);
    return next(new AppError(error.message || 'Failed to create order', 500));
  }
});

// @desc    Get all orders for current user
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const whereClause = { userId: req.user.id };
  if (status) whereClause.status = status;

  const orders = await Order.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: OrderItem,
        as: 'orderItems',
        attributes: ['id', 'quantity', 'price', 'size', 'color', 'productName'],
        include: [
          {
            model: Product,
            attributes: ['id', 'brand'],
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
        attributes: ['id', 'addressLine1', 'city', 'state', 'pincode', 'phone']
      }
    ],
  });

  const ordersWithCount = orders.rows.map(order => {
    const orderData = order.toJSON();
    orderData.itemCount = orderData.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    return orderData;
  });

  res.status(200).json({
    status: 'success',
    data: {
      orders: ordersWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: orders.count,
        pages: Math.ceil(orders.count / parseInt(limit)),
      },
    },
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const whereClause = {
    userId: req.user.id,
  };
  
  if (uuidRegex.test(id)) {
    whereClause.id = id;
  } else {
    whereClause.orderNumber = id;
  }

  const order = await Order.findOne({
    where: whereClause,
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
      },
      {
        model: Address,
        as: 'billingAddress',
      },
      {
        model: Coupon,
        as: 'coupon',
      },
    ],
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: order,
  });
});

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findOne({
    where: {
      id,
      userId: req.user.id,
      status: {
        [Op.in]: ['pending', 'confirmed']
      }
    },
    include: [
      { model: OrderItem, as: 'orderItems' },
      { model: User, as: 'user', attributes: ['email', 'name'] }
    ]
  });

  if (!order) {
    return next(new AppError('Order not found or cannot be cancelled', 404));
  }

  const hoursSinceOrder = (new Date() - new Date(order.createdAt)) / (1000 * 60 * 60);
  if (hoursSinceOrder > 24) {
    return next(new AppError('Orders can only be cancelled within 24 hours of placement', 400));
  }

  const transaction = await sequelize.transaction();

  try {
    await order.update({ 
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date()
    }, { transaction });

    for (const item of order.orderItems) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    if (order.paymentStatus === 'completed' && order.paymentId) {
      try {
        const refund = await paymentService.refundPayment(order.paymentId, order.finalAmount);
        await order.update({ 
          paymentStatus: 'refunded',
          refundId: refund.id,
          refundedAt: new Date()
        }, { transaction });
      } catch (refundError) {
        console.error('Refund failed:', refundError);
      }
    }

    await transaction.commit();

    if (order.user && order.user.email) {
      emailService.sendOrderCancellationEmail(order.user.email, order)
        .catch(err => console.error('Cancellation email failed:', err));
    }

    const cancelPhone = order.phone || order.user?.phone;
    if (cancelPhone) {
      whatsappService.sendOrderCancelled(cancelPhone, order.orderNumber, reason)
        .catch(err => console.error('WhatsApp cancellation failed:', err));
    }

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        refundStatus: order.paymentStatus === 'completed' ? 'refunded' : 'not_applicable',
      },
    });

  } catch (error) {
    if (transaction && transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    throw error;
  }
});

// @desc    Verify payment
// @route   POST /api/orders/verify-payment
// @access  Private
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const isValid = paymentService.verifyPayment({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    return next(new AppError('Invalid payment signature', 400));
  }

  const order = await Order.findOne({ 
    where: { paymentId: razorpay_order_id },
    include: [{ model: User, as: 'user', attributes: ['email', 'name'] }]
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  await order.update({
    paymentStatus: 'completed',
    status: 'confirmed',
    paymentDetails: {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      paidAt: new Date(),
    },
  });

  if (order.user && order.user.email) {
    emailService.sendPaymentConfirmation(order.user.email, order)
      .catch(err => console.error('Payment confirmation email failed:', err));
  }

  const paymentPhone = order.phone || order.user?.phone;
  if (paymentPhone) {
    whatsappService.sendPaymentConfirmation(paymentPhone, order.orderNumber, order.finalAmount, razorpay_payment_id)
      .catch(err => console.error('WhatsApp payment confirmation failed:', err));
  }

  res.status(200).json({
    status: 'success',
    message: 'Payment verified successfully',
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: razorpay_payment_id,
    },
  });
});

// @desc    Track order
// @route   GET /api/orders/:id/track
// @access  Private
exports.trackOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const whereClause = {
    userId: req.user.id,
  };
  
  if (uuidRegex.test(id)) {
    whereClause.id = id;
  } else {
    whereClause.orderNumber = id;
  }

  const order = await Order.findOne({
    where: whereClause,
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
      },
      {
        model: Address,
        as: 'billingAddress',
      },
      {
        model: Coupon,
        as: 'coupon',
      },
    ],
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const timeline = [
    { status: 'Order Placed', date: order.createdAt, completed: true, description: 'Your order has been placed successfully' },
    { status: 'Order Confirmed', date: order.status !== 'pending' ? order.updatedAt : null, completed: order.status !== 'pending', description: 'Your order has been confirmed' },
    { status: 'Processing', date: ['processing', 'shipped', 'delivered'].includes(order.status) ? order.updatedAt : null, completed: ['processing', 'shipped', 'delivered'].includes(order.status), description: 'Your order is being processed' },
    { status: 'Shipped', date: ['shipped', 'delivered'].includes(order.status) ? order.updatedAt : null, completed: ['shipped', 'delivered'].includes(order.status), description: 'Your order has been shipped' },
    { status: 'Delivered', date: order.status === 'delivered' ? order.updatedAt : null, completed: order.status === 'delivered', description: 'Your order has been delivered' },
  ];

  let trackingInfo = null;
  if (order.trackingNumber) {
    trackingInfo = {
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery,
    };
  }

  // Set default estimated delivery if not set
  const estimatedDelivery = order.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  res.status(200).json({
    status: 'success',
    data: {
      ...order.toJSON(),
      estimatedDelivery,
      timeline,
      tracking: trackingInfo,
    },
  });
});

// @desc    Request order return
// @route   POST /api/orders/:id/return
// @access  Private
exports.requestReturn = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reason, items } = req.body;

  const order = await Order.findOne({
    where: {
      id,
      userId: req.user.id,
      status: 'delivered',
    },
    include: [{ model: OrderItem, as: 'orderItems' }],
  });

  if (!order) {
    return next(new AppError('Order not found or cannot be returned', 404));
  }

  const daysSinceDelivery = (new Date() - new Date(order.updatedAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 7) {
    return next(new AppError('Returns are only accepted within 7 days of delivery', 400));
  }

  const returnRequest = {
    orderId: order.id,
    reason,
    items: items || order.orderItems.map(item => ({ id: item.id, quantity: item.quantity })),
    status: 'pending',
    requestedAt: new Date(),
  };

  emailService.sendReturnRequestEmail(req.user.email, order, returnRequest)
    .catch(err => console.error('Return request email failed:', err));

  res.status(200).json({
    status: 'success',
    message: 'Return request submitted successfully',
    data: {
      requestId: `RET-${Date.now()}`,
      orderNumber: order.orderNumber,
      status: 'pending',
      expectedResponse: 'within 48 hours',
    },
  });
});

// @desc    Reorder previous order
// @route   POST /api/orders/:id/reorder
// @access  Private
exports.reorder = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const previousOrder = await Order.findOne({
    where: {
      id,
      userId: req.user.id,
    },
    include: [{ model: OrderItem, as: 'orderItems' }],
  });

  if (!previousOrder) {
    return next(new AppError('Order not found', 404));
  }

  const unavailableItems = [];
  for (const item of previousOrder.orderItems) {
    const product = await Product.findByPk(item.productId);
    if (!product || product.stock < item.quantity) {
      unavailableItems.push({
        name: item.productName,
        requested: item.quantity,
        available: product?.stock || 0,
      });
    }
  }

  if (unavailableItems.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Some items are out of stock',
      data: { unavailableItems },
    });
  }

  for (const item of previousOrder.orderItems) {
    await Cart.findOrCreate({
      where: {
        userId: req.user.id,
        productId: item.productId,
        size: item.size,
        color: item.color,
      },
      defaults: {
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      },
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Items added to cart successfully',
    data: {
      itemsAdded: previousOrder.orderItems.length,
      cartUrl: '/cart',
    },
  });
});

// @desc    Get order invoice
// @route   GET /api/orders/:id/invoice
// @access  Private
exports.getInvoice = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findOne({
    where: {
      id,
      userId: req.user.id,
    },
    include: [
      { model: OrderItem, as: 'orderItems' },
      { model: Address, as: 'shippingAddress' },
      { model: Address, as: 'billingAddress' },
      { model: Coupon, as: 'coupon' },
      { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
    ],
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  const invoice = {
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    date: order.createdAt,
    dueDate: order.createdAt,
    customer: {
      name: order.user.name,
      email: order.user.email,
      phone: order.phone,
    },
    billingAddress: order.billingAddress || order.billingAddressSnapshot,
    shippingAddress: order.shippingAddress || order.shippingAddressSnapshot,
    items: order.orderItems.map(item => ({
      name: item.productName,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
    subtotal: order.totalAmount,
    discount: order.discountAmount,
    total: order.finalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    notes: order.notes,
  };

  res.status(200).json({
    status: 'success',
    data: invoice,
  });
});