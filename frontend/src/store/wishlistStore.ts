import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WishlistItem } from '@/types';
import { wishlistAPI } from '@/lib/api';

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      fetchWishlist: async () => {
        set({ isLoading: true });
        try {
          const { data } = await wishlistAPI.getAll();
          const payload = data.data;
          set({ items: payload?.wishlist || (Array.isArray(payload) ? payload : []), isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (productId) => {
        await wishlistAPI.add(productId);
        await get().fetchWishlist();
      },

      removeItem: async (id) => {
        const currentItems = get().items;
        set({ items: currentItems.filter((item) => item.id !== id) });
        try {
          await wishlistAPI.remove(id);
          await get().fetchWishlist();
        } catch {
          await get().fetchWishlist();
        }
      },

      isInWishlist: (productId) =>
        get().items.some((item) => item.productId === productId),
    }),
    {
      name: 'sz_wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
