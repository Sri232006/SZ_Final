# SouthZone Frontend Documentation

This document outlines the complete structure of the SouthZone Next.js frontend application. It maps out each page, its purpose, and the corresponding backend API endpoints it interacts with.

## 📁 1. Core E-commerce Flow

### Home Page (`/`)
- **Purpose**: The main landing page showcasing featured collections, new arrivals, and the primary brand message.
- **Key Components**: `Hero`, `Featured Products`, `Categories`.
- **API Linked**: `GET /config/landing`, `GET /products/featured`.

### Shop Overview (`/shop`)
- **Purpose**: A comprehensive product catalog with filtering, sorting, and pagination.
- **Key Components**: `ProductCard`, `Filters`, `Pagination`.
- **API Linked**: `GET /products`, `GET /config/categories`.

### Product Detail (`/shop/[id]`)
- **Purpose**: Deep dive into a specific product, showing images, sizes, stock, reviews, and a "Quick Add to Cart" action.
- **Key Components**: `ProductGallery`, `ReviewForm`, `AddToCartButton`.
- **API Linked**: `GET /products/:id`, `GET /products/:id/reviews`, `POST /products/:id/reviews`.

## 🛒 2. Cart & Checkout Flow

### Global Cart Drawer (`Slide-over UI`)
- **Purpose**: Accessible from anywhere via the Navbar. Allows users to view current cart items, adjust quantities, and proceed to checkout smoothly without losing their current page context.
- **API Linked**: Uses persistent Zustand state, initialized via `GET /cart`, synced via `POST /cart`, `PATCH /cart/:id`, `DELETE /cart/:id`.

### Cart Page (`/cart`)
- **Purpose**: Optional dedicated page for reviewing cart items before checkout.
- **API Linked**: `GET /cart`, `PATCH /cart/:id`, `DELETE /cart/:id`.

### Checkout (`/checkout`)
- **Purpose**: Finalizing the order. Allows users to select stored addresses, choose payment methods, and review their order totals.
- **API Linked**: `GET /addresses`, `POST /orders`.

### Checkout Success (`/checkout/success`)
- **Purpose**: A dedicated "Thank You" confirmation page displaying the order ID and next steps to track the package.
- **API Linked**: Clears the cart via Zustand global state; directs to `/orders/:id`.

## 🔐 3. Authentication & User Flow

### Login (`/auth/login`)
- **Purpose**: Allows users to sign in using their Email or Phone number.
- **API Linked**: `POST /auth/login`.

### Register (`/auth/register`)
- **Purpose**: New user onboarding. Enforces input of Full Name, Email, Phone Number, and Password.
- **API Linked**: `POST /auth/register`.

### Forgot Password (`/auth/forgot-password`)
- **Purpose**: Initiates the password recovery protocol by sending a reset link to the user's email.
- **API Linked**: `POST /auth/forgot-password`.

### Reset Password (`/auth/reset-password/[token]`)
- **Purpose**: The destination page from the email reset link, allowing the user to securely set a new password.
- **API Linked**: `POST /auth/reset-password/:token`.

### User Profile (`/profile`)
- **Purpose**: A private dashboard to manage personal information, saved addresses, and view order history.
- **API Linked**: `GET /users/profile`, `PATCH /users/profile`, `GET /addresses`, `GET /orders`.

## 📝 4. missing Industry-Standard & Legal Pages

### Track Order (`/track`)
- **Purpose**: An interactive standalone page allowing users to enter an Order ID and see an animated delivery progress pipeline without needing to log in.
- **API Linked**: `GET /orders/:id/track`.

### About Us (`/about`)
- **Purpose**: Immersive brand story and ethos of SouthZone.
- **Type**: Static/Informational.

### Contact Us (`/contact`)
- **Purpose**: Provides customer support details, headquarters location, and a direct inquiry form.
- **Type**: Static/Informational.

### FAQ (`/faq`)
- **Purpose**: An accordion-style collapsible list answering common shipping, sizing, and return queries.
- **Type**: Static/Informational.

### Return Policy (`/returns`)
- **Purpose**: Outlines the standard 7-day hassle-free return policy terms.
- **Type**: Static/Legal.

### Privacy Policy (`/privacy`)
- **Purpose**: Details data collection and security handling policies.
- **Type**: Static/Legal.

### Terms of Service (`/terms`)
- **Purpose**: User agreements for purchasing physical merchandise on the platform.
- **Type**: Static/Legal.

---

**Global Architecture Note:**
All persistent items like user sessions, shopping cart counts, and wishlists are securely managed by **Zustand `persist` middleware**, wrapped inside a dedicated `<ClientInitializer />` component at the root `layout.tsx`. This guarantees seamless data persistence across reloads and drastically reduces flashing UI boundaries.
