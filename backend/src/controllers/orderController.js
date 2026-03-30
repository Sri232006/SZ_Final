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
    billingAddressId,
    shippingAddress: newShippingAddress,
    billingAddress: newBillingAddress,
    phone,
    email,
    paymentMethod,
    couponCode,
    notes,
    useSameAddress = true,
  } = req.body;

  // Start transaction
  const transaction = await sequelize.transaction();

  try {
    // Get cart items with product details
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'stock', 'discount'],
        },
      ],
      transaction,
    });

    if (cartItems.length === 0) {
      await transaction.rollback();
      return next(new AppError('Cart is empty', 400));
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const product = item.Product;
      
      // Check stock
      if (product.stock < item.quantity) {
        await transaction.rollback();
        return next(new AppError(`Insufficient stock for ${product.name}. Only ${product.stock} available.`, 400));
      }

      // Calculate item price with discount
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
    }

    // Handle addresses
    let shippingAddr, billingAddr;

    // Get or create shipping address
    if (shippingAddressId) {
      shippingAddr = await Address.findOne({
        where: {
          id: shippingAddressId,
          userId: req.user.id,
        },
        transaction,
      });
      if (!shippingAddr) {
        await transaction.rollback();
        return next(new AppError('Shipping address not found', 404));
      }
    } else if (newShippingAddress) {
      shippingAddr = await Address.create({
        ...newShippingAddress,
        userId: req.user.id,
        name: newShippingAddress.name || req.user.name,
        phone: newShippingAddress.phone || phone || req.user.phone,
      }, { transaction });
    } else {
      // Get default shipping address
      shippingAddr = await Address.findOne({
        where: { 
          userId: req.user.id, 
          isShippingDefault: true 
        },
        transaction,
      });
      if (!shippingAddr) {
        // Fallback to any address
        shippingAddr = await Address.findOne({
          where: { userId: req.user.id },
          transaction,
        });
      }
      if (!shippingAddr) {
        await transaction.rollback();
        return next(new AppError('Please provide a shipping address', 400));
      }
    }

    // Get or create billing address
    if (useSameAddress) {
      billingAddr = shippingAddr;
    } else if (billingAddressId) {
      billingAddr = await Address.findOne({
        where: {
          id: billingAddressId,
          userId: req.user.id,
        },
        transaction,
      });
      if (!billingAddr) {
        await transaction.rollback();
        return next(new AppError('Billing address not found', 404));
      }
    } else if (newBillingAddress) {
      billingAddr = await Address.create({
        ...newBillingAddress,
        userId: req.user.id,
        name: newBillingAddress.name || req.user.name,
        phone: newBillingAddress.phone || phone || req.user.phone,
      }, { transaction });
    } else {
      billingAddr = shippingAddr; // Fallback to shipping
    }

    // Create address snapshots (store the address data at time of order)
    const shippingSnapshot = shippingAddr.toJSON();
    delete shippingSnapshot.createdAt;
    delete shippingSnapshot.updatedAt;

    const billingSnapshot = billingAddr.toJSON();
    delete billingSnapshot.createdAt;
    delete billingSnapshot.updatedAt;

    // Apply coupon if provided
    let discountAmount = 0;
    let couponId = null;

    if (couponCode) {
      const appliedCoupon = await Coupon.findOne({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          startDate: { [Op.lte]: new Date() },
          endDate: { [Op.gte]: new Date() },
        },
        transaction,
      });

      if (!appliedCoupon) {
        await transaction.rollback();
        return next(new AppError('Invalid or expired coupon', 400));
      }

      // Check usage limit
      if (appliedCoupon.usageLimit && appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
        await transaction.rollback();
        return next(new AppError('Coupon usage limit exceeded', 400));
      }

      // Check minimum order value
      if (totalAmount < appliedCoupon.minOrderValue) {
        await transaction.rollback();
        return next(new AppError(`Minimum order value for this coupon is ₹${appliedCoupon.minOrderValue}`, 400));
      }

      // Calculate discount
      discountAmount = calculateDiscount(totalAmount, appliedCoupon);
      couponId = appliedCoupon.id;

      // Increment coupon usage
      await appliedCoupon.increment('usedCount', { transaction });
    }

    const finalAmount = totalAmount - discountAmount;
    const orderNumber = generateOrderNumber();

    // Create order
    const order = await Order.create({
      orderNumber,
      userId: req.user.id,
      totalAmount,
      discountAmount,
      finalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      shippingAddressId: shippingAddr.id,
      billingAddressId: billingAddr.id,
      shippingAddressSnapshot: shippingSnapshot,
      billingAddressSnapshot: billingSnapshot,
      phone: phone || shippingAddr.phone || req.user.phone,
      email: email || req.user.email,
      notes,
      couponId,
    }, { transaction });

    // Create order items
    await OrderItem.bulkCreate(
      orderItems.map(item => ({
        ...item,
        orderId: order.id,
      })),
      { transaction }
    );

    // Update product stock
    for (const item of cartItems) {
      await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    // Clear cart
    await Cart.destroy({
      where: { userId: req.user.id },
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    // Fetch complete order for response
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'brand', 'price'],
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
        }
      ],
    });

    // Send email confirmation (async, don't await)
    emailService.sendOrderConfirmation(req.user.email, completeOrder, req.user.name)
      .catch(err => console.error('Email sending failed:', err));

    // Send WhatsApp order confirmation (async)
    const orderPhone = phone || req.user.phone;
    if (orderPhone) {
      const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      whatsappService.sendOrderConfirmation(orderPhone, orderNumber, finalAmount, itemCount)
        .catch(err => console.error('WhatsApp order notification failed:', err));
    }

    // Handle payment
    if (paymentMethod === 'razorpay') {
      const paymentOrder = await paymentService.createOrder({
        amount: finalAmount,
        currency: 'INR',
        receipt: orderNumber,
      });

      await order.update({ paymentId: paymentOrder.id });

      res.status(201).json({
        status: 'success',
        data: {
          order: completeOrder,
          payment: {
            orderId: paymentOrder.id,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
          },
        },
      });
    } else if (paymentMethod === 'cod') {
      // Cash on delivery - order is confirmed
      await order.update({ 
        paymentStatus: 'pending',
        status: 'confirmed' 
      });

      res.status(201).json({
        status: 'success',
        data: {
          order: completeOrder,
          message: 'Order placed successfully. Pay on delivery.',
        },
      });
    } else {
      res.status(201).json({
        status: 'success',
        data: completeOrder,
      });
    }

  } catch (error) {
    await transaction.rollback();
    throw error;
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

  // Add item count to each order
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

  // Check cancellation window (24 hours)
  const hoursSinceOrder = (new Date() - new Date(order.createdAt)) / (1000 * 60 * 60);
  if (hoursSinceOrder > 24) {
    return next(new AppError('Orders can only be cancelled within 24 hours of placement', 400));
  }

  const transaction = await sequelize.transaction();

  try {
    // Update order status
    await order.update({ 
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date()
    }, { transaction });

    // Restore stock
    for (const item of order.orderItems) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.productId },
        transaction,
      });
    }

    // Process refund if payment completed
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
        // Don't block cancellation
      }
    }

    await transaction.commit();

    // Send cancellation email (async)
    if (order.user && order.user.email) {
      emailService.sendOrderCancellationEmail(order.user.email, order)
        .catch(err => console.error('Cancellation email failed:', err));
    }

    // Send WhatsApp cancellation (async)
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
    await transaction.rollback();
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

  // Update order status
  await order.update({
    paymentStatus: 'completed',
    status: 'confirmed',
    paymentDetails: {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      paidAt: new Date(),
    },
  });

  // Send confirmation email
  if (order.user && order.user.email) {
    emailService.sendPaymentConfirmation(order.user.email, order)
      .catch(err => console.error('Payment confirmation email failed:', err));
  }

  // Send WhatsApp payment confirmation (async)
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

  const order = await Order.findOne({
    where: {
      id,
      userId: req.user.id,
    },
    attributes: ['id', 'orderNumber', 'status', 'paymentStatus', 'createdAt', 'updatedAt',
                 'trackingNumber', 'carrier', 'trackingUrl', 'estimatedDelivery'],
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Generate tracking timeline
  const timeline = [
    {
      status: 'Order Placed',
      date: order.createdAt,
      completed: true,
      description: 'Your order has been placed successfully',
    },
    {
      status: 'Order Confirmed',
      date: order.status !== 'pending' ? order.updatedAt : null,
      completed: order.status !== 'pending',
      description: 'Your order has been confirmed',
    },
    {
      status: 'Processing',
      date: ['processing', 'shipped', 'delivered'].includes(order.status) ? order.updatedAt : null,
      completed: ['processing', 'shipped', 'delivered'].includes(order.status),
      description: 'Your order is being processed',
    },
    {
      status: 'Shipped',
      date: ['shipped', 'delivered'].includes(order.status) ? order.updatedAt : null,
      completed: ['shipped', 'delivered'].includes(order.status),
      description: 'Your order has been shipped',
    },
    {
      status: 'Delivered',
      date: order.status === 'delivered' ? order.updatedAt : null,
      completed: order.status === 'delivered',
      description: 'Your order has been delivered',
    },
  ];

  // Add tracking info if available
  let trackingInfo = null;
  if (order.trackingNumber) {
    trackingInfo = {
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery,
    };
  }

  res.status(200).json({
    status: 'success',
    data: {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      paymentStatus: order.paymentStatus,
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

  // Check return window (7 days)
  const daysSinceDelivery = (new Date() - new Date(order.updatedAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > 7) {
    return next(new AppError('Returns are only accepted within 7 days of delivery', 400));
  }

  // Process return request
  const returnRequest = {
    orderId: order.id,
    reason,
    items: items || order.orderItems.map(item => ({ id: item.id, quantity: item.quantity })),
    status: 'pending',
    requestedAt: new Date(),
  };

  // Send return request email (async)
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

  // Check stock availability for each item
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

  // Add items to cart
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
      {
        model: OrderItem,
        as: 'orderItems',
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
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'phone'],
      },
    ],
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Generate invoice data
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