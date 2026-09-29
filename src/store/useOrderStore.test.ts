import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOrderStore } from './useOrderStore';
import { orderApiService } from '@/services/orderService';
import { useCartStore } from './useCartStore';
import { Order, CreateOrderPayload } from '@/types/order';

vi.mock('@/services/orderService', () => ({
  orderApiService: {
    createOrder: vi.fn(),
    getMyOrders: vi.fn(),
    getOrderById: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

vi.mock('./useCartStore', () => ({
  useCartStore: {
    getState: vi.fn(() => ({
      clearCart: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

describe('useOrderStore', () => {
  const mockOrder: Order = {
    _id: 'ord-100',
    orderNumber: 'ORD-100',
    user: 'usr-1',
    items: [
      {
        _id: 'it-1',
        product: 'prod-1',
        name: 'Running Cap',
        sku: 'CAP-01',
        price: 25,
        quantity: 1,
      },
    ],
    shippingAddress: {
      fullName: 'Alex Morgan',
      phone: '0123456789',
      addressLine1: '456 Avenue',
      city: 'Seattle',
      country: 'USA',
    },
    shippingMethod: 'standard',
    shippingFee: 5,
    subtotal: 25,
    total: 30,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'pending',
    createdAt: '2026-09-29T10:00:00.000Z',
    updatedAt: '2026-09-29T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useOrderStore.setState({
      orders: [],
      currentOrder: null,
      loading: false,
      error: null,
      pagination: null,
    });
  });

  it('initializes with default state', () => {
    const state = useOrderStore.getState();
    expect(state.orders).toEqual([]);
    expect(state.currentOrder).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.pagination).toBeNull();
  });

  describe('placeOrder', () => {
    it('successfully places an order, updates store and clears cart', async () => {
      const clearCartMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useCartStore.getState).mockReturnValue({
        clearCart: clearCartMock,
      } as unknown as ReturnType<typeof useCartStore.getState>);

      vi.mocked(orderApiService.createOrder).mockResolvedValueOnce(mockOrder);

      const payload: CreateOrderPayload = {
        shippingAddress: mockOrder.shippingAddress,
      };

      const result = await useOrderStore.getState().placeOrder(payload);

      expect(orderApiService.createOrder).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockOrder);
      expect(useOrderStore.getState().currentOrder).toEqual(mockOrder);
      expect(useOrderStore.getState().orders).toContainEqual(mockOrder);
      expect(useOrderStore.getState().loading).toBe(false);
      expect(clearCartMock).toHaveBeenCalledTimes(1);
    });

    it('does not fail order placement if cart clearing throws', async () => {
      const failingClearCart = vi.fn().mockRejectedValue(new Error('Cart clear error'));
      vi.mocked(useCartStore.getState).mockReturnValue({
        clearCart: failingClearCart,
      } as unknown as ReturnType<typeof useCartStore.getState>);

      vi.mocked(orderApiService.createOrder).mockResolvedValueOnce(mockOrder);

      const result = await useOrderStore.getState().placeOrder({
        shippingAddress: mockOrder.shippingAddress,
      });

      expect(result).toEqual(mockOrder);
      expect(useOrderStore.getState().currentOrder).toEqual(mockOrder);
      expect(useOrderStore.getState().error).toBeNull();
    });

    it('records error state and rethrows when order placement fails', async () => {
      vi.mocked(orderApiService.createOrder).mockRejectedValueOnce(
        new Error('Payment gateway declined')
      );

      await expect(
        useOrderStore.getState().placeOrder({
          shippingAddress: mockOrder.shippingAddress,
        })
      ).rejects.toThrow('Payment gateway declined');

      expect(useOrderStore.getState().error).toBe('Payment gateway declined');
      expect(useOrderStore.getState().loading).toBe(false);
    });
  });

  describe('fetchMyOrders', () => {
    it('fetches orders and updates pagination', async () => {
      const pagination = {
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      };

      vi.mocked(orderApiService.getMyOrders).mockResolvedValueOnce({
        orders: [mockOrder],
        pagination,
        results: 1,
      });

      await useOrderStore.getState().fetchMyOrders({ page: 1 });

      expect(orderApiService.getMyOrders).toHaveBeenCalledWith({ page: 1 });
      expect(useOrderStore.getState().orders).toEqual([mockOrder]);
      expect(useOrderStore.getState().pagination).toEqual(pagination);
      expect(useOrderStore.getState().loading).toBe(false);
    });

    it('sets error state if fetchMyOrders fails', async () => {
      vi.mocked(orderApiService.getMyOrders).mockRejectedValueOnce(
        new Error('Network connection timeout')
      );

      await useOrderStore.getState().fetchMyOrders();

      expect(useOrderStore.getState().error).toBe('Network connection timeout');
      expect(useOrderStore.getState().loading).toBe(false);
    });
  });

  describe('fetchOrderById', () => {
    it('loads order details into currentOrder', async () => {
      vi.mocked(orderApiService.getOrderById).mockResolvedValueOnce(mockOrder);

      const result = await useOrderStore.getState().fetchOrderById('ord-100');

      expect(orderApiService.getOrderById).toHaveBeenCalledWith('ord-100');
      expect(result).toEqual(mockOrder);
      expect(useOrderStore.getState().currentOrder).toEqual(mockOrder);
      expect(useOrderStore.getState().loading).toBe(false);
    });

    it('sets error state and rethrows when fetchOrderById fails', async () => {
      vi.mocked(orderApiService.getOrderById).mockRejectedValueOnce(new Error('Order not found'));

      await expect(useOrderStore.getState().fetchOrderById('ord-999')).rejects.toThrow(
        'Order not found'
      );

      expect(useOrderStore.getState().error).toBe('Order not found');
      expect(useOrderStore.getState().loading).toBe(false);
    });
  });

  describe('cancelOrder', () => {
    it('cancels order, updating both orders array and currentOrder', async () => {
      const cancelled: Order = {
        ...mockOrder,
        status: 'cancelled',
        cancelReason: 'Changed mind',
      };

      useOrderStore.setState({
        orders: [mockOrder],
        currentOrder: mockOrder,
      });

      vi.mocked(orderApiService.cancelOrder).mockResolvedValueOnce(cancelled);

      const result = await useOrderStore.getState().cancelOrder('ord-100', 'Changed mind');

      expect(orderApiService.cancelOrder).toHaveBeenCalledWith('ord-100', 'Changed mind');
      expect(result.status).toBe('cancelled');
      expect(useOrderStore.getState().orders[0].status).toBe('cancelled');
      expect(useOrderStore.getState().currentOrder?.status).toBe('cancelled');
    });

    it('sets error and rethrows when cancellation fails', async () => {
      vi.mocked(orderApiService.cancelOrder).mockRejectedValueOnce(
        new Error('Cannot cancel shipped order')
      );

      await expect(useOrderStore.getState().cancelOrder('ord-100', 'reason')).rejects.toThrow(
        'Cannot cancel shipped order'
      );

      expect(useOrderStore.getState().error).toBe('Cannot cancel shipped order');
      expect(useOrderStore.getState().loading).toBe(false);
    });
  });

  describe('utility actions', () => {
    it('setCurrentOrder sets current order', () => {
      useOrderStore.getState().setCurrentOrder(mockOrder);
      expect(useOrderStore.getState().currentOrder).toEqual(mockOrder);
    });

    it('clearCurrentOrder resets current order to null', () => {
      useOrderStore.getState().setCurrentOrder(mockOrder);
      useOrderStore.getState().clearCurrentOrder();
      expect(useOrderStore.getState().currentOrder).toBeNull();
    });

    it('clearError resets error state to null', () => {
      useOrderStore.setState({ error: 'Some error' });
      useOrderStore.getState().clearError();
      expect(useOrderStore.getState().error).toBeNull();
    });
  });
});
