import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ServerCartItem } from '@/types/cart';

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

export interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'serverItemId'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const mapServerToLocal = (serverItems: ServerCartItem[]): CartItem[] => {
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

      addItem: (item) => {
        const id = `${item.productId}-${item.size || 'default'}-${item.color || 'default'}`;
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
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        const validQty = Math.max(1, quantity);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: validQty } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      setItems: (items) => {
        set({ items });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'jocksport-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
