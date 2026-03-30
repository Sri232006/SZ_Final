const express = require('express');
const router = express.Router();
const { LandingConfig, Category } = require('../models');
const catchAsync = require('../utils/catchAsync');

// Public landing page config — no auth required
router.get('/landing', catchAsync(async (req, res) => {
  let config = await LandingConfig.findOne();
  if (!config) {
    config = await LandingConfig.create({});
  }
  res.status(200).json({ status: 'success', data: config });
}));

// Public categories
router.get('/categories', catchAsync(async (req, res) => {
  const categories = await Category.findAll({
    order: [['name', 'ASC']],
  });
  res.status(200).json({ status: 'success', data: categories });
}));

module.exports = router;
