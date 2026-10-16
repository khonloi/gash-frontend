/**
 * Global site and application constants for gash-frontend.
 */

export const STORAGE_KEYS = {
  AUTH: 'jocksport-auth-storage',
  CART: 'jocksport-cart-storage',
  DEMO_MODE: 'jocksport-demo-mode',
} as const;

export const SITE_CONFIG = {
  name: 'GASH',
  brandName: 'JOCKSPORT',
  tagline: 'Official Athletic & Performance Sportswear',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://jocksport.com',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  internalApiUrl: process.env.INTERNAL_API_URL || 'http://localhost:5000/api/v1',
  defaultPageSize: 30,
} as const;
