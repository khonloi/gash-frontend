export type ProductStatus = 'draft' | 'active' | 'archived';

export interface BackendProductImage {
  url: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface BackendProductVariant {
  name: string;
  options: string[];
  sku?: string;
  priceModifier?: number;
  stock?: number;
}

export interface BackendProductDimensions {
  length?: number;
  width?: number;
  height?: number;
}

export interface BackendProduct {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  quantity: number;
  lowStockThreshold: number;
  category: string;
  subcategory?: string;
  brand?: string;
  tags: string[];
  images: BackendProductImage[];
  variants: BackendProductVariant[];
  attributes?: Record<string, string>;
  status: ProductStatus;
  isFeatured: boolean;
  weight?: number;
  dimensions?: BackendProductDimensions;
  ratingsAverage: number;
  ratingsQuantity: number;
  createdAt?: string;
  updatedAt?: string;
  isLowStock?: boolean;
  isOnSale?: boolean;
  discountPercentage?: number;
}

// Legacy Shopify-compatible format (retained for backward compatibility)
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

// Legacy Product interface or BackendProduct union
export interface Product {
  id: string;
  _id?: string;
  handle?: string;
  slug?: string;
  title?: string;
  name?: string;
  vendor?: string;
  brand?: string;
  tags?: string[];
  productType?: string;
  category?: string;
  bodyHtml?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  images?: string[] | BackendProductImage[];
  options?: Record<string, unknown> | string[] | null;
  status?: string;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariant[] | BackendProductVariant[];
}

// Unified model consumed across the UI components (ProductCard, PDP, collections, etc.)
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
