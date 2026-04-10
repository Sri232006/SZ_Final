import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistAPI } from '@/lib/api';

export interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  reminderPrice?: number;
  isReminderActive?: boolean;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number;
    stock: number;
    images?: { url: string; isPrimary: boolean }[];
  };
}

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: string) => Promise<boolean>;
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
          const wishlistData = data?.data || data;
          const items = Array.isArray(wishlistData) ? wishlistData : [];
          set({ items, isLoading: false });
        } catch (error) {
          console.error('Fetch wishlist error:', error);
          set({ items: [], isLoading: false });
        }
      },

      addItem: async (productId) => {
        try {
          await wishlistAPI.add(productId);
          await get().fetchWishlist();
          return true;
        } catch (error: any) {
          console.error('Add to wishlist error:', error);
          return false;
        }
      },

      removeItem: async (id) => {
        const currentItems = get().items;
        set({ items: currentItems.filter((item) => item.id !== id) });
        try {
          await wishlistAPI.remove(id);
          await get().fetchWishlist();
        } catch (error) {
          console.error('Remove from wishlist error:', error);
          await get().fetchWishlist();
          throw error;
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.productId === productId);
      },
    }),
    {
      name: 'sz_wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);