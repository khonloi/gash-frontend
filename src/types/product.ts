export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  inventoryQuantity: number;
  imageUrl: string | null;
  options: any;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  tags: string[];
  options: any; // e.g., ["Size", "Color"]
  status: string;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
}

export interface FrontendProduct {
  id: string;
  brand: string;
  title: string;
  price: number;
  salePrice: number;
  originalPrice: number;
  discountPercent: number | null;
  imageUrl: string;
  category: string;
  gender: string;
  size: string;
  sizes: string[];
  color: string;
  colors: string[];
  sku: string;
  handle: string;
  description: string;
  specs: Record<string, string>;
  images: string[];
  isNew?: boolean;
}
