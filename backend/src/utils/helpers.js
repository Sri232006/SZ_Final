const crypto = require('crypto');

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

const calculateDiscount = (amount, coupon) => {
  if (coupon.discountType === 'percentage') {
    const discount = (amount * coupon.discountValue) / 100;
    return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
  } else {
    return coupon.discountValue;
  }
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

module.exports = {
  generateToken,
  generateOrderNumber,
  calculateDiscount,
  formatPrice,
};