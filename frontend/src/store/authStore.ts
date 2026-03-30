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
  hydrate: () => void; // Keeping for legacy/compatibility if needed
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true, // true initially until ClientInitializer sets it false

      setAuth: (user, token) => {
        set({ user, token, isLoading: false });
      },

      logout: () => {
        set({ user: null, token: null, isLoading: false });
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
          // Fresh profile update ensures token is valid and user is up to date
          const userData = data.data?.user || data.data;
          set({ user: userData, isLoading: false });
        } catch {
          // Token invalid or expired
          set({ user: null, token: null, isLoading: false });
        }
      },

      hydrate: () => {
        set({ isLoading: false }); // Handled implicitly by persist now, but sets loading false safely
      },
    }),
    {
      name: 'sz_auth',
      partialize: (state) => ({ token: state.token, user: state.user }), // only persist these fields
    }
  )
);
