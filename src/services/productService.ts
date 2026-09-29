import { cache } from 'react';
import { apiClient, QueryParams } from '@/lib/apiClient';
import {
  FrontendProduct,
  BackendProduct,
  BackendProductImage,
  ProductCategoryStats,
} from '@/types/product';
import { ApiResponse, PaginatedApiResponse } from '@/types/api';

/**
 * Maps the backend Product model to the FrontendProduct model consumed across UI
 */
export function mapProductToFrontend(
  raw: BackendProduct | (Partial<BackendProduct> & { _id?: string; id?: string })
): FrontendProduct {
  if (!raw) {
    throw new Error('Cannot map empty product data');
  }

  const id = raw._id || raw.id || '';
  const title = raw.name || raw.title || '';
  const handle = raw.slug || raw.handle || id;
  const brand = raw.brand || raw.vendor || 'JOCKSPORTS';
  const category = raw.category || raw.productType || 'Sportswear';

  // Extract images
  let images: string[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images
      .map((img) => (typeof img === 'string' ? img : img.url))
      .filter((url): url is string => Boolean(url));
  } else if (Array.isArray(raw.variants)) {
    images = raw.variants
      .map((variant) => variant.featuredImage?.src || variant.imageUrl || '')
      .filter((url): url is string => Boolean(url));
  }

  // Find primary image if available
  let primaryImg = '';
  if (Array.isArray(raw.images)) {
    const primaryObj = raw.images.find(
      (img): img is BackendProductImage =>
        typeof img === 'object' && img !== null && Boolean(img.isPrimary)
    );
    if (primaryObj?.url) {
      primaryImg = primaryObj.url;
    }
  }

  const defaultImage = primaryImg || (images.length > 0 ? images[0] : '');

  // Calculate pricing
  const salePrice = typeof raw.price === 'number' ? raw.price : Number(raw.price || 0);
  const compareAtPrice =
    typeof raw.compareAtPrice === 'number' ? raw.compareAtPrice : Number(raw.compareAtPrice || 0);
  const originalPrice = compareAtPrice > salePrice ? compareAtPrice : salePrice;

  let discountPercent: number | null = null;
  if (typeof raw.discountPercentage === 'number' && raw.discountPercentage > 0) {
    discountPercent = raw.discountPercentage;
  } else if (originalPrice > salePrice) {
    discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }

  // Extract sizes and colors from backend variants or legacy variants
  const sizesSet = new Set<string>();
  const colorsSet = new Set<string>();

  if (Array.isArray(raw.variants)) {
    raw.variants.forEach((v) => {
      if (!v) return;

      // Backend structured format: variant.name = "Size" | "Color" and variant.options = ["S", "M", ...]
      if (typeof v.name === 'string' && Array.isArray(v.options)) {
        const lowerName = v.name.toLowerCase();
        if (lowerName.includes('size') || lowerName.includes('kích')) {
          v.options.forEach((opt) => typeof opt === 'string' && sizesSet.add(opt));
        } else if (lowerName.includes('color') || lowerName.includes('màu')) {
          v.options.forEach((opt) => typeof opt === 'string' && colorsSet.add(opt));
        } else {
          v.options.forEach((opt) => typeof opt === 'string' && sizesSet.add(opt));
        }
      }

      // Legacy Shopify-compatible format: option1, option2, option3
      if (typeof v.option1 === 'string') colorsSet.add(v.option1);
      if (typeof v.option2 === 'string') sizesSet.add(v.option2);
      if (typeof v.option3 === 'string') sizesSet.add(v.option3);
    });
  }

  const sizes = Array.from(sizesSet);
  const colors = Array.from(colorsSet);

  // Determine gender from tags
  let gender = 'Unisex';
  const tags: string[] = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === 'string')
    : [];
  const lowerTags = tags.map((t) => t.toLowerCase());

  if (
    lowerTags.some((t) => t === 'nữ' || t === 'women' || t === "women's" || t.includes('women'))
  ) {
    gender = 'Women';
  } else if (
    lowerTags.some(
      (t) =>
        t === 'nam' || t === 'men' || t === "men's" || (t.includes('men') && !t.includes('women'))
    )
  ) {
    gender = 'Men';
  } else if (
    lowerTags.some((t) => t.includes('trẻ em') || t.includes('kids') || t.includes('kid'))
  ) {
    gender = 'Kids';
  }

  const sku = raw.sku || '';
  const desc = raw.description || raw.bodyHtml || '';

  // Build structured specifications
  const structuredSpecs: Record<string, string> = {
    Brand: brand,
    'Product Type': category,
    Category: category,
    Gender: gender,
    'SKU / Style Code': sku || id,
  };

  if (colors.length > 0) {
    structuredSpecs['Colorway'] = colors.join(', ');
  }
  if (sizes.length > 0) {
    structuredSpecs['Available Sizes'] = sizes.join(', ');
  }
  if (typeof raw.ratingsAverage === 'number') {
    structuredSpecs['Rating'] = `${raw.ratingsAverage} / 5.0`;
  }

  // Add backend attributes map if provided
  if (raw.attributes && typeof raw.attributes === 'object') {
    Object.entries(raw.attributes).forEach(([key, val]) => {
      if (typeof val === 'string') {
        structuredSpecs[key] = val;
      }
    });
  }

  // Extract specs from HTML description if present
  if (desc.includes('<li>')) {
    const liMatches = Array.from(desc.matchAll(/<li>(.*?)<\/li>/gi));
    liMatches.forEach((match: RegExpMatchArray, idx: number) => {
      const text = match[1].replace(/<[^>]*>/g, '').trim();
      if (text.includes(':')) {
        const [k, ...rest] = text.split(':');
        const keyTrimmed = k.trim();
        const valTrimmed = rest.join(':').trim();
        if (keyTrimmed && valTrimmed && !structuredSpecs[keyTrimmed]) {
          structuredSpecs[keyTrimmed] = valTrimmed;
        }
      } else if (text.length > 0 && idx < 5) {
        structuredSpecs[`Feature ${idx + 1}`] = text;
      }
    });
  }

  structuredSpecs['Authenticity'] = '100% Genuine & Authentic Partner';
  structuredSpecs['Exchange Policy'] = '30-Day Hassle-Free Exchange Policy';

  const rawCreatedAt = raw.createdAt ?? null;
  const isNew = Boolean(
    raw.isFeatured ||
    (rawCreatedAt && Date.now() - new Date(rawCreatedAt).getTime() < 30 * 24 * 60 * 60 * 1000)
  );

  return {
    id,
    handle,
    brand,
    title,
    price: salePrice,
    salePrice,
    originalPrice,
    discountPercent,
    imageUrl: defaultImage,
    category,
    gender,
    size: sizes.length > 0 ? sizes[0] : '',
    sizes,
    color: colors.length > 0 ? colors[0] : '',
    colors,
    sku,
    description: desc,
    specs: structuredSpecs,
    images: images.length > 0 ? images : [defaultImage].filter(Boolean),
    isNew,
  };
}

/**
 * Fetch all products from backend with optional filters and search
 */
export const fetchProducts = cache(async (params?: QueryParams): Promise<FrontendProduct[]> => {
  try {
    const response = await apiClient.get<
      | ApiResponse<{ products: BackendProduct[] }>
      | PaginatedApiResponse<{ products: BackendProduct[] }>
      | BackendProduct[]
    >('/products', { params });

    let products: BackendProduct[] = [];
    if (response && 'data' in response && response.data && 'products' in response.data) {
      products = response.data.products;
    } else if (Array.isArray(response)) {
      products = response;
    }

    return products.map(mapProductToFrontend);
  } catch (error) {
    console.warn(
      'Could not fetch products from backend:',
      error instanceof Error ? error.message : error
    );
    return [];
  }
});

/**
 * Fetch a single product by its slug or MongoDB ID
 */
export const fetchProductByHandle = cache(
  async (handleOrId: string): Promise<FrontendProduct | null> => {
    try {
      // 1) Try fetching by slug first
      try {
        const res = await apiClient.get<ApiResponse<{ product: BackendProduct }>>(
          `/products/slug/${encodeURIComponent(handleOrId)}`
        );

        if (res?.data?.product) {
          return mapProductToFrontend(res.data.product);
        }
      } catch (slugError: unknown) {
        // If 404, fallback to ID lookup
        const status = (slugError as { status?: number })?.status;
        if (status !== 404) {
          console.warn(`Slug lookup failed for ${handleOrId}, trying ID lookup...`);
        }
      }

      // 2) Fallback to fetching by ID
      const resById = await apiClient.get<ApiResponse<{ product: BackendProduct }>>(
        `/products/${encodeURIComponent(handleOrId)}`
      );

      if (resById?.data?.product) {
        return mapProductToFrontend(resById.data.product);
      }

      return null;
    } catch (error) {
      console.warn(
        `Could not fetch product ${handleOrId} from backend:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
);

/**
 * Fetch featured products from backend
 */
export const fetchFeaturedProducts = cache(async (limit = 10): Promise<FrontendProduct[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ products: BackendProduct[] }>>(
      '/products/featured',
      { params: { limit } }
    );

    const products = response?.data?.products || [];
    return products.map(mapProductToFrontend);
  } catch (error) {
    console.warn(
      'Could not fetch featured products from backend:',
      error instanceof Error ? error.message : error
    );
    return [];
  }
});

/**
 * Fetch product statistics (categories, counts, etc.)
 */
export const fetchProductStats = cache(async (): Promise<ProductCategoryStats[]> => {
  try {
    const response =
      await apiClient.get<ApiResponse<{ stats: ProductCategoryStats[] }>>('/products/stats');

    return response?.data?.stats || [];
  } catch (error) {
    console.warn(
      'Could not fetch product stats from backend:',
      error instanceof Error ? error.message : error
    );
    return [];
  }
});
