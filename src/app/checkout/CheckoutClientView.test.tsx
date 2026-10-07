import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckoutClientView } from './CheckoutClientView';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { orderApiService } from '@/services/orderService';
import { Order } from '@/types/order';

vi.mock('@/services/orderService', () => ({
  orderApiService: {
    createOrder: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
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

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('CheckoutClientView', () => {
  const mockCreatedOrder: Order = {
    _id: 'ord-777',
    orderNumber: 'ORD-2026-777',
    user: 'user-1',
    items: [],
    shippingAddress: {
      fullName: 'John Doe',
      phone: '0987654321',
      addressLine1: '123 Main St',
      city: 'Hanoi',
      country: 'Vietnam',
    },
    shippingMethod: 'standard',
    shippingFee: 30,
    subtotal: 100,
    total: 130,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'pending',
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    useCartStore.setState({ items: [] });
  });

  it('renders empty cart state when cart is empty', () => {
    renderWithClient(<CheckoutClientView />);

    expect(screen.getByText('Your cart is empty')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Continue Shopping' }).getAttribute('href')).toBe('/');
  });

  it('validates fields and shows error when required inputs are missing', async () => {
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          title: 'Training Shorts',
          brand: 'Puma',
          price: 50,
          quantity: 2,
          imageUrl: 'https://example.com/shorts.jpg',
        },
      ],
    });

    renderWithClient(<CheckoutClientView />);

    expect(screen.getByText('Shipping Address')).toBeDefined();

    // Click submit with empty form fields
    const submitBtn = screen.getByRole('button', { name: /Complete Order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Email or phone number is required.')).toBeDefined();
    });
  });

  it('submits order and renders order confirmation screen on valid form data', async () => {
    vi.mocked(orderApiService.createOrder).mockResolvedValueOnce(mockCreatedOrder);

    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          title: 'Training Shorts',
          brand: 'Puma',
          price: 50,
          quantity: 2,
          imageUrl: 'https://example.com/shorts.jpg',
        },
      ],
    });

    renderWithClient(<CheckoutClientView />);

    // Fill contact
    fireEvent.change(screen.getByPlaceholderText('Email or mobile phone number'), {
      target: { value: 'john@example.com' },
    });

    // Fill first name and last name
    fireEvent.change(screen.getByPlaceholderText('First Name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), {
      target: { value: 'Doe' },
    });

    // Fill address
    fireEvent.change(screen.getByPlaceholderText('Address (Street name, house number)'), {
      target: { value: '123 Main St' },
    });

    // Fill city
    fireEvent.change(screen.getByPlaceholderText('City'), {
      target: { value: 'Hanoi' },
    });

    // Fill phone
    fireEvent.change(screen.getByPlaceholderText('Phone'), {
      target: { value: '0987654321' },
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Complete Order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Order Confirmed!')).toBeDefined();
    });

    expect(screen.getByText(/ORD-2026-777/)).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
  });
});
