const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const ProductImage = require('./ProductImage');
const Cart = require('./Cart');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Coupon = require('./Coupon');
const Review = require('./Review');
const Wishlist = require('./Wishlist');
const Address = require('./Address');
const LandingConfig = require('./LandingConfig');

// User associations
User.hasOne(Cart, { foreignKey: 'userId' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
User.hasMany(Wishlist, { foreignKey: 'userId', as: 'wishlist' });
Wishlist.belongsTo(User, { foreignKey: 'userId' });

// Category associations
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// Product associations
Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });

Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId' });
Review.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Wishlist, { foreignKey: 'productId' });
Wishlist.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Cart associations
Cart.belongsTo(User, { foreignKey: 'userId' });
Cart.belongsTo(Product, { foreignKey: 'productId' });

// Order associations
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'orderItems' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });
Order.belongsTo(Address, { as: 'shippingAddress', foreignKey: 'shippingAddressId' });
Order.belongsTo(Address, { as: 'billingAddress', foreignKey: 'billingAddressId' });

// Coupon associations
Coupon.hasMany(Order, { foreignKey: 'couponId', as: 'orders' });

// Address associations
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Product,
  Category,
  ProductImage,
  Cart,
  Order,
  OrderItem,
  Coupon,
  Review,
  Wishlist,
  Address,
  LandingConfig,
};