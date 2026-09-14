export interface ProductVariant {
  id?: string;
  productId?: string;
  title?: string;
  price?: number;
  compareAtPrice?: number | null;
  sku?: string | null;
  inventoryQuantity?: number;
  imageUrl?: string | null;
  featuredImage?: { src?: string };
  option1?: string;
  option2?: string;
  option3?: string;
  options?: Record<string, unknown> | string[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  handle?: string;
  title: string;
  vendor?: string;
  tags?: string[];
  productType?: string;
  bodyHtml?: string;
  images?: string[];
  options?: Record<string, unknown> | string[] | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariant[];
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
