'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: cartItems, total: cartTotal, fetchCart, clearCart } = useCartStore();
  const { token } = useAuthStore();
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isDirectBuy, setIsDirectBuy] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    if (!token) { 
      router.push('/auth/login'); 
      return; 
    }
    
    async function load() {
      // FIRST: Check for direct buy item
      const storedItem = localStorage.getItem('directBuyItem');
      console.log('Stored item in checkout:', storedItem);
      
      if (storedItem) {
        // DIRECT BUY MODE
        const directItem = JSON.parse(storedItem);
        console.log('Direct buy mode - product:', directItem.productName);
        
        setIsDirectBuy(true);
        setCheckoutItems([{
          id: 'direct',
          productId: directItem.productId,
          quantity: directItem.quantity,
          size: directItem.size,
          color: directItem.color,
          Product: {
            name: directItem.productName,
            price: directItem.price,
            discountPrice: directItem.price,
            images: directItem.image ? [{ url: directItem.image }] : [{ url: '/images/hero1.jpg' }]
          }
        }]);
        setSubtotal(directItem.price * directItem.quantity);
        
        // Clear localStorage after reading
        localStorage.removeItem('directBuyItem');
        
        // Fetch addresses
        try {
          const { data } = await addressAPI.getAll();
          const addrs = data.data || [];
          setAddresses(addrs);
          const def = addrs.find((a: any) => a.isDefault);
          if (def) setSelectedAddress(def.id.toString());
          else if (addrs.length > 0) setSelectedAddress(addrs[0].id.toString());
        } catch (addrErr) {
          console.log('Address fetch failed');
        }
        
        setLoading(false);
        return;
      }
      
      // NORMAL CHECKOUT
      try {
        await fetchCart();
        setIsDirectBuy(false);
        setCheckoutItems(cartItems);
        setSubtotal(cartTotal);
        
        const { data } = await addressAPI.getAll();
        const addrs = data.data || [];
        setAddresses(addrs);
        const def = addrs.find((a: any) => a.isDefault);
        if (def) setSelectedAddress(def.id.toString());
        else if (addrs.length > 0) setSelectedAddress(addrs[0].id.toString());
        
      } catch (error) {
        console.error('Cart fetch error:', error);
        setCheckoutItems([]);
        setSubtotal(0);
      }
      setLoading(false);
    }
    
    load();
  }, [token, router, fetchCart, cartItems, cartTotal]);

  const shipping = subtotal > 999 ? 0 : 99;
  const grandTotal = subtotal + shipping;

  const handlePlaceOrder = async () => {
  console.log('Selected address:', selectedAddress); // Debug log
  
  if (!selectedAddress) { 
    toast.error('Please select a delivery address'); 
    return; 
  }
  
  setPlacing(true);
  try {
    const orderData: any = {
      shippingAddressId: selectedAddress,  // ← REMOVED parseInt - send as string
      paymentMethod: 'razorpay',
    };
    
    if (isDirectBuy && checkoutItems.length === 1) {
      orderData.directBuy = true;
      orderData.items = checkoutItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      }));
    }
    
    console.log('Order data being sent:', orderData); // Debug log
    
    const { data } = await orderAPI.create(orderData);
    
    if (!isDirectBuy) {
      await clearCart();
    }
    
    toast.success('Order placed successfully!');
    router.push(`/checkout/success?order=${data.data?.order?.id || data.data?.id || ''}`);
  } catch (err: any) {
    console.error('Order error:', err.response?.data);
    toast.error(err.response?.data?.message || 'Failed to place order');
  } finally {
    setPlacing(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href={isDirectBuy ? "/shop" : "/cart"} className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors mb-8">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
        </motion.div>
        
        <h1 className="text-3xl font-bold gradient-text mb-8">
          Checkout {isDirectBuy && <span className="text-lg text-white/30">(Direct Buy)</span>}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl glass-strong">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" /> Delivery Address
                </h2>
                <Link href="/profile" className="text-xs text-accent hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add New
                </Link>
              </div>
              
              {addresses.length === 0 ? (
                <p className="text-sm text-white/30">No addresses saved. <Link href="/profile" className="text-accent hover:underline">Add one</Link></p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr: any) => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                      selectedAddress === addr.id.toString() 
                        ? 'bg-accent/10 border border-accent/30' 
                        : 'bg-white/5 border border-white/5 hover:border-white/10'
                    }`}>
                      <input 
                        type="radio" 
                        name="address" 
                        value={addr.id} 
                        checked={selectedAddress === addr.id.toString()} 
                        onChange={() => setSelectedAddress(addr.id.toString())}
                        className="mt-1 w-4 h-4 text-accent focus:ring-accent/20 bg-white/5 border-white/20" 
                      />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {addr.name || addr.fullName} 
                          {addr.isDefault && <span className="text-[10px] text-accent ml-2">Default</span>}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {addr.street || addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode || addr.zipCode}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">Phone: {addr.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Payment */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl glass-strong">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-accent" /> Payment Method
              </h2>
              <div className="p-4 rounded-xl bg-accent/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-accent" />
                  <div>
                    <span className="text-sm font-medium text-white">Online Payment</span>
                    <p className="text-xs text-white/30">Pay securely via UPI, Cards, Netbanking</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Items */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl glass-strong">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4 text-accent" /> Order Items ({checkoutItems.length})
              </h2>
              <div className="space-y-3">
                {checkoutItems.map((item: any) => {
                  const img = item.Product?.images?.[0]?.url || '/images/hero2.jpg';
                  const price = item.Product?.discountPrice || item.Product?.price || 0;
                  return (
                    <div key={item.id || 'direct'} className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-lg overflow-hidden relative shrink-0">
                        <Image src={img} alt={item.Product?.name || ''} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{item.Product?.name}</p>
                        <p className="text-[10px] text-white/30">{item.size} / {item.color} × {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-white shrink-0">
                        ₹{(price * item.quantity).toLocaleString()}
                      </span>
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
                <div className="flex justify-between text-white/50">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-emerald-400">Free</span> : `₹${shipping}`}</span>
                </div>
                <div className="pt-3 border-t border-white/5 flex justify-between text-white font-bold text-base">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
              
              <button 
                onClick={handlePlaceOrder} 
                disabled={placing}
                className="mt-6 w-full py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover disabled:opacity-50"
              >
                {placing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Place Order'}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-white/20">
                <ShieldCheck className="w-3 h-3" /> Secure checkout
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}