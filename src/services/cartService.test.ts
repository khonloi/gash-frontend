import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cartApiService } from './cartService';
import { apiClient } from '@/lib/apiClient';
import { ServerCart } from '@/types/cart';

describe('cartApiService', () => {
  const mockServerCart: ServerCart = {
    _id: 'cart-1',
    user: 'user-1',
    items: [
      {
        _id: 'item-1',
        product: {
          _id: 'prod-1',
          name: 'Running Shoes',
          slug: 'running-shoes',
          price: 120,
          quantity: 50,
          images: [{ url: 'https://example.com/shoes.jpg', isPrimary: true }],
        },
        quantity: 2,
        priceAtAdd: 120,
      },
    ],
    createdAt: '2026-09-29T10:00:00.000Z',
    updatedAt: '2026-09-29T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCart', () => {
    it('fetches server cart data', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        status: 'success',
        data: { cart: mockServerCart },
      });

      const result = await cartApiService.getCart();

      expect(apiClient.get).toHaveBeenCalledWith('/cart');
      expect(result).toEqual(mockServerCart);
    });
  });

  describe('addCartItem', () => {
    it('posts new cart item payload', async () => {
      const payload = { productId: 'prod-1', quantity: 2, size: '10' };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        status: 'success',
        data: { cart: mockServerCart },
      });

      const result = await cartApiService.addCartItem(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/cart/items', payload);
      expect(result).toEqual(mockServerCart);
    });
  });

  describe('updateCartItem', () => {
    it('patches cart item quantity', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        status: 'success',
        data: { cart: mockServerCart },
      });

      const result = await cartApiService.updateCartItem('item-1', 3);

      expect(apiClient.patch).toHaveBeenCalledWith('/cart/items/item-1', { quantity: 3 });
      expect(result).toEqual(mockServerCart);
    });
  });

  describe('removeCartItem', () => {
    it('deletes specific cart item', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        status: 'success',
        data: { cart: mockServerCart },
      });

      const result = await cartApiService.removeCartItem('item-1');

      expect(apiClient.delete).toHaveBeenCalledWith('/cart/items/item-1');
      expect(result).toEqual(mockServerCart);
    });
  });

  describe('clearCart', () => {
    it('deletes entire cart', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        status: 'success',
        data: null,
      });

      await cartApiService.clearCart();

      expect(apiClient.delete).toHaveBeenCalledWith('/cart');
    });
  });

  describe('mergeCart', () => {
    it('merges local items into server cart', async () => {
      const items = [{ productId: 'prod-1', quantity: 1 }];

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        status: 'success',
        data: { cart: mockServerCart },
      });

      const result = await cartApiService.mergeCart(items);

      expect(apiClient.post).toHaveBeenCalledWith('/cart/merge', { items });
      expect(result).toEqual(mockServerCart);
    });
  });
});
