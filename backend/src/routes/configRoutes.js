const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const catchAsync = require('../utils/catchAsync');



// Public categories
router.get('/categories', catchAsync(async (req, res) => {
  const categories = await Category.findAll({
    order: [['name', 'ASC']],
  });
  res.status(200).json({ status: 'success', data: categories });
}));

module.exports = router;
