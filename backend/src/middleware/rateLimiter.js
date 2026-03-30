const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 10000000, // 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000000000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

module.exports = { authLimiter, apiLimiter };