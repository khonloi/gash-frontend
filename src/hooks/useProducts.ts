import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductByHandle } from '@/services/productService';
import { FrontendProduct } from '@/types/product';

export const productKeys = {
  all: ['products'] as const,
  detail: (handleOrId: string) => ['products', handleOrId] as const,
};

/**
 * Hook to fetch all products using TanStack Query
 */
export function useProductsQuery(initialData?: FrontendProduct[]) {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: fetchProducts,
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
