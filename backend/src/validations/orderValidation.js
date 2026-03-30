const { body } = require('express-validator');

const createOrderValidation = [
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['razorpay', 'cod']).withMessage('Payment method must be razorpay or cod'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email'),
  body('couponCode')
    .optional()
    .trim()
    .isString().withMessage('Coupon code must be a string'),
  body('shippingAddressId')
    .optional()
    .isUUID().withMessage('Invalid shipping address ID'),
  body('billingAddressId')
    .optional()
    .isUUID().withMessage('Invalid billing address ID'),
];

module.exports = {
  createOrderValidation,
};
