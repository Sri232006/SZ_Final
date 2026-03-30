'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Clock, Truck, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
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
  returned: { icon: XCircle, color: 'text-orange-400', label: 'Returned' },
};

export default function OrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    async function fetchOrders() {
      try {
        const { data } = await orderAPI.getAll();
        const payload = data.data;
        setOrders(payload?.orders || (Array.isArray(payload) ? payload : []));
      } catch { /* ignore */ }
      setLoading(false);
    }
    fetchOrders();
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6">
        <Package className="w-16 h-16 text-white/10" />
        <h2 className="text-2xl font-bold text-white/50">Please login to view orders</h2>
        <Link href="/auth/login" className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold">Login <ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold gradient-text">My Orders</h1>
          <p className="mt-2 text-sm text-white/40">{orders.length} orders</p>
        </motion.div>
        {orders.length === 0 ? (
          <div className="mt-16 text-center">
            <Package className="w-16 h-16 text-white/10 mx-auto" />
            <p className="mt-4 text-white/40">No orders yet</p>
            <Link href="/shop" className="inline-flex items-center gap-2 mt-4 text-accent text-sm hover:underline">Shop Now <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order, i) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const itemCount = order.orderItems?.length || 0;
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Link href={`/orders/${order.id}`} className="block p-5 rounded-2xl glass glass-hover group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">#{order.orderNumber || order.id}</h3>
                        <p className="mt-1 text-xs text-white/30">{new Date(order.createdAt).toLocaleDateString()} · {itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 mt-1 sm:pt-0 sm:mt-0 border-t border-white/5 sm:border-0">
                        <span className="text-base sm:text-sm font-bold text-white">₹{(order.finalAmount || order.totalAmount)?.toLocaleString()}</span>
                        <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
