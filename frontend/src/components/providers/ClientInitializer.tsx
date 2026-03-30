'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

export default function ClientInitializer({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { checkAuth, token } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
    
    // 1. Verify token is still valid and fetch latest profile
    checkAuth().then(() => {
      // 2. If valid token exists, aggressively sync Cart and Wishlist from backend
      // This prevents the "0 items on reload" bug
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        fetchCart();
        fetchWishlist();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on absolute mount

  // Prevent hydration mismatch by not rendering complicated children until mounted
  if (!mounted) {
    return <div className="contents opacity-0">{children}</div>;
  }

  return <>{children}</>;
}
