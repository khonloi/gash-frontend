import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApiService } from '@/services/cartService';
import { useAuthStore } from './useAuthStore';
import { ServerCartItem, CartItemPayload } from '@/types/cart';
import { getErrorMessage } from '@/lib/errors';

export interface CartItem {
  id: string; // Unique identifier (productId + size + color)
  serverItemId?: string; // The subdocument _id from backend
  productId: string;
  title: string;
  brand: string;
  price: number;
  imageUrl: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartState {
  items: CartItem[];
  syncing: boolean;
  syncError: string | null;
  addItem: (item: Omit<CartItem, 'id' | 'serverItemId'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  syncCartFromServer: () => Promise<void>;
  mergeAndSync: () => Promise<void>;
}

const mapServerToLocal = (serverItems: ServerCartItem[]): CartItem[] => {
  return serverItems.map((sItem) => {
    const product = sItem.product;
    const defaultImage =
      product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || '';

    return {
      id: `${product._id}-${sItem.size || 'default'}-${sItem.color || 'default'}`,
      serverItemId: sItem._id,
      productId: product._id,
      title: product.name,
      brand: product.brand || 'JOCKSPORTS',
      price: sItem.priceAtAdd,
      imageUrl: defaultImage,
      quantity: sItem.quantity,
      size: sItem.size,
      color: sItem.color,
    };
  });
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      syncing: false,
      syncError: null,

      addItem: async (item) => {
        const id = `${item.productId}-${item.size || 'default'}-${item.color || 'default'}`;
        const prevItems = get().items;

        // Optimistic UI update
        set((state) => {
          const existingItem = state.items.find((i) => i.id === id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, id }] };
        });

        // Sync to backend if authenticated
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated) {
          set({ syncing: true, syncError: null });
          try {
            const serverCart = await cartApiService.addCartItem({
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
            });
            set({ items: mapServerToLocal(serverCart.items), syncing: false });
          } catch (error: unknown) {
            set({
              items: prevItems,
              syncError: getErrorMessage(error) || 'Failed to sync cart',
              syncing: false,
            });
          }
        }
      },

      removeItem: async (id) => {
        const prevItems = get().items;
        const itemToRemove = prevItems.find((i) => i.id === id);
        if (!itemToRemove) return;

        // Optimistic UI update
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));

        const auth = useAuthStore.getState();
        if (auth.isAuthenticated && itemToRemove.serverItemId) {
          set({ syncing: true, syncError: null });
          try {
            const serverCart = await cartApiService.removeCartItem(itemToRemove.serverItemId);
            set({ items: mapServerToLocal(serverCart.items), syncing: false });
          } catch (error: unknown) {
            set({
              items: prevItems,
              syncError: getErrorMessage(error) || 'Failed to remove item on server',
              syncing: false,
            });
          }
        }
      },

      updateQuantity: async (id, quantity) => {
        const prevItems = get().items;
        const itemToUpdate = prevItems.find((i) => i.id === id);
        if (!itemToUpdate) return;
        const validQty = Math.max(1, quantity);

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: validQty } : item
          ),
        }));

        const auth = useAuthStore.getState();
        if (auth.isAuthenticated && itemToUpdate.serverItemId) {
          set({ syncing: true, syncError: null });
          try {
            const serverCart = await cartApiService.updateCartItem(
              itemToUpdate.serverItemId,
              validQty
            );
            set({ items: mapServerToLocal(serverCart.items), syncing: false });
          } catch (error: unknown) {
            set({
              items: prevItems,
              syncError: getErrorMessage(error) || 'Failed to update quantity on server',
              syncing: false,
            });
          }
        }
      },

      clearCart: async () => {
        const prevItems = get().items;
        set({ items: [] });
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated) {
          set({ syncing: true, syncError: null });
          try {
            await cartApiService.clearCart();
            set({ syncing: false });
          } catch (error: unknown) {
            set({
              items: prevItems,
              syncError: getErrorMessage(error) || 'Failed to clear server cart',
              syncing: false,
            });
          }
        }
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      syncCartFromServer: async () => {
        set({ syncing: true, syncError: null });
        try {
          const serverCart = await cartApiService.getCart();
          set({ items: mapServerToLocal(serverCart.items), syncing: false });
        } catch (error: unknown) {
          set({ syncError: getErrorMessage(error) || 'Failed to fetch cart', syncing: false });
        }
      },

      mergeAndSync: async () => {
        const currentItems = get().items;
        set({ syncing: true, syncError: null });
        try {
          if (currentItems.length > 0) {
            const payload: CartItemPayload[] = currentItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
            }));
            const serverCart = await cartApiService.mergeCart(payload);
            set({ items: mapServerToLocal(serverCart.items), syncing: false });
          } else {
            const serverCart = await cartApiService.getCart();
            set({ items: mapServerToLocal(serverCart.items), syncing: false });
          }
        } catch (error: unknown) {
          set({ syncError: getErrorMessage(error) || 'Failed to merge cart', syncing: false });
        }
      },
    }),
    {
      name: 'jocksport-cart-storage',
      partialize: (state) => ({ items: state.items }), // Persist only items
    }
  )
);
