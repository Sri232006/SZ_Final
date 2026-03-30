'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Clock, Truck, CheckCircle2, XCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

const statusOptions = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  processing: 'bg-blue-500/10 text-blue-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
  shipped: 'bg-purple-500/10 text-purple-400',
  delivered: 'bg-emerald-500/10 text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data } = await adminAPI.getOrders();
      const payload = data.data;
      setOrders(payload?.orders || (Array.isArray(payload) ? payload : []));
    } catch { /* ignore */ }
    setLoading(false);
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, { status: newStatus });
      setOrders(orders.map((o) => o.id.toString() === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order updated to ${newStatus}`);
    } catch { toast.error('Failed to update'); }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Orders</h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
        {['all', ...statusOptions].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all capitalize ${filter === s ? 'bg-accent text-white' : 'glass text-white/50 hover:text-white'}`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl glass-strong overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm whitespace-nowrap">
            <thead><tr className="text-white/30 border-b border-white/5">
              <th className="text-left p-4 font-medium">Order</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Customer</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Amount</th>
            </tr></thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white/70">#{order.orderNumber || order.id}</td>
                  <td className="p-4 text-white/50 hidden sm:table-cell">{order.user?.name || order.user?.email || '—'}</td>
                  <td className="p-4 text-white/40">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <select value={order.status} onChange={(e) => handleStatusChange(order.id.toString(), e.target.value)}
                      className={`appearance-none px-2 py-1 rounded-lg text-[10px] font-bold border-0 outline-none cursor-pointer ${statusColors[order.status] || 'text-white/50'} bg-transparent`}>
                      {statusOptions.map((s) => <option key={s} value={s} className="bg-surface text-white capitalize">{s}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right text-white font-medium">₹{(order.finalAmount || order.totalAmount)?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="p-8 text-center text-white/20"><ShoppingCart className="w-8 h-8 mx-auto mb-2" /><p>No orders found</p></div>}
        </div>
      )}
    </div>
  );
}
