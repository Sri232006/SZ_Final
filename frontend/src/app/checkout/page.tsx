'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, Truck, ShieldCheck, ChevronLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { addressAPI, orderAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function CheckoutPage() {
  const { items, total, fetchCart, clearCart } = useCartStore();
  const { token } = useAuthStore();
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    async function load() {
      try {
        await fetchCart();
        const { data } = await addressAPI.getAll();
        const addrs = data.data || [];
        setAddresses(addrs);
        const def = addrs.find((a: any) => a.isDefault);
        if (def) setSelectedAddress(def.id.toString());
        else if (addrs.length > 0) setSelectedAddress(addrs[0].id.toString());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [token, router, fetchCart]);

  const shipping = total > 999 ? 0 : 99;
  const grandTotal = total + shipping;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    setPlacing(true);
    try {
      const orderData: any = {
        shippingAddressId: parseInt(selectedAddress),
        paymentMethod,
      };
      const { data } = await orderAPI.create(orderData);
      // If Razorpay, could integrate payment here — for now redirect to orders
      await clearCart();
      toast.success('Order placed successfully!');
      router.push(`/checkout/success?order=${data.data?.id || ''}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/cart" className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors mb-8"><ChevronLeft className="w-4 h-4" /> Back to Cart</Link>
        </motion.div>
        <h1 className="text-3xl font-bold gradient-text mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl glass-strong">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Delivery Address</h2>
                <Link href="/profile" className="text-xs text-accent hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add New</Link>
              </div>
              {addresses.length === 0 ? (
                <p className="text-sm text-white/30">No addresses saved. <Link href="/profile" className="text-accent hover:underline">Add one</Link></p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr: any) => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${selectedAddress === addr.id.toString() ? 'bg-accent/10 border border-accent/30' : 'bg-white/5 border border-white/5 hover:border-white/10'}`}>
                      <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id.toString()} onChange={() => setSelectedAddress(addr.id.toString())}
                        className="mt-1 w-4 h-4 text-accent focus:ring-accent/20 bg-white/5 border-white/20" />
                      <div>
                        <p className="text-sm font-medium text-white">{addr.name || addr.fullName} {addr.isDefault && <span className="text-[10px] text-accent ml-2">Default</span>}</p>
                        <p className="text-xs text-white/50 mt-1">{addr.street || addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode || addr.zipCode}</p>
                        <p className="text-xs text-white/30 mt-0.5">Phone: {addr.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Payment */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl glass-strong">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4"><CreditCard className="w-4 h-4 text-accent" /> Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'razorpay', label: 'Pay Online', desc: 'UPI, Cards, Netbanking via Razorpay' },
                  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
                ].map((method) => (
                  <label key={method.id} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === method.id ? 'bg-accent/10 border border-accent/30' : 'bg-white/5 border border-white/5 hover:border-white/10'}`}>
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)}
                      className="w-4 h-4 text-accent focus:ring-accent/20 bg-white/5 border-white/20" />
                    <div><span className="text-sm font-medium text-white">{method.label}</span><p className="text-xs text-white/30">{method.desc}</p></div>
                  </label>
                ))}
              </div>
            </motion.div>

            {/* Items preview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl glass-strong">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4"><Truck className="w-4 h-4 text-accent" /> Order Items ({items.length})</h2>
              <div className="space-y-3">
                {items.map((item: any) => {
                  const img = item.Product?.images?.find((im: any) => im.isPrimary) || item.Product?.images?.[0];
                  const imgSrc = img?.url || img?.imageUrl || '/images/hero2.jpg';
                  return (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-lg overflow-hidden relative shrink-0"><Image src={imgSrc} alt={item.Product?.name || ''} fill className="object-cover" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{item.Product?.name}</p>
                        <p className="text-[10px] text-white/30">{item.size} / {item.color} × {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-white shrink-0">₹{((item.Product?.discountPrice || item.Product?.salePrice || item.Product?.price || 0) * item.quantity).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:sticky lg:top-28 h-fit">
            <div className="p-6 rounded-2xl glass-strong">
              <h2 className="text-lg font-bold text-white mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/50"><span>Subtotal</span><span>₹{total.toLocaleString()}</span></div>
                <div className="flex justify-between text-white/50"><span>Shipping</span><span>{shipping === 0 ? <span className="text-emerald-400">Free</span> : `₹${shipping}`}</span></div>
                <div className="pt-3 border-t border-white/5 flex justify-between text-white font-bold text-base"><span>Total</span><span>₹{grandTotal.toLocaleString()}</span></div>
              </div>
              <button onClick={handlePlaceOrder} disabled={placing}
                className="mt-6 w-full py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover disabled:opacity-50">
                {placing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Place Order'}
              </button>
              <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-white/20"><ShieldCheck className="w-3 h-3" /> Secure checkout</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
