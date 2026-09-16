import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductByHandle, fetchFeaturedProducts } from '@/services/productService';
import { FrontendProduct } from '@/types/product';
import { QueryParams } from '@/lib/apiClient';

export const productKeys = {
  all: ['products'] as const,
  list: (params?: QueryParams) => ['products', 'list', params] as const,
  featured: (limit?: number) => ['products', 'featured', limit] as const,
  detail: (handleOrId: string) => ['products', 'detail', handleOrId] as const,
};

/**
 * Hook to fetch all products using TanStack Query
 * Supports both signatures:
 * - useProductsQuery(initialData)
 * - useProductsQuery(params, initialData)
 */
export function useProductsQuery(
  paramsOrInitialData?: QueryParams | FrontendProduct[],
  maybeInitialData?: FrontendProduct[]
) {
  const isArray = Array.isArray(paramsOrInitialData);
  const params = isArray ? undefined : paramsOrInitialData;
  const initialData = isArray ? paramsOrInitialData : maybeInitialData;

  return useQuery({
    queryKey: params ? productKeys.list(params) : productKeys.all,
    queryFn: () => fetchProducts(params),
    initialData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch featured products
 */
export function useFeaturedProductsQuery(limit = 10, initialData?: FrontendProduct[]) {
  return useQuery({
    queryKey: productKeys.featured(limit),
    queryFn: () => fetchFeaturedProducts(limit),
    initialData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single product by handle or ID using TanStack Query
 */
export function useProductByHandleQuery(
  handleOrId: string,
  initialData?: FrontendProduct | null
) {
  return useQuery({
    queryKey: productKeys.detail(handleOrId),
    queryFn: () => fetchProductByHandle(handleOrId),
    initialData: initialData ?? undefined,
    enabled: Boolean(handleOrId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
