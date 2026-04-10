import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { userAPI } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      setAuth: (user, token) => {
        set({ user, token, isLoading: false });
        // After login, sync cart
        setTimeout(() => {
          const { useCartStore } = require('./cartStore');
          useCartStore.getState().fetchCart();
        }, 100);
      },

      logout: () => {
        set({ user: null, token: null, isLoading: false });
        // Clear cart on logout
        const { useCartStore } = require('./cartStore');
        useCartStore.getState().resetCart();
      },

      updateUser: (userData) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...userData } });
        }
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          const { data } = await userAPI.getProfile();
          const userData = data.data?.user || data.data;
          set({ user: userData, isLoading: false });
        } catch {
          set({ user: null, token: null, isLoading: false });
        }
      },

      hydrate: () => {
        set({ isLoading: false });
      },
    }),
    {
      name: 'sz_auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);