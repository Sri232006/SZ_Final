'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ShoppingBag, Clock, Truck, CheckCircle2, XCircle, Package, Calendar, Save, CalendarCheck, AlertCircle } from 'lucide-react';
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

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

const mapStatusToLabel = (status: string) => {
  if (status === 'pending') return 'Ordered';
  if (status === 'confirmed') return 'Ordered (Confirmed)';
  if (status === 'processing') return 'Out for Delivery';
  return status;
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data } = await adminAPI.getOrders();
      const payload = data.data;
      const ordersList = payload?.orders || (Array.isArray(payload) ? payload : []);
      setOrders(ordersList);
      
      const initialDates: Record<string, string> = {};
      ordersList.forEach((order: any) => {
        const dDate = order.deliveryDate || order.estimatedDelivery;
        if (dDate) {
          initialDates[order.id] = dDate.split('T')[0];
        }
      });
      setDeliveryDates(initialDates);
    } catch { 
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, { status: newStatus });
      setOrders(orders.map((o) => o.id.toString() === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order updated to ${newStatus}`);
    } catch { toast.error('Failed to update'); }
  };

  const handleDeliveryDateChange = (orderId: string, date: string) => {
    setDeliveryDates(prev => ({ ...prev, [orderId]: date }));
  };

  const handleSaveDeliveryDate = async (orderId: string) => {
    const deliveryDate = deliveryDates[orderId];
    if (!deliveryDate) {
      toast.error('Please select a delivery date');
      return;
    }
    
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      await adminAPI.updateOrderDeliveryDate(orderId, { deliveryDate });
      setOrders(orders.map((o) => 
        o.id.toString() === orderId ? { ...o, estimatedDelivery: deliveryDate, deliveryDate } : o
      ));
      toast.success('Delivery date updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update delivery date');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-IN', options);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    return maxDate.toISOString().split('T')[0];
  };

  const getDeliveryStatus = (deliveryDate: string) => {
    if (!deliveryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delDate = new Date(deliveryDate);
    delDate.setHours(0, 0, 0, 0);
    
    if (delDate < today) return { text: 'Delayed', color: 'text-red-400', icon: AlertCircle };
    if (delDate.getTime() === today.getTime()) return { text: 'Today', color: 'text-yellow-400', icon: Calendar };
    return { text: 'Upcoming', color: 'text-emerald-400', icon: CalendarCheck };
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Orders</h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
        {['all', ...statusOptions].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all capitalize flex items-center gap-1.5 ${
              filter === s ? 'bg-accent text-white' : 'glass text-white/50 hover:text-white'
            }`}>
            {s !== 'all' && statusIcons[s] && (() => {
              const Icon = statusIcons[s];
              return <Icon className="w-3 h-3" />;
            })()}
            {s !== 'all' ? mapStatusToLabel(s) : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl glass-strong overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-white/30 border-b border-white/5">
                  <th className="text-left p-4 font-medium">Order</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">Customer</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Delivery Date</th>
                  <th className="text-right p-4 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const StatusIcon = statusIcons[order.status] || Package;
                  let dateToCheck = order.deliveryDate || order.estimatedDelivery;
                  if (!dateToCheck && order.createdAt) {
                    const fallbackDate = new Date(order.createdAt);
                    fallbackDate.setDate(fallbackDate.getDate() + 7);
                    dateToCheck = fallbackDate.toISOString();
                  }
                  
                  const deliveryStatus = getDeliveryStatus(dateToCheck);
                  const DeliveryIcon = deliveryStatus?.icon || Calendar;
                  
                  return (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white/70">#{order.orderNumber || order.id}</span>
                        </div>
                      </td>
                      <td className="p-4 text-white/50 hidden sm:table-cell">
                        {order.user?.name || order.user?.email || '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-white/30" />
                          <span className="text-white/40">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className="w-3.5 h-3.5" />
                          <select 
                            value={order.status} 
                            onChange={(e) => handleStatusChange(order.id.toString(), e.target.value)}
                            className={`appearance-none px-3 py-1.5 rounded-lg text-[14px] font-bold border-0 outline-none cursor-pointer ${statusColors[order.status] || 'text-white/50'} bg-transparent`}
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s} className="bg-surface text-white capitalize">{mapStatusToLabel(s)}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                              <input
                                type="date"
                                value={deliveryDates[order.id] || (dateToCheck ? dateToCheck.split('T')[0] : '')}
                                onChange={(e) => handleDeliveryDateChange(order.id.toString(), e.target.value)}
                                min={getMinDate()}
                                max={getMaxDate()}
                                className="w-36 px-7 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/20 outline-none focus:border-accent/50"
                                placeholder="Select date"
                              />
                            </div>
                            <button
                              onClick={() => handleSaveDeliveryDate(order.id.toString())}
                              disabled={updating[order.id]}
                              className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all disabled:opacity-50"
                              title="Save delivery date"
                            >
                              {updating[order.id] ? (
                                <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {dateToCheck && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <DeliveryIcon className={`w-3 h-3 ${deliveryStatus?.color || 'text-emerald-400'}`} />
                              <p className={`text-[14px] font-medium ${deliveryStatus?.color || 'text-emerald-400/70'}`}>
                                {formatDisplayDate(dateToCheck)}
                                {deliveryStatus && ` • ${deliveryStatus.text}`}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-white font-medium">
                          ₹{(order.finalAmount || order.totalAmount)?.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-white/20">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2" />
              <p>No orders found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}