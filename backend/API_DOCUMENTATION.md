# SouthZone API Documentation

This document outlines the complete REST API for the SouthZone e-commerce backend. It is designed for testing via Postman or any other API client.

**Base URL:** `http://localhost:5000/api`

---

## Headers & Authentication
Most protected routes require a JWT token in the Authorization header. Admin routes require a JWT belonging to a user with the `admin` role.
- **Header:** `Authorization: Bearer <your_jwt_token>`
- **Content-Type:** `application/json` (unless specified otherwise, e.g., `multipart/form-data` for file uploads)

---

## 🔐 Auth Endpoints

### 1. Register User
- **Method:** `POST`
- **Path:** `/auth/register`
- **Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "strongpassword123",
  "phone": "9876543210"
}
```

### 2. Login
- **Method:** `POST`
- **Path:** `/auth/login`
- **Body:**
```json
{
  "email": "jane@example.com",
  "password": "strongpassword123"
}
```

### 3. Forgot Password
- **Method:** `POST`
- **Path:** `/auth/forgot-password`
- **Body:**
```json
{
  "email": "jane@example.com"
}
```

### 4. Reset Password
- **Method:** `POST`
- **Path:** `/auth/reset-password/:token`
- **Body:**
```json
{
  "password": "newpassword123",
  "passwordConfirm": "newpassword123"
}
```

### 5. Update Password (Protected)
- **Method:** `POST`
- **Path:** `/auth/update-password`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "currentPassword": "oldpassword123",
  "password": "newpassword123",
  "passwordConfirm": "newpassword123"
}
```

---

## 🛍️ Product Endpoints

### 1. Get All Products
- **Method:** `GET`
- **Path:** `/products`
- **Query Params (Optional):** `?page=1&limit=10&category=1&sort=price_asc`

### 2. Get Single Product
- **Method:** `GET`
- **Path:** `/products/:id`

### 3. Get Featured Products
- **Method:** `GET`
- **Path:** `/products/featured`

### 4. Get New Arrivals
- **Method:** `GET`
- **Path:** `/products/new-arrivals`

### 5. Get Trending Products
- **Method:** `GET`
- **Path:** `/products/trending`

### 6. Search Products
- **Method:** `GET`
- **Path:** `/products/search?q=search_term`

### 7. Get Products by Category
- **Method:** `GET`
- **Path:** `/products/category/:categoryId`

### 8. Get Product Reviews
- **Method:** `GET`
- **Path:** `/products/:id/reviews`

### 9. Add Product Review (Protected)
- **Method:** `POST`
- **Path:** `/products/:id/reviews`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "rating": 5,
  "comment": "Amazing quality!"
}
```

### 10. Admin: Update Stock (Protected)
- **Method:** `PATCH`
- **Path:** `/products/:id/stock`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Body:**
```json
{
  "stock": 50
}
```

### 11. Admin: Delete Product Image (Protected)
- **Method:** `DELETE`
- **Path:** `/products/:productId/images/:imageId`
- **Headers:** `Authorization: Bearer <admin_token>`

### 12. Admin: Set Primary Product Image (Protected)
- **Method:** `PATCH`
- **Path:** `/products/:productId/images/:imageId/primary`
- **Headers:** `Authorization: Bearer <admin_token>`

---

## 🛒 Cart Endpoints (Protected)

### 1. Get Cart
- **Method:** `GET`
- **Path:** `/cart`
- **Headers:** `Authorization: Bearer <token>`

### 2. Add Item to Cart
- **Method:** `POST`
- **Path:** `/cart`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "productId": "1",
  "quantity": 2,
  "size": "L",
  "color": "Black"
}
```

### 3. Update Cart Item Quantity
- **Method:** `PATCH`
- **Path:** `/cart/:itemId`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "quantity": 3
}
```

### 4. Remove Item from Cart
- **Method:** `DELETE`
- **Path:** `/cart/:itemId`
- **Headers:** `Authorization: Bearer <token>`

### 5. Clear Cart
- **Method:** `DELETE`
- **Path:** `/cart`
- **Headers:** `Authorization: Bearer <token>`

---

## 📦 Order Endpoints (Protected)

### 1. Create Order
- **Method:** `POST`
- **Path:** `/orders`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "shippingAddressId": 1,
  "paymentMethod": "razorpay" 
}
```

### 2. Get All My Orders
- **Method:** `GET`
- **Path:** `/orders`
- **Headers:** `Authorization: Bearer <token>`

### 3. Get Substantial Order by ID
- **Method:** `GET`
- **Path:** `/orders/:id`
- **Headers:** `Authorization: Bearer <token>`

### 4. Cancel Order
- **Method:** `POST`
- **Path:** `/orders/:id/cancel`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "reason": "Changed my mind"
}
```

### 5. Track Order
- **Method:** `GET`
- **Path:** `/orders/:id/track`
- **Headers:** `Authorization: Bearer <token>`

### 6. Return Order
- **Method:** `POST`
- **Path:** `/orders/:id/return`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "reason": "Item defect",
  "comments": "Stitching unraveled"
}
```

### 7. Reorder
- **Method:** `POST`
- **Path:** `/orders/:id/reorder`
- **Headers:** `Authorization: Bearer <token>`

### 8. Get Order Invoice PDF
- **Method:** `GET`
- **Path:** `/orders/:id/invoice`
- **Headers:** `Authorization: Bearer <token>`

### 9. Verify Razorpay Payment
- **Method:** `POST`
- **Path:** `/orders/verify-payment`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "razorpay_order_id": "...",
  "razorpay_payment_id": "...",
  "razorpay_signature": "..."
}
```

---

## 👤 User Profile & Addresses (Protected)

### 1. Get Profile
- **Method:** `GET`
- **Path:** `/users/profile`
- **Headers:** `Authorization: Bearer <token>`

### 2. Update Profile
- **Method:** `PATCH`
- **Path:** `/users/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "name": "Jane Smith",
  "phone": "9876543210"
}
```

### 3. Delete Profile Picture
- **Method:** `DELETE`
- **Path:** `/users/profile/picture`
- **Headers:** `Authorization: Bearer <token>`

### 4. Change Password (via Profile)
- **Method:** `POST`
- **Path:** `/users/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "oldPassword": "...",
  "newPassword": "..."
}
```

### 5. Deactivate Account
- **Method:** `POST`
- **Path:** `/users/deactivate`
- **Headers:** `Authorization: Bearer <token>`

### 6. Get My Orders (alias)
- **Method:** `GET`
- **Path:** `/users/orders`

### 7. Get My Wishlist (alias)
- **Method:** `GET`
- **Path:** `/users/wishlist`

### 8. Get My Reviews
- **Method:** `GET`
- **Path:** `/users/reviews`

### 9. Get User Summary Stats
- **Method:** `GET`
- **Path:** `/users/stats`

### 10. Addresses Management
- **GET All Addresses:** `GET /addresses`
- **Create Address:** `POST /addresses`
- **Update Address:** `PUT /addresses/:id`
- **Delete Address:** `DELETE /addresses/:id`
- **Set Default:** `PATCH /addresses/:id/default`

---

## ❤️ Wishlist Endpoints (Protected)

### 1. Get Wishlist
- **Method:** `GET`
- **Path:** `/wishlist`
- **Headers:** `Authorization: Bearer <token>`

### 2. Get Wishlist Count
- **Method:** `GET`
- **Path:** `/wishlist/count`
- **Headers:** `Authorization: Bearer <token>`

### 3. Clear Wishlist
- **Method:** `DELETE`
- **Path:** `/wishlist/clear`
- **Headers:** `Authorization: Bearer <token>`

### 4. Check Price Drops
- **Method:** `GET`
- **Path:** `/wishlist/price-drops`
- **Headers:** `Authorization: Bearer <token>`

### 5. Add to Wishlist
- **Method:** `POST`
- **Path:** `/wishlist/product/:productId`
- **Headers:** `Authorization: Bearer <token>`

### 6. Check if Product is in Wishlist (Status)
- **Method:** `GET`
- **Path:** `/wishlist/product/:productId/status`
- **Headers:** `Authorization: Bearer <token>`

### 7. Update Wishlist Item Note/Variant
- **Method:** `PATCH`
- **Path:** `/wishlist/item/:id`
- **Headers:** `Authorization: Bearer <token>`

### 8. Remove from Wishlist
- **Method:** `DELETE`
- **Path:** `/wishlist/item/:id`
- **Headers:** `Authorization: Bearer <token>`

### 9. Move Wishlist Item to Cart
- **Method:** `POST`
- **Path:** `/wishlist/item/:id/move-to-cart`
- **Headers:** `Authorization: Bearer <token>`

### 10. Share Wishlist
- **Method:** `POST`
- **Path:** `/wishlist/share/:id`
- **Headers:** `Authorization: Bearer <token>`

---

## 🎟️ Coupons

### 1. Validations
- **Get All Coupons (Admin):** `GET /coupons`
- **Validate Coupon:** `GET /coupons/validate/:code`
- **Create Coupon (Admin):** `POST /coupons`
- **Update Coupon (Admin):** `PATCH /coupons/:id`
- **Delete Coupon (Admin):** `DELETE /coupons/:id`

---

## 🛠️ Public Config Endpoints

### 1. Get Landing Page Config
- **Method:** `GET`
- **Path:** `/config/landing`

### 2. Get Layout Categories
- **Method:** `GET`
- **Path:** `/config/categories`

---

## 👑 Admin Endpoints (Requires Admin Role)
*All routes bellow require `Authorization: Bearer <admin_token>`*

### 1. Dashboard Stats
- **Method:** `GET`
- **Path:** `/admin/dashboard`

### 2. Manage Users
- **List System Users:** `GET /admin/users`
- **Get One User:** `GET /admin/users/:id`
- **Update User:** `PATCH /admin/users/:id`
- **Promote to Admin:** `POST /admin/users/:id/promote`
- **Deactivate User:** `POST /admin/users/:id/deactivate`

### 3. Manage Landing Config
- **Get Landing Config:** `GET /admin/landing-config`
- **Update Landing Config:** `PUT /admin/landing-config`
*Body:*
```json
{
  "sections": [
    { "key": "hero", "order": 1, "visible": true, "title": "...", "subtitle": "..." }
  ]
}
```

### 4. Manage Orders
- **Get All Orders:** `GET /admin/orders`
- **Update Order Status:** `PATCH /admin/orders/:id/status`
*Body:*
```json
{
  "status": "shipped" // pending, processing, confirmed, shipped, delivered, cancelled
}
```

### 5. Manage Products
- **Create Product:** `POST /products` *(Uses multipart/form-data for image uploads)*
- **Update Product:** `PATCH /products/:id` *(multipart/form-data)*
- **Delete Product:** `DELETE /products/:id`

### 6. Manage Categories
- **Get All Categories:** `GET /admin/categories`
- **Create Category:** `POST /admin/categories`
*Body:* `{"name": "Jackets"}`
- **Update Category:** `PATCH /admin/categories/:id`
- **Delete Category:** `DELETE /admin/categories/:id`

---

## 📱 WhatsApp Endpoints (WIP)

### 1. Send OTP
- **Method:** `POST`
- **Path:** `/whatsapp/send-otp`
- **Body:** `{"phone": "9876543210", "purpose": "login"}`

### 2. Verify OTP
- **Method:** `POST`
- **Path:** `/whatsapp/verify-otp`
- **Body:** `{"phone": "9876543210", "otp": "123456", "purpose": "login"}`

### 3. Get WhatsApp Status
- **Method:** `GET`
- **Path:** `/whatsapp/status`
- **Headers:** `Authorization: Bearer <token>`
