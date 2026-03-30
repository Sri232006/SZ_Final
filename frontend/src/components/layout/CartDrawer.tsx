'use client';

import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, total, updateQuantity, removeItem } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[101] h-full w-full max-w-md bg-surface border-l border-white/5 shadow-2xl flex flex-col pt-16 lg:pt-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Your Cart
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/5 transition-colors blur-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag className="w-16 h-16 mb-4" />
                  <p className="text-white">Your cart is empty</p>
                  <button onClick={onClose} className="mt-4 text-accent text-sm hover:underline">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-24 h-28 shrink-0 rounded-lg overflow-hidden bg-white/5">
                        <Image
                          src={item.product?.images?.[0]?.url || '/images/hoodie.jpg'}
                          alt={item.product?.name || 'Product'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col flex-1 py-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-sm font-medium text-white line-clamp-1">{item.product?.name}</h3>
                          <p className="text-sm font-bold text-white whitespace-nowrap">₹{item.product?.price}</p>
                        </div>
                        <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">
                          {item.size} | {item.color}
                        </p>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-3 glass rounded-full px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="p-1 text-white/50 hover:text-white transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-white/50 hover:text-white transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/5 bg-surface/50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-white/60 text-sm">Subtotal</span>
                  <span className="text-xl font-bold text-white">₹{total}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="w-full flex items-center justify-center py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover"
                >
                  Proceed to Checkout
                </Link>
                <Link href="/cart" onClick={onClose} className="block w-full text-center mt-4 text-xs tracking-wider text-white/40 hover:text-white uppercase transition-colors">
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
