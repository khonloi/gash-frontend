import { useState, useMemo, useTransition } from 'react';
import { FrontendProduct } from '@/types/product';
import { FilterState, FilterCategory } from '@/components/ui/FilterSidebar/FilterSidebar';
import { SITE_CONFIG } from '@/constants/site';

export interface UseCollectionFiltersOptions {
  products: FrontendProduct[];
  slug: string;
  initialQuery?: string;
  pageSize?: number;
}

export function useCollectionFilters({
  products,
  slug,
  initialQuery = '',
  pageSize = SITE_CONFIG.defaultPageSize,
}: UseCollectionFiltersOptions) {
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const [sortValue, setSortValue] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Capitalize slug for display
  const displayTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : slug
      ? slug.charAt(0).toUpperCase() + slug.slice(1)
      : 'Collection';

  // Pre-filter products based on collection slug and search query
  const collectionProducts = useMemo(() => {
    let result = products;

    if (slug && slug.toLowerCase() !== 'all' && slug.toLowerCase() !== 'collection') {
      const s = slug.toLowerCase();
      result = result.filter(
        (p) =>
          p.category.toLowerCase().includes(s) ||
          p.gender.toLowerCase() === s ||
          p.brand.toLowerCase().replace(/\s+/g, '-') === s
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [products, slug, searchQuery]);

  // Dynamically generate filter categories based on the current collection's products
  const dynamicFilterCategories = useMemo<FilterCategory[]>(() => {
    const brands = Array.from(new Set(collectionProducts.map((p) => p.brand))).filter(Boolean);
    const categories = Array.from(new Set(collectionProducts.map((p) => p.category))).filter(
      Boolean
    );
    const genders = Array.from(new Set(collectionProducts.map((p) => p.gender))).filter(Boolean);
    const sizes = Array.from(new Set(collectionProducts.flatMap((p) => p.sizes))).filter(Boolean);
    const colors = Array.from(new Set(collectionProducts.flatMap((p) => p.colors))).filter(Boolean);

    return [
      {
        id: 'gender',
        title: 'Gender',
        type: 'checkbox',
        options: genders.map((g) => ({ id: g, label: g })),
      },
      {
        id: 'brand',
        title: 'Brand',
        type: 'checkbox',
        options: brands.map((b) => ({ id: b, label: b })),
      },
      {
        id: 'category',
        title: 'Product Type',
        type: 'checkbox',
        options: categories.map((c) => ({ id: c, label: c })),
      },
      {
        id: 'size',
        title: 'Size',
        type: 'checkbox',
        options: sizes.map((s) => ({ id: s, label: s })),
      },
      {
        id: 'color',
        title: 'Color',
        type: 'checkbox',
        options: colors.map((c) => ({ id: c, label: c })),
      },
    ];
  }, [collectionProducts]);

  const handleFilterChange = (categoryId: string, optionId: string) => {
    startTransition(() => {
      setCurrentPage(1);
      setActiveFilters((prev) => {
        const currentCategoryFilters = prev[categoryId] || [];
        const isSelected = currentCategoryFilters.includes(optionId);

        let newFilters;
        if (isSelected) {
          newFilters = currentCategoryFilters.filter((id) => id !== optionId);
        } else {
          newFilters = [...currentCategoryFilters, optionId];
        }

        return {
          ...prev,
          [categoryId]: newFilters,
        };
      });
    });
  };

  const handleSortChange = (value: string) => {
    startTransition(() => {
      setSortValue(value);
      setCurrentPage(1);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setActiveFilters({});
      setSearchQuery('');
      setCurrentPage(1);
    });
  };

  // Filter products based on active filters
  const filteredProducts = useMemo(() => {
    return collectionProducts.filter((product) => {
      if (activeFilters.gender?.length) {
        if (!activeFilters.gender.includes(product.gender)) return false;
      }
      if (activeFilters.brand?.length) {
        if (!activeFilters.brand.includes(product.brand)) return false;
      }
      if (activeFilters.category?.length) {
        if (!activeFilters.category.includes(product.category)) return false;
      }
      if (activeFilters.size?.length) {
        if (!activeFilters.size.some((size) => product.sizes.includes(size))) return false;
      }
      if (activeFilters.color?.length) {
        if (!activeFilters.color.some((color) => product.colors.includes(color))) return false;
      }
      return true;
    });
  }, [collectionProducts, activeFilters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortValue) {
        case 'price_asc':
          return a.salePrice - b.salePrice;
        case 'price_desc':
          return b.salePrice - a.salePrice;
        case 'best_selling':
          return (b.discountPercent || 0) - (a.discountPercent || 0);
        default:
          return 0;
      }
    });
  }, [filteredProducts, sortValue]);

  const totalPages = Math.ceil(sortedProducts.length / pageSize);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    startTransition(() => {
      setCurrentPage(page);
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 280, behavior: 'smooth' });
    }
  };

  return {
    isPending,
    searchQuery,
    setSearchQuery,
    activeFilters,
    sortValue,
    viewMode,
    setViewMode,
    currentPage,
    displayTitle,
    collectionProducts,
    dynamicFilterCategories,
    filteredProducts,
    sortedProducts,
    totalPages,
    paginatedProducts,
    handleFilterChange,
    handleSortChange,
    handleClearFilters,
    handlePageChange,
  };
}
