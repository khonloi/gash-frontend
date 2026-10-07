import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApiService } from '@/services/cartService';
import { CartItemPayload } from '@/types/cart';
import { useCartStore, mapServerToLocal } from '@/store/useCartStore';
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
      useCartStore.setState({ items: mapServerToLocal(serverCart.items) });
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
      useCartStore.setState({ items: mapServerToLocal(serverCart.items) });
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
      useCartStore.setState({ items: mapServerToLocal(serverCart.items) });
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
      useCartStore.setState({ items: mapServerToLocal(serverCart.items) });
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
      useCartStore.setState({ items: [] });
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
      useCartStore.setState({ items: mapServerToLocal(serverCart.items) });
    },
  });
}

/**
 * Comprehensive cart hook that unifies client optimistic state with TanStack Query mutations
 */
export function useCart() {
  const items = useCartStore((state) => state.items);
  const syncing = useCartStore((state) => state.syncing);
  const syncError = useCartStore((state) => state.syncError);

  const addItemToStore = useCartStore((state) => state.addItem);
  const removeItemFromStore = useCartStore((state) => state.removeItem);
  const updateQuantityInStore = useCartStore((state) => state.updateQuantity);
  const clearCartInStore = useCartStore((state) => state.clearCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const syncCartFromServer = useCartStore((state) => state.syncCartFromServer);
  const mergeAndSync = useCartStore((state) => state.mergeAndSync);

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

  return {
    items,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    isSyncing: syncing || isMutating,
    syncError:
      syncError ||
      (addMutation.error ? getErrorMessage(addMutation.error) : null) ||
      (updateMutation.error ? getErrorMessage(updateMutation.error) : null) ||
      (removeMutation.error ? getErrorMessage(removeMutation.error) : null) ||
      (clearMutation.error ? getErrorMessage(clearMutation.error) : null) ||
      (mergeMutation.error ? getErrorMessage(mergeMutation.error) : null),

    addItem: addItemToStore,
    removeItem: removeItemFromStore,
    updateQuantity: updateQuantityInStore,
    clearCart: clearCartInStore,
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
