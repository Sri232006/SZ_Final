'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, ShoppingBag, IndianRupee, Clock, ShoppingCart, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await adminAPI.getDashboard();
        setStats(data.data);
      } catch { 
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const cards = [
    { label: 'Total Users', value: stats?.users?.total || 0, sub: `+${stats?.users?.newThisMonth || 0} this month`, icon: Users, gradient: 'from-blue-500/20' },
    { label: 'Products', value: stats?.products || 0, sub: 'Active listings', icon: Package, gradient: 'from-emerald-500/20' },
    { label: 'Orders', value: stats?.orders?.total || 0, sub: `${stats?.orders?.thisMonth || 0} this month`, icon: ShoppingBag, gradient: 'from-purple-500/20' },
    { label: 'Revenue', value: `₹${(stats?.revenue?.thisMonth || 0).toLocaleString()}`, sub: 'This month', icon: IndianRupee, gradient: 'from-orange-500/20' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
        <Activity className="w-6 h-6 text-accent" /> Dashboard Overview
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`p-5 rounded-2xl glass-strong bg-gradient-to-br ${card.gradient} to-transparent`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
                <p className="mt-2 text-[11px] font-medium text-white/40">{card.sub}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                <card.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" /> Recent Orders
        </h2>
        <div className="rounded-2xl glass-strong overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-white/30 border-b border-white/5">
              <th className="text-left p-4 font-medium">Order</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Customer</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Amount</th>
            </tr></thead>
            <tbody>
              {(stats?.recentOrders || []).map((order: any) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                        <ShoppingCart className="w-3.5 h-3.5 text-white/40" />
                      </div>
                      <span className="text-white font-medium">#{order.orderNumber || order.id}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white/50 hidden sm:table-cell">{order.user?.name || order.user?.email || '—'}</td>
                  <td className="p-4"><span className={`px-3 py-1.5 rounded-full text-[14px] font-bold capitalize ${
                    order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                    order.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                    order.status === 'shipped' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>{order.status}</span></td>
                  <td className="p-4 text-right text-white font-medium">₹{(order.finalAmount || order.totalAmount)?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!stats?.recentOrders || stats.recentOrders.length === 0) && <p className="p-4 text-center text-white/20 text-sm">No recent orders</p>}
        </div>
      </div>
    </div>
  );
}
