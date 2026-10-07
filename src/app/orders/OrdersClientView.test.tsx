import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrdersClientView from './OrdersClientView';
import { orderApiService } from '@/services/orderService';
import { Order } from '@/types/order';

vi.mock('@/services/orderService', () => ({
  orderApiService: {
    getMyOrders: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('OrdersClientView', () => {
  const mockOrder: Order = {
    _id: 'ord-101',
    orderNumber: 'ORD-2026-999',
    user: 'user-1',
    items: [
      {
        product: 'prod-1',
        name: 'Nike Air Zoom Pegasus',
        sku: 'NK-AZP-42',
        price: 130,
        quantity: 1,
      },
    ],
    shippingAddress: {
      fullName: 'John Doe',
      phone: '0123456789',
      addressLine1: '456 Elm St',
      city: 'Ho Chi Minh',
      country: 'Vietnam',
    },
    shippingMethod: 'standard',
    shippingFee: 30,
    subtotal: 130,
    total: 160,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'delivered',
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons while fetching orders', () => {
    // Return a never-resolving promise to test loading state
    vi.mocked(orderApiService.getMyOrders).mockReturnValue(new Promise(() => {}));

    renderWithClient(<OrdersClientView />);

    expect(screen.getByRole('heading', { name: 'My Orders', level: 1 })).toBeDefined();
    // Skeleton items should be present in the document
    expect(document.querySelector('.subtitleSkeleton')).toBeDefined();
  });

  it('renders empty state when user has no orders', async () => {
    vi.mocked(orderApiService.getMyOrders).mockResolvedValueOnce({
      orders: [],
      pagination: { page: 1, limit: 10, totalPages: 0, totalResults: 0 },
      results: 0,
    });

    renderWithClient(<OrdersClientView />);

    await waitFor(() => {
      expect(screen.getByText('No Orders Found')).toBeDefined();
    });

    expect(screen.getByText("You haven't placed any orders yet.")).toBeDefined();
    expect(screen.getByRole('link', { name: 'Start Shopping' })).toBeDefined();
  });

  it('renders list of orders when orders are loaded', async () => {
    vi.mocked(orderApiService.getMyOrders).mockResolvedValueOnce({
      orders: [mockOrder],
      pagination: { page: 1, limit: 10, totalPages: 1, totalResults: 1 },
      results: 1,
    });

    renderWithClient(<OrdersClientView />);

    await waitFor(() => {
      expect(screen.getByText('Order #ORD-2026-999')).toBeDefined();
    });

    expect(screen.getByText('delivered')).toBeDefined();
    expect(screen.getByText(/Total: \$160\.00 \(1 items\)/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'View Details' }).getAttribute('href')).toBe(
      '/orders/ord-101'
    );
  });
});
