const { protect, restrictTo } = require('./auth');

const adminMiddleware = [protect, restrictTo('admin')];

module.exports = adminMiddleware;