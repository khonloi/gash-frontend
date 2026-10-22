import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AuthTokens } from '@/types/user';
import { STORAGE_KEYS } from '@/constants/site';
import '@/lib/tokenRefresher';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: UserProfile, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  clearAuth: () => void;
}

function syncSessionCookie(active: boolean): void {
  if (typeof document === 'undefined') return;
  try {
    if (active) {
      document.cookie = 'jocksport_session=1; path=/; SameSite=Lax; Secure';
    } else {
      document.cookie =
        'jocksport_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
    }
  } catch {
    // Ignore browser cookie manipulation errors
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, tokens) => {
        syncSessionCookie(true);
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        });
      },

      setTokens: (tokens) => {
        syncSessionCookie(true);
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        });
      },

      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),

      clearAuth: () => {
        syncSessionCookie(false);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          syncSessionCookie(true);
        }
      },
    }
  )
);
