const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LandingConfig = sequelize.define('LandingConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sections: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [
      {
        key: 'hero',
        title: 'Hero Carousel',
        visible: true,
        order: 1,
        config: {
          slides: [
            { image: '/images/hero1.jpg', title: 'Define Your\nStreet Style', subtitle: 'New Collection 2026', cta: 'Shop Now', ctaLink: '/shop' },
            { image: '/images/hero2.jpg', title: 'Bold.\nFearless.\nYou.', subtitle: 'Streetwear Essentials', cta: 'Explore', ctaLink: '/shop' },
            { image: '/images/hero3.jpg', title: 'Elevate Your\nEveryday', subtitle: 'Premium Quality', cta: 'Discover', ctaLink: '/shop' },
          ],
        },
      },
      {
        key: 'categories',
        title: 'Shop by Category',
        subtitle: 'Explore our curated collections crafted for the modern youth',
        visible: true,
        order: 2,
        config: {},
      },
      {
        key: 'featured',
        title: 'Featured Drops',
        subtitle: '',
        visible: true,
        order: 3,
        config: { limit: 6 },
      },
      {
        key: 'offers',
        title: 'Special Offers',
        subtitle: '',
        visible: true,
        order: 4,
        config: {
          banners: [
            { image: '/images/pongal-offer.jpg', title: 'Pongal Special', subtitle: 'Up to 40% off on traditional wear', link: '/shop?sale=true' },
            { image: '/images/summer-offer.jpg', title: 'Summer Sale', subtitle: 'Fresh styles at unbeatable prices', link: '/shop?sale=true' },
          ],
        },
      },
      {
        key: 'lookbook',
        title: 'Style Inspiration',
        subtitle: 'Get inspired by our latest campaign looks',
        visible: true,
        order: 5,
        config: {
          images: ['/images/hero4.jpg', '/images/hero5.jpg', '/images/hero6.jpg'],
        },
      },
      {
        key: 'perks',
        title: 'Why Choose Us',
        subtitle: '',
        visible: true,
        order: 6,
        config: {
          items: [
            { icon: 'Truck', label: 'Free Shipping', desc: 'On orders above ₹999' },
            { icon: 'ShieldCheck', label: 'Secure Payment', desc: '100% secure checkout' },
            { icon: 'RefreshCcw', label: 'Easy Returns', desc: '7-day return policy' },
            { icon: 'CreditCard', label: 'COD Available', desc: 'Cash on delivery' },
          ],
        },
      },
    ],
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'landing_configs',
  timestamps: true,
});

module.exports = LandingConfig;
