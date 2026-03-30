const Razorpay = require('razorpay');
const config = require('./env');

const razorpay = new Razorpay({
  key_id: config.RAZORPAY.KEY_ID,
  key_secret: config.RAZORPAY.KEY_SECRET,
});

module.exports = razorpay;