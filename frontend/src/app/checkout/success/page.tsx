'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Calendar, Truck, Download, Clock, Sparkles, Zap, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderAPI } from '@/lib/api';

import { formatDeliveryDate } from '@/lib/utils';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('order');

  // Validate orderId
  if (!orderIdParam) {
    return (
      <div className="min-h-screen pt-20 pb-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Order</h1>
          <p className="text-white/60">No order ID provided. Please check your order details.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all">
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const orderId = orderIdParam; // Now guaranteed to be string

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (orderId) {
      setShowConfetti(true);
      
      const playSuccessSound = () => {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const notes = [
            { freq: 523.25, duration: 0.15, delay: 0 },
            { freq: 659.25, duration: 0.15, delay: 0.15 },
            { freq: 783.99, duration: 0.2, delay: 0.3 },
            { freq: 1046.50, duration: 0.4, delay: 0.55 },
            { freq: 783.99, duration: 0.15, delay: 1.0 },
            { freq: 659.25, duration: 0.15, delay: 1.15 },
            { freq: 523.25, duration: 0.5, delay: 1.3 }
          ];
          
          notes.forEach((note) => {
            setTimeout(() => {
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.frequency.value = note.freq;
              gainNode.gain.value = 0.15;
              oscillator.start();
              gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + note.duration);
              oscillator.stop(audioContext.currentTime + note.duration);
            }, note.delay * 1000);
          });
          
          setTimeout(() => audioContext.close(), 2000);
        } catch (e) {
          console.log('Audio not supported');
        }
      };
      
      playSuccessSound();
      
      async function fetchOrder() {
        try {
          const { data } = await orderAPI.track(orderId);
          setOrder(data.data);
        } catch (error) {
          console.log('Order fetch error:', error);
        } finally {
          setLoading(false);
        }
      }
      fetchOrder();
      
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [orderId]);

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

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 relative z-10">
      {/* Colorful Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(80)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: -50,
                  rotate: 0,
                  scale: 0.5 + Math.random() * 0.5
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 720,
                  x: Math.random() * window.innerWidth
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2, 
                  ease: "linear",
                  delay: Math.random() * 0.5
                }}
                className="absolute w-2 h-3 rounded-sm"
                style={{
                  backgroundColor: [
                    '#ef4444', '#dc2626', '#f97316', '#eab308', '#22c55e', 
                    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'
                  ][Math.floor(Math.random() * 10)],
                  left: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Success Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, duration: 0.5 }}
        className="relative rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-2xl"
      >
        {/* Decorative Sparkles */}
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <Star className="w-6 h-6 text-accent" />
        </div>

        {/* Animated Tick Mark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 rounded-full flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', bounce: 0.6 }}
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
          <p className="text-white/40 text-sm">Thank you for choosing Southzone. Your premium streetwear is being prepared for dispatch.</p>
          
          {/* Order Number Badge */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-white/50">Order ID:</span>
            <span className="text-sm font-mono font-semibold text-accent">{orderId?.toString().slice(-8)}</span>
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-5 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-xs text-white/40 uppercase tracking-wider">ORDER PLACED</span>
            </div>
            <span className="text-xs text-white/70">{formatDate(order?.createdAt)} • {formatTime()}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-t border-white/10 mt-2 pt-3">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 text-accent" />
              <span className="text-xs text-white/40 uppercase tracking-wider">TOTAL AMOUNT</span>
            </div>
            <span className="text-lg font-bold text-white">₹{order?.finalAmount?.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-accent" />
              <span className="text-xs text-white/40 uppercase tracking-wider">ITEMS</span>
            </div>
            <span className="text-xs text-white/70">{order?.orderItems?.length || 0} products</span>
          </div>
        </motion.div>

        {/* Delivery Date - Changed to Backend Data */}
        {order?.estimatedDelivery && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/15"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Estimated Delivery</p>
                  <p className="text-sm font-semibold text-white">{formatDeliveryDate(order.estimatedDelivery)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400">On Time</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 grid grid-cols-2 gap-3"
        >
          <Link
            href={`/track?order=${orderId}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-medium hover:bg-white/10 transition-all"
          >
            <Package className="w-4 h-4" />
            Track Order
          </Link>
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all glow-red-hover"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Invoice Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}
          onClick={() => {
            toast.success('Downloading invoice...');
          }}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-medium hover:text-white/70 hover:border-white/20 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Download Invoice
        </motion.button>
      </motion.div>

      {/* Contact Support */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center mt-6"
      >
        <p className="text-[10px] text-white/30">
          Need help? <span className="text-accent/70">support@southzone.in</span>
        </p>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  
  const particles = mounted ? (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-accent/5"
          style={{
            width: Math.random() * 300 + 50,
            height: Math.random() * 300 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            filter: 'blur(60px)',
          }}
        />
      ))}
    </div>
  ) : null;

  return (
    <div className="min-h-screen pt-20 pb-24 relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-surface">
      {particles}

      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}