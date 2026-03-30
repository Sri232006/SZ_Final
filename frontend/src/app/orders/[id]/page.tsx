'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, Package, Clock, Truck, CheckCircle2, XCircle, FileText } from 'lucide-react';
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-white/50">Order not found</div>;

  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const items = order.orderItems || [];
  const addr = order.shippingAddress;

  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/orders" className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors mb-8"><ChevronLeft className="w-4 h-4" /> My Orders</Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Order #{order.orderNumber || order.id}</h1>
              <p className="text-sm text-white/30 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
            </div>
          </div>

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
                    <div className="w-16 h-20 rounded-xl overflow-hidden relative shrink-0"><Image src={imgSrc} alt={product.name || ''} fill className="object-cover" /></div>
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
              <h2 className="text-base font-bold text-white mb-3">Payment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/50"><span>Subtotal</span><span>₹{order.totalAmount?.toLocaleString()}</span></div>
                {order.discountAmount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-₹{order.discountAmount?.toLocaleString()}</span></div>}
                <div className="flex justify-between text-white/50"><span>Shipping</span><span>{order.shippingCost === 0 ? <span className="text-emerald-400">Free</span> : `₹${order.shippingCost}`}</span></div>
                <div className="pt-2 border-t border-white/5 flex justify-between text-white font-bold"><span>Total</span><span>₹{(order.finalAmount || order.totalAmount)?.toLocaleString()}</span></div>
                <p className="text-xs text-white/30 mt-2">Method: {order.paymentMethod?.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            {['pending', 'processing', 'confirmed'].includes(order.status) && (
              <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl glass text-sm text-red-400 hover:bg-red-400/10 transition-colors">Cancel Order</button>
            )}
            <button onClick={() => toast.success('Invoice downloaded')} className="px-5 py-2.5 rounded-xl glass text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"><FileText className="w-4 h-4" /> Invoice</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
