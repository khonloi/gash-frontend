import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useServerCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useMergeCartMutation,
  useCart,
} from './useCart';
import { cartApiService } from '@/services/cartService';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { ServerCart } from '@/types/cart';

vi.mock('@/services/cartService', () => ({
  cartApiService: {
    getCart: vi.fn(),
    addCartItem: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
    mergeCart: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';

  return Wrapper;
}

describe('useCart hooks', () => {
  const mockServerCart: ServerCart = {
    _id: 'cart-123',
    user: 'user-77',
    items: [
      {
        _id: 'item-1',
        product: {
          _id: 'prod-1',
          name: 'Running Shoes',
          slug: 'running-shoes',
          price: 120,
          quantity: 10,
          brand: 'Nike',
          images: [{ url: 'https://example.com/shoe.jpg', isPrimary: true }],
        },
        quantity: 2,
        priceAtAdd: 120,
        size: '10',
        color: 'Black',
      },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    useCartStore.setState({ items: [], syncing: false, syncError: null });
  });

  describe('useServerCartQuery', () => {
    it('does not run query if user is unauthenticated', () => {
      const { result } = renderHook(() => useServerCartQuery(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(cartApiService.getCart).not.toHaveBeenCalled();
    });

    it('fetches server cart and updates store items when authenticated', async () => {
      useAuthStore.setState({ isAuthenticated: true });
      vi.mocked(cartApiService.getCart).mockResolvedValueOnce(mockServerCart);

      const { result } = renderHook(() => useServerCartQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(cartApiService.getCart).toHaveBeenCalledTimes(1);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Running Shoes');
      expect(items[0].quantity).toBe(2);
    });
  });

  describe('mutations', () => {
    it('useAddToCartMutation calls service and updates store items', async () => {
      vi.mocked(cartApiService.addCartItem).mockResolvedValueOnce(mockServerCart);

      const { result } = renderHook(() => useAddToCartMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ productId: 'prod-1', quantity: 2 });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(cartApiService.addCartItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        quantity: 2,
      });
      expect(useCartStore.getState().items).toHaveLength(1);
    });

    it('useUpdateCartItemMutation updates item and syncs store', async () => {
      vi.mocked(cartApiService.updateCartItem).mockResolvedValueOnce(mockServerCart);

      const { result } = renderHook(() => useUpdateCartItemMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ itemId: 'item-1', quantity: 2 });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(cartApiService.updateCartItem).toHaveBeenCalledWith('item-1', 2);
    });

    it('useRemoveCartItemMutation removes item and syncs store', async () => {
      vi.mocked(cartApiService.removeCartItem).mockResolvedValueOnce({
        ...mockServerCart,
        items: [],
      });

      const { result } = renderHook(() => useRemoveCartItemMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('item-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(cartApiService.removeCartItem).toHaveBeenCalledWith('item-1');
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('useClearCartMutation clears cart on server and local store', async () => {
      vi.mocked(cartApiService.clearCart).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClearCartMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(cartApiService.clearCart).toHaveBeenCalledTimes(1);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('useMergeCartMutation merges items and updates store', async () => {
      vi.mocked(cartApiService.mergeCart).mockResolvedValueOnce(mockServerCart);

      const { result } = renderHook(() => useMergeCartMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate([{ productId: 'prod-1', quantity: 2 }]);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(cartApiService.mergeCart).toHaveBeenCalledWith([{ productId: 'prod-1', quantity: 2 }]);
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe('useCart unified hook', () => {
    it('returns combined state and helpers', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper(),
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
      expect(typeof result.current.addItem).toBe('function');
      expect(typeof result.current.removeItem).toBe('function');
      expect(typeof result.current.updateQuantity).toBe('function');
    });
  });
});
