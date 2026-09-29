import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from './useCartStore';
import { cartApiService } from '@/services/cartService';

let mockIsAuthenticated = false;

// Mock the cart API service to avoid real API calls during tests
vi.mock('@/services/cartService', () => ({
  cartApiService: {
    addCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    updateCartItem: vi.fn(),
    clearCart: vi.fn(),
    getCart: vi.fn(),
    mergeCart: vi.fn(),
  },
}));

// Mock the auth store — default to unauthenticated so tests stay local-only
vi.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ isAuthenticated: mockIsAuthenticated, accessToken: null }),
  },
}));

describe('useCartStore', () => {
  beforeEach(() => {
    mockIsAuthenticated = false;
    vi.clearAllMocks();
    useCartStore.getState().clearCart();
  });

  it('adds new items to cart', async () => {
    const item = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
      size: 'M',
      color: 'Red',
    };

    await useCartStore.getState().addItem(item);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].id).toBe('p1-M-Red');
    expect(state.items[0].quantity).toBe(1);
  });

  it('combines quantities for identical items', async () => {
    const item = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
      size: 'M',
      color: 'Red',
    };

    await useCartStore.getState().addItem(item);
    await useCartStore.getState().addItem(item);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('adds items with different sizes/colors as separate entries', async () => {
    const baseItem = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
    };

    await useCartStore.getState().addItem({ ...baseItem, size: 'M', color: 'Red' });
    await useCartStore.getState().addItem({ ...baseItem, size: 'L', color: 'Red' });

    const state = useCartStore.getState();
    expect(state.items.length).toBe(2);
  });

  it('removes item by ID', async () => {
    const item = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
      size: 'M',
      color: 'Red',
    };

    await useCartStore.getState().addItem(item);
    await useCartStore.getState().removeItem('p1-M-Red');

    expect(useCartStore.getState().items.length).toBe(0);
  });

  it('updates item quantity', async () => {
    const item = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
      size: 'M',
      color: 'Red',
    };

    await useCartStore.getState().addItem(item);
    await useCartStore.getState().updateQuantity('p1-M-Red', 5);

    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('prevents quantity from going below 1', async () => {
    const item = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
      size: 'M',
      color: 'Red',
    };

    await useCartStore.getState().addItem(item);
    await useCartStore.getState().updateQuantity('p1-M-Red', 0);
    await useCartStore.getState().updateQuantity('p1-M-Red', -5);

    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('calculates totals correctly', async () => {
    const item1 = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 2,
      size: 'M',
      color: 'Red',
    };

    const item2 = {
      productId: 'p2',
      title: 'Shirt',
      brand: 'Brand',
      price: 50,
      imageUrl: 'img.jpg',
      quantity: 3,
      size: 'L',
      color: 'Blue',
    };

    await useCartStore.getState().addItem(item1);
    await useCartStore.getState().addItem(item2);

    const state = useCartStore.getState();
    expect(state.getTotalItems()).toBe(5);
    expect(state.getTotalPrice()).toBe(200 + 150); // 350
  });

  it('rolls back optimistic addItem update when server sync fails', async () => {
    mockIsAuthenticated = true;
    vi.mocked(cartApiService.addCartItem).mockRejectedValueOnce(new Error('Server error'));

    const item = {
      productId: 'p-fail',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
      size: 'M',
      color: 'Red',
    };

    await useCartStore.getState().addItem(item);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(0);
    expect(state.syncError).toBe('Server error');
    expect(state.syncing).toBe(false);
  });

  it('rolls back optimistic removeItem update when server sync fails', async () => {
    mockIsAuthenticated = false;
    const item = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
      size: 'M',
      color: 'Red',
    };
    await useCartStore.getState().addItem(item);

    // Simulate item having serverItemId
    useCartStore.setState({
      items: [{ ...item, id: 'p1-M-Red', serverItemId: 'srv-1' }],
    });

    mockIsAuthenticated = true;
    vi.mocked(cartApiService.removeCartItem).mockRejectedValueOnce(
      new Error('Delete error')
    );

    await useCartStore.getState().removeItem('p1-M-Red');

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].id).toBe('p1-M-Red');
    expect(state.syncError).toBe('Delete error');
  });

  it('rolls back optimistic updateQuantity update when server sync fails', async () => {
    const item = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 2,
      size: 'M',
      color: 'Red',
      id: 'p1-M-Red',
      serverItemId: 'srv-1',
    };

    useCartStore.setState({ items: [item] });

    mockIsAuthenticated = true;
    vi.mocked(cartApiService.updateCartItem).mockRejectedValueOnce(
      new Error('Update error')
    );

    await useCartStore.getState().updateQuantity('p1-M-Red', 5);

    const state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(2);
    expect(state.syncError).toBe('Update error');
  });
});
