'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { wishlistAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function WishlistPage() {
  const { items, isLoading, fetchWishlist, removeItem } = useWishlistStore();
  const { fetchCart } = useCartStore();
  const { token } = useAuthStore();
  const [movingToCart, setMovingToCart] = useState<string | null>(null);

  useEffect(() => {
    if (token) fetchWishlist();
  }, [token, fetchWishlist]);

  const handleMoveToCart = async (itemId: string) => {
    setMovingToCart(itemId);
    try {
      await wishlistAPI.moveToCart(itemId);
      await fetchWishlist();
      await fetchCart();
      toast.success('Moved to cart!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to move to cart');
    } finally {
      setMovingToCart(null);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeItem(id);
      toast.success('Removed from wishlist');
    } catch { toast.error('Failed to remove'); }
  };

  if (!token) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6">
        <Heart className="w-16 h-16 text-white/10" />
        <h2 className="text-2xl font-bold text-white/50">Please login to view your wishlist</h2>
        <Link href="/auth/login" className="px-6 py-3 rounded-full bg-accent text-white font-semibold glow-red-hover transition-all">Login</Link>
      </div>
    );
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6">
        <Heart className="w-16 h-16 text-white/10" />
        <h2 className="text-2xl font-bold text-white/50">Your wishlist is empty</h2>
        <Link href="/shop" className="px-6 py-3 rounded-full bg-accent text-white font-semibold glow-red-hover transition-all">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold gradient-text">Wishlist</h1>
          <p className="mt-2 text-sm text-white/40">{items.length} saved items</p>
        </motion.div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item: any, i: number) => {
            const product = item.product || item.Product || {};
            const img = product.images?.find((im: any) => im.isPrimary) || product.images?.[0];
            const imgSrc = img?.url || img?.imageUrl || '/images/hero2.jpg';
            const dp = product.discountPrice || product.salePrice;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="group rounded-2xl overflow-hidden glass glass-hover relative">
                <Link href={`/shop/${item.productId}`}>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image src={imgSrc} alt={product.name || ''} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-xs font-bold text-white/70 tracking-wider uppercase">Out of Stock</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-white/80 line-clamp-1">{product.name}</h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-sm font-bold text-white">₹{(dp || product.price)?.toLocaleString()}</span>
                    {dp && <span className="text-xs text-white/30 line-through">₹{product.price?.toLocaleString()}</span>}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    {[...Array(5)].map((_, j) => <Star key={j} className={`w-2.5 h-2.5 ${j < Math.floor(product.avgRating || 4) ? 'fill-accent text-accent' : 'text-white/10'}`} />)}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {(product.stock ?? 1) > 0 && (
                      <button onClick={() => handleMoveToCart(item.id.toString())} disabled={movingToCart === item.id.toString()}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent/10 text-accent text-xs font-semibold hover:bg-accent hover:text-white transition-all disabled:opacity-50">
                        <ShoppingBag className="w-3.5 h-3.5" /> {movingToCart === item.id.toString() ? '...' : 'Move to Cart'}
                      </button>
                    )}
                    <button onClick={() => handleRemove(item.id.toString())} className="p-2 rounded-lg glass text-white/30 hover:text-accent transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
