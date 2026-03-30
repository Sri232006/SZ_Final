const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Wishlist = sequelize.define('Wishlist', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  notes: {
    type: DataTypes.TEXT,
    comment: 'User notes for this wishlist item',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  reminderPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Price at which user wants to be notified',
  },
  isReminderActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'productId'], // Prevent duplicate wishlist items
    },
  ],
});

module.exports = Wishlist;