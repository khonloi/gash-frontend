import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartSidebar } from './CartSidebar';
import { useCartStore } from '@/store/useCartStore';

describe('CartSidebar', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('renders empty cart state when no items are present', () => {
    render(<CartSidebar isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Shopping Cart')).toBeDefined();
    expect(screen.getByText('Your cart is empty')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Continue Shopping' })).toBeDefined();
  });

  it('renders cart items, updates quantity, and removes item', () => {
    useCartStore.getState().addItem({
      productId: 'p-1',
      title: 'Ultraboost Light',
      brand: 'Adidas',
      price: 190,
      imageUrl: 'https://example.com/shoes.jpg',
      quantity: 1,
    });

    render(<CartSidebar isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Ultraboost Light')).toBeDefined();
    expect(screen.getByText('Adidas')).toBeDefined();
    expect(screen.getAllByText('$190.00')).toHaveLength(2);

    // Check increase quantity button
    const plusBtn = screen.getByRole('button', { name: 'Increase quantity' });
    fireEvent.click(plusBtn);
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    // Check remove item
    const removeBtn = screen.getByRole('button', { name: /Remove Ultraboost Light from cart/i });
    fireEvent.click(removeBtn);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<CartSidebar isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: 'Close cart' });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
