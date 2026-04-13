'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, Clock, Truck, CheckCircle2, XCircle, FileText, Calendar, CalendarCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { orderAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400', label: 'Pending' },
  processing: { icon: Package, color: 'text-blue-400', label: 'Processing' },
  confirmed: { icon: Package, color: 'text-blue-400', label: 'Confirmed' },
  shipped: { icon: Truck, color: 'text-purple-400', label: 'Shipped' },
  delivered: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-400', label: 'Cancelled' },
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { token } = useAuthStore();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    async function fetch() {
      try {
        const { data } = await orderAPI.getById(id as string);
        setOrder(data.data);
      } catch { toast.error('Order not found'); }
      setLoading(false);
    }
    fetch();
  }, [id, token, router]);

  const handleCancel = async () => {
    try {
      await orderAPI.cancel(id as string, 'Customer request');
      toast.success('Order cancelled');
      const { data } = await orderAPI.getById(id as string);
      setOrder(data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    }
  };

  const formatDeliveryDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-IN', options);
  };

  const getDeliveryStatus = (deliveryDate: string) => {
    if (!deliveryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delDate = new Date(deliveryDate);
    delDate.setHours(0, 0, 0, 0);
    
    if (delDate < today) {
      return { text: 'Delayed', color: 'text-red-400', icon: AlertCircle, bg: 'bg-red-500/10' };
    }
    if (delDate.getTime() === today.getTime()) {
      return { text: 'Today', color: 'text-yellow-400', icon: Calendar, bg: 'bg-yellow-500/10' };
    }
    return { text: 'On Time', color: 'text-emerald-400', icon: CalendarCheck, bg: 'bg-emerald-500/10' };
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-white/50">Order not found</div>;

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const items = order.orderItems || [];
  const addr = order.shippingAddress;
  const deliveryStatus = getDeliveryStatus(order.deliveryDate);
  const DeliveryIcon = deliveryStatus?.icon || Calendar;

  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/orders" className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" /> My Orders
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Order #{order.orderNumber || order.id}</h1>
              <p className="text-sm text-white/30 mt-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
            </div>
          </div>

          {/* Delivery Date Card */}
          {order.deliveryDate && (
            <div className={`p-5 rounded-2xl ${deliveryStatus?.bg || 'glass-strong'} mb-6 border ${deliveryStatus?.color.replace('text', 'border') || 'border-white/10'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${deliveryStatus?.bg || 'bg-accent/10'} flex items-center justify-center`}>
                  <DeliveryIcon className={`w-5 h-5 ${deliveryStatus?.color || 'text-accent'}`} />
                </div>
                <div>
                  <p className="text-xs text-white/40">Expected Delivery Date</p>
                  <p className="text-base font-semibold text-white">
                    {formatDeliveryDate(order.deliveryDate)}
                  </p>
                  {deliveryStatus && (
                    <p className={`text-xs ${deliveryStatus.color} mt-0.5`}>
                      {deliveryStatus.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="p-6 rounded-2xl glass-strong mb-6">
            <h2 className="text-base font-bold text-white mb-4">Items</h2>
            <div className="space-y-4">
              {items.map((item: any) => {
                const product = item.Product || {};
                const img = product.images?.find((im: any) => im.isPrimary) || product.images?.[0];
                const imgSrc = img?.url || img?.imageUrl || '/images/hero2.jpg';
                return (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-20 rounded-xl overflow-hidden relative shrink-0">
                      <Image src={imgSrc} alt={product.name || ''} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{product.name || item.productName}</p>
                      <p className="text-[10px] text-white/30">{item.size} / {item.color} × {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            {addr && (
              <div className="p-6 rounded-2xl glass-strong">
                <h2 className="text-base font-bold text-white mb-3">Shipping Address</h2>
                <p className="text-sm text-white/60">{addr.name || addr.fullName}</p>
                <p className="text-sm text-white/50">{addr.street || addr.addressLine1}</p>
                <p className="text-sm text-white/50">{addr.city}, {addr.state} - {addr.pincode || addr.zipCode}</p>
                <p className="text-xs text-white/30 mt-1">Phone: {addr.phone}</p>
              </div>
            )}

            {/* Summary */}
            <div className="p-6 rounded-2xl glass-strong">
              <h2 className="text-base font-bold text-white mb-3">Payment Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Subtotal</span>
                  <span>₹{Number(order.totalAmount || 0).toLocaleString()}</span>
                </div>
                {Number(order.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-₹{Number(order.discountAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/50">
                  <span>Shipping</span>
                  <span>{Number(order.shippingCost || 0) === 0 ? <span className="text-emerald-400">Free</span> : `₹${Number(order.shippingCost || 0)}`}</span>
                </div>
                <div className="pt-2 border-t border-white/5 flex justify-between text-white font-bold">
                  <span>Total</span>
                  <span>₹{Number(order.finalAmount || order.totalAmount || 0).toLocaleString()}</span>
                </div>
                <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Method: {order.paymentMethod?.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions - Added Track Order Button */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/track?order=${order.id}`}
              className="px-5 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent hover:text-white transition-all flex items-center gap-2"
            >
              <Truck className="w-4 h-4" /> Track Order
            </Link>
            {['pending', 'processing', 'confirmed'].includes(order.status) && (
              <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl glass text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                Cancel Order
              </button>
            )}
            <button 
              onClick={() => {
                toast.success('Invoice downloading...');
              }} 
              className="px-5 py-2.5 rounded-xl glass text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Invoice
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}