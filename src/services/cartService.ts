import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api';
import { ServerCart, CartItemPayload } from '@/types/cart';

export const cartApiService = {
  /**
   * Fetch user's cart
   */
  getCart: async (): Promise<ServerCart> => {
    const res = await apiClient.get<ApiResponse<{ cart: ServerCart }>>('/cart');
    return res.data.cart;
  },

  /**
   * Add item to cart
   */
  addCartItem: async (payload: CartItemPayload): Promise<ServerCart> => {
    const res = await apiClient.post<ApiResponse<{ cart: ServerCart }>>('/cart/items', payload);
    return res.data.cart;
  },

  /**
   * Update item quantity
   */
  updateCartItem: async (itemId: string, quantity: number): Promise<ServerCart> => {
    const res = await apiClient.patch<ApiResponse<{ cart: ServerCart }>>(`/cart/items/${itemId}`, {
      quantity,
    });
    return res.data.cart;
  },

  /**
   * Remove item from cart
   */
  removeCartItem: async (itemId: string): Promise<ServerCart> => {
    const res = await apiClient.delete<ApiResponse<{ cart: ServerCart }>>(`/cart/items/${itemId}`);
    return res.data.cart;
  },

  /**
   * Clear all items
   */
  clearCart: async (): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>('/cart');
  },

  /**
   * Merge local cart into server cart
   */
  mergeCart: async (items: CartItemPayload[]): Promise<ServerCart> => {
    const res = await apiClient.post<ApiResponse<{ cart: ServerCart }>>('/cart/merge', { items });
    return res.data.cart;
  },
};
