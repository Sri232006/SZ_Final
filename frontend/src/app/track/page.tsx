'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ArrowRight, Search, Truck, CheckCircle2, Clock, Info } from 'lucide-react';
import { orderAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackData, setTrackData] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    setLoading(true);
    setError('');
    setTrackData(null);

    try {
      // In a real app, track API might be public or require email auth
      // For this demo, assuming getById via auth or a special track endpoint exists
      const { data } = await orderAPI.track(orderId);
      setTrackData(data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Order not found. Please check your tracking ID.');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: string) => {
    return statusSteps.findIndex(s => s.key === status?.toLowerCase());
  };

  return (
    <div className="min-h-screen pt-24 lg:pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Track Your Order</h1>
          <p className="text-white/60">Enter your Order ID below to get real-time tracking updates.</p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onSubmit={handleTrack} className="relative max-w-xl mx-auto mb-16"
        >
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. 19 or SZ-8X912"
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-14 pr-32 text-white outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all text-lg placeholder:text-white/20"
          />
          <button
            type="submit"
            disabled={loading || !orderId}
            className="absolute right-2 top-2 bottom-2 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold transition-all disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Track'}
          </button>
        </motion.form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 flex items-center justify-center gap-2 mb-8">
              <Info className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {trackData && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-3xl p-8 lg:p-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12 relative z-10">
                <div>
                  <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Order Status</p>
                  <h2 className="text-2xl font-bold text-white">#{trackData.id}</h2>
                </div>
                {trackData.trackingNumber && (
                  <div className="text-right">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Courier Tracking</p>
                    <p className="text-accent font-mono bg-accent/10 py-1 px-3 rounded-lg border border-accent/20">{trackData.trackingNumber}</p>
                  </div>
                )}
              </div>

              {/* Progress Timeline */}
              <div className="relative mb-12 z-10">
                <div className="absolute top-5 left-8 right-8 h-1 bg-white/5 rounded-full" />
                <div 
                  className="absolute top-5 left-8 h-1 bg-accent rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.max(0, getStepIndex(trackData.status)) * 25}%` }} 
                />

                <div className="flex justify-between relative">
                  {statusSteps.map((step, index) => {
                    const isCompleted = getStepIndex(trackData.status) >= index;
                    const isActive = getStepIndex(trackData.status) === index;
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-4 relative z-10 w-16">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 delay-[${index * 100}ms] ${
                          isCompleted ? 'bg-accent text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-surface border-2 border-white/10 text-white/20'
                        }`}>
                          <step.icon className={`w-4 h-4 ${isActive && 'animate-pulse'}`} />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-medium text-center ${isCompleted ? 'text-white' : 'text-white/30'}`}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 z-10 relative">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-white/50 mb-1">Need help with this order?</p>
                  <Link href="/contact" className="text-accent hover:underline text-sm font-medium">Contact Customer Support</Link>
                </div>
                <Link href="/shop" className="flex items-center gap-2 px-6 py-3 rounded-xl glass hover:bg-white/5 text-white text-sm font-medium transition-colors">
                  Continue Shopping <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
