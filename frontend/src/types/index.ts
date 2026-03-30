// ─── User ────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: { user: User };
}

// ─── Product ─────────────────────────────────────
export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: Category;
  categoryId: string;
  images: ProductImage[];
  sizes: string[];
  colors: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

// ─── Cart ────────────────────────────────────────
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

// ─── Order ───────────────────────────────────────
export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  size: string;
  color: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  orderItems: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddressSnapshot: Address;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

// ─── Address ─────────────────────────────────────
export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

// ─── Coupon ──────────────────────────────────────
export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
}

// ─── Wishlist ────────────────────────────────────
export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

// ─── Review ──────────────────────────────────────
export interface Review {
  id: string;
  userId: string;
  user: { name: string; avatar?: string };
  rating: number;
  comment: string;
  createdAt: string;
}

// ─── API Response ────────────────────────────────
export interface ApiResponse<T> {
  status: string;
  data: T;
  results?: number;
  totalPages?: number;
  currentPage?: number;
}
