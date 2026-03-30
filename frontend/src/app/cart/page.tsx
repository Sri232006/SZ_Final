'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Minus, Plus, X, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { couponAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function CartPage() {
  const { items, total, isLoading, fetchCart, updateQuantity, removeItem } = useCartStore();
  const { token } = useAuthStore();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');

  useEffect(() => {
    if (token) fetchCart();
  }, [token, fetchCart]);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const { data } = await couponAPI.validate(coupon);
      const coup = data.data;
      const discountAmt = coup.discountType === 'percentage'
        ? Math.min(total * coup.discountValue / 100, coup.maxDiscount || Infinity)
        : coup.discountValue;
      setDiscount(discountAmt);
      setCouponApplied(coupon);
      toast.success(`Coupon applied! ₹${discountAmt.toLocaleString()} off`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeItem(id);
      toast.success('Item removed');
    } catch { toast.error('Failed to remove'); }
  };

  const handleUpdateQty = async (id: string, qty: number) => {
    try {
      await updateQuantity(id, qty);
    } catch { toast.error('Failed to update'); }
  };

  if (!token) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6">
        <ShoppingBag className="w-16 h-16 text-white/10" />
        <h2 className="text-2xl font-bold text-white/50">Please login to view your cart</h2>
        <Link href="/auth/login" className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold glow-red-hover transition-all">Login <ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6">
        <ShoppingBag className="w-16 h-16 text-white/10" />
        <h2 className="text-2xl font-bold text-white/50">Your cart is empty</h2>
        <Link href="/shop" className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold glow-red-hover transition-all">Continue Shopping <ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }

  const shipping = total > 999 ? 0 : 99;
  const grandTotal = total - discount + shipping;

  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold gradient-text mb-8">
          Shopping Cart <span className="text-lg text-white/30 font-normal">({items.length} items)</span>
        </motion.h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any, i: number) => {
              const img = item.Product?.images?.find((im: any) => im.isPrimary) || item.Product?.images?.[0];
              const imgSrc = img?.url || img?.imageUrl || '/images/hero2.jpg';
              const price = item.Product?.discountPrice || item.Product?.salePrice || item.Product?.price || 0;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4 p-4 rounded-2xl glass">
                  <div className="relative w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden shrink-0">
                    <Image src={imgSrc} alt={item.Product?.name || ''} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/shop/${item.productId}`} className="text-sm font-medium text-white hover:text-accent transition-colors line-clamp-2">{item.Product?.name}</Link>
                        <button onClick={() => handleRemove(item.id.toString())} className="p-1 text-white/20 hover:text-white/60 transition-colors shrink-0"><X className="w-4 h-4" /></button>
                      </div>
                      <p className="mt-1 text-xs text-white/30">{item.size} / {item.color}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center glass rounded-lg">
                        <button onClick={() => handleUpdateQty(item.id.toString(), Math.max(1, item.quantity - 1))} className="p-2 text-white/50 hover:text-white"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.id.toString(), item.quantity + 1)} className="p-2 text-white/50 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <span className="text-sm font-bold text-white">₹{(price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-28 h-fit">
            <div className="p-6 rounded-2xl glass-strong">
              <h2 className="text-lg font-bold text-white mb-6">Order Summary</h2>
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code"
                    className="w-full py-2.5 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                </div>
                <button onClick={handleApplyCoupon} className="px-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors">Apply</button>
              </div>
              {couponApplied && <p className="text-xs text-emerald-400 mb-4">Coupon &quot;{couponApplied}&quot; applied ✓</p>}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/50"><span>Subtotal</span><span>₹{total.toLocaleString()}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-₹{discount.toLocaleString()}</span></div>}
                <div className="flex justify-between text-white/50"><span>Shipping</span><span>{shipping === 0 ? <span className="text-emerald-400">Free</span> : `₹${shipping}`}</span></div>
                <div className="pt-3 border-t border-white/5 flex justify-between text-white font-bold text-base"><span>Total</span><span>₹{grandTotal.toLocaleString()}</span></div>
              </div>
              <Link href="/checkout" className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
