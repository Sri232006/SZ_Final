const sequelize = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { User, Category, Product, ProductImage, Address, Cart, Wishlist, Order, OrderItem, Review, Coupon, LandingConfig } = require('../src/models');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Sync database (force: true for development, careful in production)
    await sequelize.sync({ force: true });
    console.log('Database synced.');

    // Seed Users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      users.push({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        phone: `98765432${i.toString().padStart(2, '0')}`,
        password: await bcrypt.hash('password123', 12),
        role: i === 1 ? 'admin' : 'user',
        isActive: true,
      });
    }
    const createdUsers = await User.bulkCreate(users);
    console.log('Users seeded.');

    // Seed Categories
    const categories = [
      { name: 'T-Shirts', type: 'men', description: 'Casual t-shirts', image: '/images/cat1.jpg', isActive: true },
      { name: 'Jeans', type: 'men', description: 'Denim jeans', image: '/images/cat2.jpg', isActive: true },
      { name: 'Shoes', type: 'men', description: 'Footwear', image: '/images/cat3.jpg', isActive: true },
      { name: 'Jackets', type: 'men', description: 'Outerwear', image: '/images/cat4.jpg', isActive: true },
      { name: 'Accessories', type: 'men', description: 'Men accessories', image: '/images/cat5.jpg', isActive: true },
      { name: 'Dresses', type: 'women', description: 'Women dresses', image: '/images/cat6.jpg', isActive: true },
      { name: 'Skirts', type: 'women', description: 'Women skirts', image: '/images/cat7.jpg', isActive: true },
      { name: 'Bags', type: 'women', description: 'Handbags', image: '/images/cat8.jpg', isActive: true },
      { name: 'Kids Wear', type: 'kids', description: 'Children clothing', image: '/images/cat9.jpg', isActive: true },
      { name: 'Toys', type: 'kids', description: 'Kids toys', image: '/images/cat10.jpg', isActive: true },
    ];
    const createdCategories = await Category.bulkCreate(categories);
    console.log('Categories seeded.');

    // Seed Products
    const products = [];
    for (let i = 1; i <= 10; i++) {
      products.push({
        name: `Product ${i}`,
        brand: `Brand ${i % 3 + 1}`,
        description: `Description for product ${i}`,
        price: (Math.random() * 100 + 10).toFixed(2),
        color: ['Red', 'Blue', 'Black', 'White'][i % 4],
        size: ['S', 'M', 'L', 'XL'][i % 4],
        material: 'Cotton',
        stock: Math.floor(Math.random() * 100) + 10,
        rating: (Math.random() * 5).toFixed(1),
        numReviews: Math.floor(Math.random() * 50),
        isFeatured: i % 2 === 0,
        isNew: i % 3 === 0,
        isTrending: i % 4 === 0,
        discount: Math.floor(Math.random() * 20),
        categoryId: createdCategories[i % createdCategories.length].id,
      });
    }
    const createdProducts = await Product.bulkCreate(products);
    console.log('Products seeded.');

    // Seed ProductImages
    const productImages = [];
    for (let i = 0; i < createdProducts.length; i++) {
      for (let j = 1; j <= 2; j++) { // 2 images per product
        productImages.push({
          url: `/images/product${i + 1}_${j}.jpg`,
          isPrimary: j === 1,
          order: j,
          productId: createdProducts[i].id,
        });
      }
    }
    await ProductImage.bulkCreate(productImages);
    console.log('ProductImages seeded.');

    // Seed Addresses
    const addresses = [];
    for (let i = 0; i < createdUsers.length; i++) {
      addresses.push({
        type: 'home',
        name: createdUsers[i].name,
        phone: createdUsers[i].phone,
        addressLine1: `Address Line 1 for ${createdUsers[i].name}`,
        addressLine2: `Address Line 2 for ${createdUsers[i].name}`,
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        isDefault: true,
        userId: createdUsers[i].id,
      });
    }
    const createdAddresses = await Address.bulkCreate(addresses);
    console.log('Addresses seeded.');

    // Seed Carts
    const carts = [];
    for (let i = 0; i < createdUsers.length; i++) {
      carts.push({
        quantity: Math.floor(Math.random() * 5) + 1,
        size: ['S', 'M', 'L'][i % 3],
        color: 'Black',
        userId: createdUsers[i].id,
        productId: createdProducts[i % createdProducts.length].id,
      });
    }
    await Cart.bulkCreate(carts);
    console.log('Carts seeded.');

    // Seed Wishlists
    const wishlists = [];
    for (let i = 0; i < createdUsers.length; i++) {
      wishlists.push({
        notes: `Notes for wishlist item ${i + 1}`,
        priority: ['low', 'medium', 'high'][i % 3],
        userId: createdUsers[i].id,
        productId: createdProducts[(i + 1) % createdProducts.length].id,
      });
    }
    await Wishlist.bulkCreate(wishlists);
    console.log('Wishlists seeded.');

    // Seed Coupons
    const coupons = [];
    for (let i = 1; i <= 10; i++) {
      coupons.push({
        code: `COUPON${i}`,
        description: `Discount coupon ${i}`,
        discountType: i % 2 === 0 ? 'percentage' : 'fixed',
        discountValue: i % 2 === 0 ? 10 : 50,
        minOrderValue: 500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        usageLimit: 100,
        isActive: true,
      });
    }
    const createdCoupons = await Coupon.bulkCreate(coupons);
    console.log('Coupons seeded.');

    // Seed Orders
    const orders = [];
    for (let i = 0; i < createdUsers.length; i++) {
      const totalAmount = (Math.random() * 200 + 100).toFixed(2);
      const discountAmount = (Math.random() * 50).toFixed(2);
      const finalAmount = (totalAmount - discountAmount).toFixed(2);
      orders.push({
        orderNumber: `ORD${Date.now()}${i}`,
        totalAmount,
        discountAmount,
        finalAmount,
        status: ['pending', 'confirmed', 'processing', 'shipped', 'delivered'][i % 5],
        paymentStatus: 'completed',
        paymentMethod: 'razorpay',
        shippingAddressSnapshot: { ...createdAddresses[i].toJSON() },
        billingAddressSnapshot: { ...createdAddresses[i].toJSON() },
        phone: createdUsers[i].phone,
        email: createdUsers[i].email,
        userId: createdUsers[i].id,
        shippingAddressId: createdAddresses[i].id,
        billingAddressId: createdAddresses[i].id,
        couponId: createdCoupons[i % createdCoupons.length].id,
      });
    }
    const createdOrders = await Order.bulkCreate(orders);
    console.log('Orders seeded.');

    // Seed OrderItems
    const orderItems = [];
    for (let i = 0; i < createdOrders.length; i++) {
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      for (let j = 0; j < numItems; j++) {
        const product = createdProducts[(i + j) % createdProducts.length];
        orderItems.push({
          quantity: Math.floor(Math.random() * 3) + 1,
          price: product.price,
          size: product.size,
          color: product.color,
          productName: product.name,
          productImage: `/images/product${(i + j) % createdProducts.length + 1}_1.jpg`,
          orderId: createdOrders[i].id,
          productId: product.id,
        });
      }
    }
    await OrderItem.bulkCreate(orderItems);
    console.log('OrderItems seeded.');

    // Seed Reviews
    const reviews = [];
    for (let i = 0; i < createdUsers.length; i++) {
      reviews.push({
        rating: Math.floor(Math.random() * 5) + 1,
        title: `Review Title ${i + 1}`,
        comment: `Review comment for product by ${createdUsers[i].name}`,
        isVerifiedPurchase: true,
        userId: createdUsers[i].id,
        productId: createdProducts[i % createdProducts.length].id,
        orderId: createdOrders[i % createdOrders.length].id,
      });
    }
    await Review.bulkCreate(reviews);
    console.log('Reviews seeded.');

    // Seed LandingConfig (only one)
    await LandingConfig.create({
      sections: [
        {
          key: 'hero',
          title: 'Hero Carousel',
          visible: true,
          order: 1,
          config: {
            slides: [
              { image: '/images/hero1.jpg', title: 'Define Your\nStreet Style', subtitle: 'New Collection 2026', cta: 'Shop Now', ctaLink: '/shop' },
            ],
          },
        },
      ],
    });
    console.log('LandingConfig seeded.');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();