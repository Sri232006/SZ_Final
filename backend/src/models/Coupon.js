const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false,
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  minOrderValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  maxDiscount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  usageLimit: {
    type: DataTypes.INTEGER,
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  applicableCategories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },
  applicableProducts: {
    type: DataTypes.ARRAY(DataTypes.UUID),
  },
}, {
  timestamps: true,
});

module.exports = Coupon;    