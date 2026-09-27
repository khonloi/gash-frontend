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
