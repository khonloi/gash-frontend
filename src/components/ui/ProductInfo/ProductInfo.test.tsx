import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductInfo } from './ProductInfo';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ProductInfo Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.getState().clearCart();
    useToastStore.setState({ toasts: [] });
  });

  const mockProps = {
    id: 'prod-001',
    brand: 'Nike',
    title: 'Air Zoom Pegasus 40',
    category: 'Running',
    sku: 'NK-AZP-40',
    price: 130,
    originalPrice: 160,
    fit: 'Regular',
    colors: [
      { id: 'c1', name: 'Black/White', imageUrl: 'https://images.unsplash.com/c1.jpg' },
      { id: 'c2', name: 'Blue/Orange', imageUrl: 'https://images.unsplash.com/c2.jpg' },
    ],
    sizes: [
      { id: 's1', label: 'US 8', inStock: true },
      { id: 's2', label: 'US 9', inStock: true },
      { id: 's3', label: 'US 10', inStock: false },
    ],
  };

  it('renders product details and prices accurately', () => {
    render(<ProductInfo {...mockProps} />);

    expect(screen.getByText('Nike')).toBeDefined();
    expect(screen.getByText('Air Zoom Pegasus 40')).toBeDefined();
    expect(screen.getByText('Running')).toBeDefined();
    expect(screen.getByText('SKU NK-AZP-40')).toBeDefined();
    expect(screen.getByText('$130.00')).toBeDefined();
    expect(screen.getByText('$160.00')).toBeDefined();
    expect(screen.getByText('Black/White')).toBeDefined();
  });

  it('allows switching selected color', () => {
    render(<ProductInfo {...mockProps} />);

    const blueColorBtn = screen.getByRole('button', { name: /Select color Blue\/Orange/i });
    expect(blueColorBtn).toBeDefined();

    fireEvent.click(blueColorBtn);
    expect(blueColorBtn.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Blue/Orange')).toBeDefined();
  });

  it('allows selecting an in-stock size and disables out-of-stock sizes', () => {
    render(<ProductInfo {...mockProps} />);

    const us8Btn = screen.getByRole('button', { name: 'US 8' });
    const us10Btn = screen.getByRole('button', { name: 'US 10' });

    expect(us10Btn).toBeDisabled();

    fireEvent.click(us8Btn);
    expect(us8Btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('displays error toast when adding to cart without choosing a size', async () => {
    render(<ProductInfo {...mockProps} />);

    const addBtn = screen.getByRole('button', { name: /ADD TO CART/i });
    fireEvent.click(addBtn);

    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.message.includes('select a size first'))).toBe(true);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('successfully adds item to cart when size is selected', async () => {
    render(<ProductInfo {...mockProps} />);

    // Select size
    const us9Btn = screen.getByRole('button', { name: 'US 9' });
    fireEvent.click(us9Btn);

    // Increase quantity using QuantitySelector
    const increaseBtn = screen.getByRole('button', { name: /Increase quantity/i });
    fireEvent.click(increaseBtn);

    const addBtn = screen.getByRole('button', { name: /ADD TO CART/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-001');
      expect(items[0].size).toBe('s2');
      expect(items[0].quantity).toBe(2);
      expect(items[0].color).toBe('Black/White');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.message.includes('Added 2 item(s)'))).toBe(true);
  });

  it('handles Buy Now by adding item to cart and routing to /checkout', async () => {
    render(<ProductInfo {...mockProps} />);

    // Select size
    const us8Btn = screen.getByRole('button', { name: 'US 8' });
    fireEvent.click(us8Btn);

    const buyNowBtn = screen.getByRole('button', { name: /BUY NOW/i });
    fireEvent.click(buyNowBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/checkout');
    });

    expect(useCartStore.getState().items).toHaveLength(1);
    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.message.includes('Proceeding to checkout'))).toBe(true);
  });

  it('shows coming soon toasts for helper buttons (Size Guide & In-Store Availability)', () => {
    render(<ProductInfo {...mockProps} />);

    const sizeGuideBtn = screen.getByRole('button', { name: /Size Guide/i });
    fireEvent.click(sizeGuideBtn);

    let toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.message.includes('Size guide is coming soon'))).toBe(true);

    const inStoreBtn = screen.getByRole('button', { name: /Check In-Store Availability/i });
    fireEvent.click(inStoreBtn);

    toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.message.includes('In-store availability'))).toBe(true);
  });
});
