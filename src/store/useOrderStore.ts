import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { orderApiService } from '@/services/orderService';
import { useCartStore } from './useCartStore';
import {
  Order,
  CreateOrderPayload,
  OrderQueryParams,
} from '@/types/order';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

interface OrderPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  pagination: OrderPagination | null;

  placeOrder: (payload: CreateOrderPayload) => Promise<Order>;
  fetchMyOrders: (params?: OrderQueryParams) => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<Order>;
  cancelOrder: (orderId: string, reason?: string) => Promise<Order>;
  setCurrentOrder: (order: Order | null) => void;
  clearCurrentOrder: () => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      currentOrder: null,
      loading: false,
      error: null,
      pagination: null,

      placeOrder: async (payload: CreateOrderPayload): Promise<Order> => {
        set({ loading: true, error: null });
        try {
          const createdOrder = await orderApiService.createOrder(payload);

          // Update store state
          set((state) => ({
            currentOrder: createdOrder,
            orders: [createdOrder, ...state.orders.filter((o) => o._id !== createdOrder._id)],
            loading: false,
          }));

          // Clear cart in cart store
          try {
            await useCartStore.getState().clearCart();
          } catch {
            // Cart clearance error should not fail order placement
          }

          return createdOrder;
        } catch (err: unknown) {
          const message = getErrorMessage(err) || 'Failed to place order';
          set({ error: message, loading: false });
          throw err;
        }
      },

      fetchMyOrders: async (params?: OrderQueryParams): Promise<void> => {
        set({ loading: true, error: null });
        try {
          const result = await orderApiService.getMyOrders(params);
          set({
            orders: result.orders,
            pagination: result.pagination,
            loading: false,
          });
        } catch (err: unknown) {
          const message = getErrorMessage(err) || 'Failed to load orders';
          set({ error: message, loading: false });
        }
      },

      fetchOrderById: async (orderId: string): Promise<Order> => {
        set({ loading: true, error: null });
        try {
          const order = await orderApiService.getOrderById(orderId);
          set({ currentOrder: order, loading: false });
          return order;
        } catch (err: unknown) {
          const message = getErrorMessage(err) || 'Failed to load order';
          set({ error: message, loading: false });
          throw err;
        }
      },

      cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
        set({ loading: true, error: null });
        try {
          const updatedOrder = await orderApiService.cancelOrder(orderId, reason);

          set((state) => ({
            orders: state.orders.map((o) =>
              o._id === updatedOrder._id || o.orderNumber === updatedOrder.orderNumber
                ? updatedOrder
                : o
            ),
            currentOrder:
              state.currentOrder?._id === updatedOrder._id ||
              state.currentOrder?.orderNumber === updatedOrder.orderNumber
                ? updatedOrder
                : state.currentOrder,
            loading: false,
          }));

          return updatedOrder;
        } catch (err: unknown) {
          const message = getErrorMessage(err) || 'Failed to cancel order';
          set({ error: message, loading: false });
          throw err;
        }
      },

      setCurrentOrder: (order: Order | null) => set({ currentOrder: order }),

      clearCurrentOrder: () => set({ currentOrder: null }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'jocksport-order-storage',
      partialize: (state) => ({ currentOrder: state.currentOrder }),
    }
  )
);
