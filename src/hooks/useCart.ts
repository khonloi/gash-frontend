import { useMutation, useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import { cartApiService } from '@/services/cartService';
import { CartItemPayload } from '@/types/cart';
import { useCartStore, mapServerToLocal, CartItem } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { STALE_TIME } from '@/lib/queryDefaults';
import { getErrorMessage } from '@/lib/errors';

export const cartKeys = {
  all: ['cart'] as const,
  server: () => [...cartKeys.all, 'server'] as const,
};

/**
 * Query to fetch the authenticated user's server cart
 */
export function useServerCartQuery(options?: { enabled?: boolean }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: cartKeys.server(),
    queryFn: async () => {
      const serverCart = await cartApiService.getCart();
      useCartStore.getState().setItems(mapServerToLocal(serverCart.items));
      return serverCart;
    },
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: STALE_TIME.SHORT,
  });
}

/**
 * Mutation to add an item to the server cart
 */
export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CartItemPayload) => cartApiService.addCartItem(payload),
    onSuccess: (serverCart) => {
      queryClient.setQueryData(cartKeys.server(), serverCart);
      useCartStore.getState().setItems(mapServerToLocal(serverCart.items));
    },
  });
}

/**
 * Mutation to update an item quantity on the server cart
 */
export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApiService.updateCartItem(itemId, quantity),
    onSuccess: (serverCart) => {
      queryClient.setQueryData(cartKeys.server(), serverCart);
      useCartStore.getState().setItems(mapServerToLocal(serverCart.items));
    },
  });
}

/**
 * Mutation to remove an item from the server cart
 */
export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => cartApiService.removeCartItem(itemId),
    onSuccess: (serverCart) => {
      queryClient.setQueryData(cartKeys.server(), serverCart);
      useCartStore.getState().setItems(mapServerToLocal(serverCart.items));
    },
  });
}

/**
 * Mutation to clear the server cart
 */
export function useClearCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cartApiService.clearCart(),
    onSuccess: () => {
      queryClient.setQueryData(cartKeys.server(), null);
      useCartStore.getState().clearCart();
    },
  });
}

/**
 * Mutation to merge guest cart into server cart
 */
export function useMergeCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: CartItemPayload[]) => cartApiService.mergeCart(items),
    onSuccess: (serverCart) => {
      queryClient.setQueryData(cartKeys.server(), serverCart);
      useCartStore.getState().setItems(mapServerToLocal(serverCart.items));
    },
  });
}

/**
 * Sync or merge cart on user authentication
 */
export async function syncCartOnAuth(queryClient: QueryClient) {
  const localItems = useCartStore.getState().items;
  try {
    let serverCart;
    if (localItems.length > 0) {
      const payload: CartItemPayload[] = localItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));
      serverCart = await cartApiService.mergeCart(payload);
    } else {
      serverCart = await cartApiService.getCart();
    }
    queryClient.setQueryData(cartKeys.server(), serverCart);
    useCartStore.getState().setItems(mapServerToLocal(serverCart.items));
  } catch (err) {
    console.warn('Failed to sync cart on auth:', err);
  }
}

/**
 * Comprehensive cart hook that unifies client optimistic state with TanStack Query mutations
 */
export function useCart() {
  const items = useCartStore((state) => state.items);
  const addItemToStore = useCartStore((state) => state.addItem);
  const removeItemFromStore = useCartStore((state) => state.removeItem);
  const updateQuantityInStore = useCartStore((state) => state.updateQuantity);
  const clearCartInStore = useCartStore((state) => state.clearCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();

  const addMutation = useAddToCartMutation();
  const updateMutation = useUpdateCartItemMutation();
  const removeMutation = useRemoveCartItemMutation();
  const clearMutation = useClearCartMutation();
  const mergeMutation = useMergeCartMutation();

  const isMutating =
    addMutation.isPending ||
    updateMutation.isPending ||
    removeMutation.isPending ||
    clearMutation.isPending ||
    mergeMutation.isPending;

  const addItem = async (item: Omit<CartItem, 'id' | 'serverItemId'>) => {
    // 1. Optimistic update in Zustand store
    addItemToStore(item);

    // 2. If authenticated, sync with server via React Query mutation
    if (isAuthenticated) {
      await addMutation.mutateAsync({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      });
    }
  };

  const removeItem = async (id: string) => {
    const itemToRemove = items.find((i) => i.id === id);
    removeItemFromStore(id);

    if (isAuthenticated && itemToRemove?.serverItemId) {
      await removeMutation.mutateAsync(itemToRemove.serverItemId);
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    const itemToUpdate = items.find((i) => i.id === id);
    const validQty = Math.max(1, quantity);
    updateQuantityInStore(id, validQty);

    if (isAuthenticated && itemToUpdate?.serverItemId) {
      await updateMutation.mutateAsync({
        itemId: itemToUpdate.serverItemId,
        quantity: validQty,
      });
    }
  };

  const clearCart = async () => {
    clearCartInStore();
    if (isAuthenticated) {
      await clearMutation.mutateAsync();
    }
  };

  const syncCartFromServer = async () => {
    if (isAuthenticated) {
      const serverCart = await cartApiService.getCart();
      queryClient.setQueryData(cartKeys.server(), serverCart);
      useCartStore.getState().setItems(mapServerToLocal(serverCart.items));
    }
  };

  const mergeAndSync = async () => {
    if (!isAuthenticated) return;
    const currentItems = useCartStore.getState().items;
    if (currentItems.length > 0) {
      const payload: CartItemPayload[] = currentItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));
      await mergeMutation.mutateAsync(payload);
    } else {
      await syncCartFromServer();
    }
  };

  return {
    items,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    isSyncing: isMutating,
    syncError:
      (addMutation.error ? getErrorMessage(addMutation.error) : null) ||
      (updateMutation.error ? getErrorMessage(updateMutation.error) : null) ||
      (removeMutation.error ? getErrorMessage(removeMutation.error) : null) ||
      (clearMutation.error ? getErrorMessage(clearMutation.error) : null) ||
      (mergeMutation.error ? getErrorMessage(mergeMutation.error) : null),

    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    syncCartFromServer,
    mergeAndSync,

    // Mutation references for fine-grained async control
    addMutation,
    updateMutation,
    removeMutation,
    clearMutation,
    mergeMutation,
  };
}
