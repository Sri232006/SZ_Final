import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';
import { cartAPI } from '@/lib/api';

interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  isOpen: boolean;
  fetchCart: () => Promise<void>;
  addItem: (data: { productId: string; quantity: number; size: string; color: string }) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: () => number;
  openCart: () => void;
  closeCart: () => void;
  resetCart: () => void;  // Add this for logout
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      isLoading: false,
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      resetCart: () => {
        set({ items: [], total: 0, isLoading: false });
      },

      fetchCart: async () => {
        const { token } = require('./authStore').useAuthStore.getState();
        if (!token) {
          set({ items: [], total: 0, isLoading: false });
          return;
        }
        
        set({ isLoading: true });
        try {
          const { data } = await cartAPI.get();
          const cartData = data.data || {};
          set({
            items: cartData.items || [],
            total: cartData.total || 0,
            isLoading: false,
          });
        } catch (error) {
          console.error('Fetch cart error:', error);
          set({ isLoading: false });
        }
      },

      addItem: async (itemData) => {
        const { token } = require('./authStore').useAuthStore.getState();
        if (!token) {
          // Store in localStorage for guest cart
          const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
          guestCart.push(itemData);
          localStorage.setItem('guest_cart', JSON.stringify(guestCart));
          return;
        }
        
        try {
          await cartAPI.add(itemData);
          await get().fetchCart();
        } catch (error: any) {
          console.error('Add item error:', error);
          throw error;
        }
      },

      updateQuantity: async (id, quantity) => {
        try {
          await cartAPI.update(id, { quantity });
          await get().fetchCart();
        } catch (error) {
          console.error('Update quantity error:', error);
          throw error;
        }
      },

      removeItem: async (id) => {
        const currentItems = get().items;
        set({ items: currentItems.filter((item) => item.id !== id) });
        try {
          await cartAPI.remove(id);
          await get().fetchCart();
        } catch (error) {
          await get().fetchCart();
          throw error;
        }
      },

      clearCart: async () => {
        try {
          await cartAPI.clear();
          set({ items: [], total: 0 });
        } catch (error) {
          console.error('Clear cart error:', error);
        }
      },

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'sz_cart',
      partialize: (state) => ({ items: state.items, total: state.total }),
    }
  )
);