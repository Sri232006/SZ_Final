const { body } = require('express-validator');

const createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  body('brand')
    .trim()
    .notEmpty().withMessage('Brand is required'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),
  body('categoryId')
    .notEmpty().withMessage('Category ID is required')
    .isUUID().withMessage('Invalid category ID'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('color')
    .trim()
    .notEmpty().withMessage('Color is required'),
  body('size')
    .notEmpty().withMessage('Size is required')
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']).withMessage('Invalid size'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('discount')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
];

const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId')
    .optional()
    .isUUID().withMessage('Invalid category ID'),
  body('size')
    .optional()
    .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']).withMessage('Invalid size'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('discount')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
];

module.exports = {
  createProductValidation,
  updateProductValidation,
};
