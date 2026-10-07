import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, mapServerToLocal } from './useCartStore';
import { ServerCartItem } from '@/types/cart';

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('adds new items to cart', () => {
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

    useCartStore.getState().addItem(item);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].id).toBe('p1-M-Red');
    expect(state.items[0].quantity).toBe(1);
  });

  it('combines quantities for identical items', () => {
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

    useCartStore.getState().addItem(item);
    useCartStore.getState().addItem(item);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('adds items with different sizes/colors as separate entries', () => {
    const baseItem = {
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
    };

    useCartStore.getState().addItem({ ...baseItem, size: 'M', color: 'Red' });
    useCartStore.getState().addItem({ ...baseItem, size: 'L', color: 'Red' });

    const state = useCartStore.getState();
    expect(state.items.length).toBe(2);
  });

  it('removes item by ID', () => {
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

    useCartStore.getState().addItem(item);
    useCartStore.getState().removeItem('p1-M-Red');

    expect(useCartStore.getState().items.length).toBe(0);
  });

  it('updates item quantity', () => {
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

    useCartStore.getState().addItem(item);
    useCartStore.getState().updateQuantity('p1-M-Red', 5);

    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('prevents quantity from going below 1', () => {
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

    useCartStore.getState().addItem(item);
    useCartStore.getState().updateQuantity('p1-M-Red', 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    useCartStore.getState().updateQuantity('p1-M-Red', -5);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('clears all items from cart', () => {
    useCartStore.getState().addItem({
      productId: 'p1',
      title: 'Shoe',
      brand: 'Brand',
      price: 100,
      imageUrl: 'img.jpg',
      quantity: 1,
    });
    expect(useCartStore.getState().items.length).toBe(1);

    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it('sets items directly via setItems', () => {
    const customItems = [
      {
        id: 'c1',
        productId: 'p1',
        title: 'Custom 1',
        brand: 'Nike',
        price: 50,
        imageUrl: '',
        quantity: 3,
      },
    ];

    useCartStore.getState().setItems(customItems);
    expect(useCartStore.getState().items).toEqual(customItems);
  });

  it('calculates totals correctly', () => {
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

    useCartStore.getState().addItem(item1);
    useCartStore.getState().addItem(item2);

    const state = useCartStore.getState();
    expect(state.getTotalItems()).toBe(5);
    expect(state.getTotalPrice()).toBe(350);
  });

  it('mapServerToLocal maps server items accurately', () => {
    const serverItems: ServerCartItem[] = [
      {
        _id: 'srv-1',
        product: {
          _id: 'prod-99',
          name: 'Pro Cleats',
          slug: 'pro-cleats',
          price: 150,
          quantity: 20,
          brand: 'Puma',
          images: [
            { url: 'https://example.com/alt.jpg', isPrimary: false },
            { url: 'https://example.com/primary.jpg', isPrimary: true },
          ],
        },
        quantity: 2,
        priceAtAdd: 140,
        size: '9',
        color: 'Yellow',
      },
    ];

    const mapped = mapServerToLocal(serverItems);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toEqual({
      id: 'prod-99-9-Yellow',
      serverItemId: 'srv-1',
      productId: 'prod-99',
      title: 'Pro Cleats',
      brand: 'Puma',
      price: 140,
      imageUrl: 'https://example.com/primary.jpg',
      quantity: 2,
      size: '9',
      color: 'Yellow',
    });
  });
});
