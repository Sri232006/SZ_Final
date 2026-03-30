const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('home', 'work', 'other'),
    defaultValue: 'home',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Recipient name',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[0-9]{10}$/,
    },
  },
  addressLine1: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  addressLine2: {
    type: DataTypes.STRING,
  },
  landmark: {
    type: DataTypes.STRING,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[1-9][0-9]{5}$/, // Indian pincode format
    },
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'India',
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isBillingDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isShippingDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
  },
  longitude: {
    type: DataTypes.FLOAT,
  },
  instructions: {
    type: DataTypes.TEXT,
    comment: 'Delivery instructions',
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['pincode'],
    },
  ],
});

module.exports = Address;