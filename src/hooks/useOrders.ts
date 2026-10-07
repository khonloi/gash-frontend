import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApiService, OrdersResult } from '@/services/orderService';
import { Order, CreateOrderPayload, OrderQueryParams } from '@/types/order';
import { useCartStore } from '@/store/useCartStore';
import { cartKeys } from '@/hooks/useCart';
import { STALE_TIME } from '@/lib/queryDefaults';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: OrderQueryParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

/**
 * Hook to fetch current user's orders with TanStack Query
 */
export function useMyOrdersQuery(
  params?: OrderQueryParams,
  options?: { enabled?: boolean; initialData?: OrdersResult }
) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderApiService.getMyOrders(params),
    staleTime: STALE_TIME.STANDARD,
    ...options,
  });
}

/**
 * Hook to fetch a single order by ID or orderNumber
 */
export function useOrderQuery(
  orderId: string,
  options?: { enabled?: boolean; initialData?: Order }
) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderApiService.getOrderById(orderId),
    enabled: Boolean(orderId) && (options?.enabled ?? true),
    staleTime: STALE_TIME.STANDARD,
    ...options,
  });
}

/**
 * Mutation to place a new order
 */
export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderApiService.createOrder(payload),
    onSuccess: async (createdOrder) => {
      // Invalidate all order queries so history is refreshed
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.setQueryData(orderKeys.detail(createdOrder._id), createdOrder);
      if (createdOrder.orderNumber) {
        queryClient.setQueryData(orderKeys.detail(createdOrder.orderNumber), createdOrder);
      }

      // Clear the cart
      try {
        useCartStore.getState().clearCart();
        queryClient.setQueryData(cartKeys.server(), null);
      } catch (err) {
        console.warn('Cart clearance failed after placing order:', err);
      }
    },
  });
}

/**
 * Mutation to cancel an existing order
 */
export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      orderApiService.cancelOrder(orderId, reason),
    onSuccess: (updatedOrder, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.setQueryData(orderKeys.detail(orderId), updatedOrder);
      if (updatedOrder._id !== orderId) {
        queryClient.setQueryData(orderKeys.detail(updatedOrder._id), updatedOrder);
      }
    },
  });
}
