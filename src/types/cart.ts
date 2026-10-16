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

/**
 * Generate a consistent unique identifier for client cart items.
 */
export function getCartItemId(productId: string, size?: string, color?: string): string {
  return `${productId}-${size || 'default'}-${color || 'default'}`;
}

export interface CartItemPayload {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface ServerCartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: { url: string; isPrimary?: boolean }[];
    quantity: number;
    brand?: string;
  };
  quantity: number;
  size?: string;
  color?: string;
  priceAtAdd: number;
}

export interface ServerCart {
  _id: string;
  user: string;
  items: ServerCartItem[];
  createdAt: string;
  updatedAt: string;
}
