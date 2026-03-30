const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ),
    defaultValue: 'pending',
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending',
  },
  paymentMethod: {
    type: DataTypes.ENUM('razorpay', 'cod'),
    allowNull: false,
  },
  paymentId: {
    type: DataTypes.STRING,
  },
  paymentDetails: {
    type: DataTypes.JSONB,
  },
  refundId: {
    type: DataTypes.STRING,
  },
  refundedAt: {
    type: DataTypes.DATE,
  },
  shippingAddressSnapshot: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  billingAddressSnapshot: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  cancellationReason: {
    type: DataTypes.STRING,
  },
  cancelledAt: {
    type: DataTypes.DATE,
  },
  trackingNumber: {
    type: DataTypes.STRING,
  },
  carrier: {
    type: DataTypes.STRING,
  },
  trackingUrl: {
    type: DataTypes.STRING,
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['orderNumber'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['status'],
    },
  ],
});

module.exports = Order;