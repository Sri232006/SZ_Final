import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';
import { cartAPI } from '@/lib/api';

interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  isOpen: boolean; // Controls global cart drawer state
  fetchCart: () => Promise<void>;
  addItem: (data: { productId: string; quantity: number; size: string; color: string }) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: () => number;
  openCart: () => void;
  closeCart: () => void;
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

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const { data } = await cartAPI.get();
          const cartData = data.data || {};
          set({
            items: cartData.items || [],
            total: cartData.total || 0,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (itemData) => {
        await cartAPI.add(itemData);
        await get().fetchCart();
      },

      updateQuantity: async (id, quantity) => {
        await cartAPI.update(id, { quantity });
        await get().fetchCart();
      },

      removeItem: async (id) => {
        const currentItems = get().items;
        // Optimistic update
        set({ items: currentItems.filter((item) => item.id !== id) });
        try {
          await cartAPI.remove(id);
          await get().fetchCart(); // Re-sync with backend for totals
        } catch {
          // Revert on failure
          await get().fetchCart();
        }
      },

      clearCart: async () => {
        await cartAPI.clear();
        set({ items: [], total: 0 });
      },

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'sz_cart',
      partialize: (state) => ({ items: state.items, total: state.total }),
    }
  )
);
