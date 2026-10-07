import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartClientView } from './CartClientView';
import { useCartStore } from '@/store/useCartStore';

describe('CartClientView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [], syncing: false, syncError: null });
  });

  it('renders empty cart message when no items in cart', () => {
    render(<CartClientView />);

    expect(screen.getByRole('heading', { name: 'Shopping Cart', level: 1 })).toBeDefined();
    expect(screen.getByText('Your cart is empty')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Shop Now' }).getAttribute('href')).toBe('/');
  });

  it('renders cart items and updates quantities and removal', () => {
    useCartStore.setState({
      items: [
        {
          id: 'item-1',
          productId: 'p-1',
          title: 'Air Jordan 1 Retro',
          brand: 'Nike',
          price: 180,
          quantity: 1,
          size: '10.5',
          color: 'Chicago Red',
          imageUrl: 'https://example.com/jordan.jpg',
        },
      ],
      syncing: false,
      syncError: null,
    });

    render(<CartClientView />);

    expect(screen.getByText('Air Jordan 1 Retro')).toBeDefined();
    expect(screen.getByText('Nike')).toBeDefined();
    expect(screen.getByText('Chicago Red')).toBeDefined();
    expect(screen.getByText('10.5')).toBeDefined();
    expect(screen.getAllByText('$180.00')).toHaveLength(4); // unit price, item total, subtotal, cart total

    // Test increase quantity
    const plusBtn = screen.getByRole('button', { name: 'Increase quantity' });
    fireEvent.click(plusBtn);

    expect(useCartStore.getState().items[0].quantity).toBe(2);

    // Test checkout button link
    expect(screen.getByRole('link', { name: 'Proceed to Checkout' }).getAttribute('href')).toBe(
      '/checkout'
    );

    // Test remove item
    const removeBtn = screen.getByRole('button', { name: 'Remove item' });
    fireEvent.click(removeBtn);

    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
