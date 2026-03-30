'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  return (
    <div className="max-w-xl mx-auto px-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="w-24 h-24 mx-auto mb-8 bg-green-500/20 rounded-full flex items-center justify-center glow-green"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Order Confirmed!</h1>
        <p className="text-white/60 mb-8 max-w-sm mx-auto leading-relaxed">
          Thank you for choosing SouthZone. Your premium streetwear is being prepared for dispatch.
        </p>

        {orderId && (
          <div className="inline-block glass-strong px-6 py-4 rounded-2xl mb-12">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Order Number</p>
            <p className="text-xl font-bold text-accent font-mono">#{orderId.toString().padStart(6, '0')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/orders/${orderId}`}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl glass glass-hover text-white text-sm font-semibold transition-all"
          >
            <Package className="w-4 h-4" /> Track Order
          </Link>
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all glow-red-hover"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 relative flex items-center justify-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
        <Image src="/images/southzone_logo_final.jpg" alt="SouthZone" width={200} height={60} className="rounded-lg grayscale" />
      </div>

      <Suspense fallback={<div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
