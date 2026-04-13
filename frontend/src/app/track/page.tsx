'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ArrowRight, Search, Truck, CheckCircle2, Clock, Info, ShoppingBag, CreditCard, IndianRupee, MapPin } from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { formatDeliveryDate } from '@/lib/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Order progress steps - icons unchanged
const statusSteps = [
  { key: 'pending', label: 'Ordered', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'processing', label: 'Out for Delivery', icon: Package },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const getStepIndex = (status: string) => {
  const statusMap: { [key: string]: number } = {
    'pending': 0,
    'confirmed': 0, // Treat confirmed as Ordered
    'processing': 2,
    'shipped': 1,
    'delivered': 3
  };
  return statusMap[status?.toLowerCase()] ?? 0;
};

const TrackOrderPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderParam = searchParams.get('order');

  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackData, setTrackData] = useState<any>(null);

  const fetchOrderDetails = async (id: string) => {
    setLoading(true);
    setError('');
    setTrackData(null);

    try {
      const { data } = await orderAPI.getById(id);
      console.log('TRACK ORDER API RESPONSE (getById):', data.data);
      console.log('Fields mapping check -> Subtotal:', data.data.totalAmount, 'Discount:', data.data.discountAmount, 'Final:', data.data.finalAmount);
      setTrackData(data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Order not found. Please check your tracking ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderParam) {
      setOrderId(orderParam);
      fetchOrderDetails(orderParam);
    }
  }, [orderParam]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    router.push(`/track?order=${orderId}`);
    await fetchOrderDetails(orderId);
  };

  const currentStepIndex = trackData ? getStepIndex(trackData.status) : 0;
  const progressPercentage = ((currentStepIndex) / (statusSteps.length - 1)) * 100;

  return (
    <div className="min-h-screen pt-24 lg:pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Track Your Order</h1>
          <p className="text-white/60">Track your order status and delivery details</p>
        </div>

        {!trackData && !loading && (
          <form onSubmit={handleTrack} className="relative max-w-xl mx-auto mb-16">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter your Order ID"
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-14 pr-32 text-white outline-none focus:border-accent/50 transition-all text-lg placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={loading || !orderId}
              className="absolute right-2 top-2 bottom-2 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold transition-all disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Track'}
            </button>
          </form>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 flex items-center justify-center gap-2 mb-8">
            <Info className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {trackData && (
          <div className="glass-strong rounded-3xl p-8 lg:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 relative z-10">
              <div>
                <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Order Status</p>
                <h2 className="text-2xl font-bold text-white">#{trackData.orderNumber || trackData.id}</h2>
                <p className="text-xs text-white/30 mt-1">Placed on {formatDate(trackData.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${trackData.status === 'delivered' ? 'bg-emerald-400' :
                    trackData.status === 'shipped' ? 'bg-purple-400' :
                      trackData.status === 'confirmed' ? 'bg-blue-400' :
                        trackData.status === 'processing' ? 'bg-orange-400' : 'bg-yellow-400'
                  } animate-pulse`} />
                <span className="text-sm font-medium text-white/80 capitalize">{trackData.status || 'Pending'}</span>
              </div>
            </div>

            {/* Order Progress Timeline - WITH PROGRESS BAR */}
            <div className="relative mb-8 z-10">
              <div className="absolute top-5 left-8 right-8 h-1 bg-white/5 rounded-full" />
              <div
                className="absolute top-5 left-8 h-1 bg-accent rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
              <div className="flex justify-between relative">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isActive = index === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-4 relative z-10 w-16">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-accent text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-surface border-2 border-white/10 text-white/20'
                        }`}>
                        <step.icon className={`w-4 h-4 ${isActive && 'animate-pulse'}`} />
                      </div>
                      <span className={`text-[10px] sm:text-xs font-medium text-center ${isCompleted ? 'text-white' : 'text-white/30'}`}>{step.label}</span>
                      {isActive && (
                        <span className="text-[8px] text-accent animate-pulse">Current</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Date */}
            {(trackData.deliveryDate || trackData.estimatedDelivery) && (
              <div className="mb-8 p-4 rounded-2xl bg-accent/5 border border-accent/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Estimated Delivery</p>
                    <p className="text-base font-semibold text-white">{formatDeliveryDate(trackData.deliveryDate || trackData.estimatedDelivery)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            {trackData.orderItems && trackData.orderItems.length > 0 && (
              <div className="pt-6 border-t border-white/10 mb-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-accent" />
                  Order Items ({trackData.orderItems.length})
                </h3>
                <div className="space-y-2">
                  {trackData.orderItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-white/70">{item.productName} x {item.quantity}</span>
                      <span className="text-white">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Details - Complete Amount */}
            <div className="pt-4 border-t border-white/10">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Subtotal</span>
                  <span className="text-white">₹{Number(trackData.totalAmount || 0).toLocaleString()}</span>
                </div>
                {Number(trackData.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span className="text-emerald-400">-₹{Number(trackData.discountAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/50">
                  <span>Shipping</span>
                  <span className="text-white/70">{Number(trackData.shippingCost || 0) === 0 ? <span className="text-emerald-400">Free</span> : `₹${Number(trackData.shippingCost || 0)}`}</span>
                </div>
                <div className="flex justify-between text-white font-semibold pt-2 border-t border-white/10">
                  <span>Grand Total</span>
                  <span className="text-lg font-bold text-accent">₹{Number(trackData.finalAmount || trackData.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-white/50 text-xs pt-2">
                  <span>Payment Method</span>
                  <span className="capitalize">{trackData.paymentMethod || 'Razorpay'}</span>
                </div>
                <div className="flex justify-between text-white/50 text-xs">
                  <span>Payment Status</span>
                  <span className={`capitalize ${trackData.paymentStatus === 'completed' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {trackData.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {trackData.shippingAddress && (
              <div className="pt-6 mt-6 border-t border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  Shipping Address
                </h3>
                <p className="text-sm text-white/60">
                  {trackData.shippingAddress.name}<br />
                  {trackData.shippingAddress.addressLine1}<br />
                  {trackData.shippingAddress.city}, {trackData.shippingAddress.state} - {trackData.shippingAddress.pincode}<br />
                  Phone: {trackData.shippingAddress.phone}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 z-10 relative mt-6">
              <div className="text-center sm:text-left">
                <p className="text-sm text-white/50 mb-1">Need help with this order?</p>
                <Link href="/contact" className="text-accent hover:underline text-sm font-medium">Contact Support</Link>
              </div>
              <Link href="/shop" className="flex items-center gap-2 px-6 py-3 rounded-xl glass hover:bg-white/5 text-white text-sm font-medium transition-colors">
                Continue Shopping <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;