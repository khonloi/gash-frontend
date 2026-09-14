'use client';

import React, { useState, useMemo } from 'react';
import {
  Breadcrumb,
  FilterSidebar,
  CollectionControlBar,
  ProductCard,
  Pagination,
  EmptyState,
  Button,
} from '@/components/ui';
import {
  FilterState,
  FilterCategory,
} from '@/components/ui/FilterSidebar/FilterSidebar';
import { FrontendProduct } from '@/types/product';
import { useProductsQuery } from '@/hooks/useProducts';
import styles from '@/app/collections/[slug]/page.module.css';

const ITEMS_PER_PAGE = 30;

interface CollectionClientViewProps {
  initialProducts: FrontendProduct[];
  slug: string;
}

export function CollectionClientView({
  initialProducts,
  slug,
}: CollectionClientViewProps) {
  const { data: products = initialProducts } = useProductsQuery(initialProducts);

  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const [sortValue, setSortValue] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Capitalize slug for display
  const displayTitle = slug
    ? slug.charAt(0).toUpperCase() + slug.slice(1)
    : 'Collection';

  // Pre-filter products based on collection slug
  const collectionProducts = useMemo(() => {
    if (!slug || slug.toLowerCase() === 'all' || slug.toLowerCase() === 'collection') {
      return products;
    }
    const s = slug.toLowerCase();
    return products.filter(
      (p) =>
        p.category.toLowerCase().includes(s) ||
        p.gender.toLowerCase() === s ||
        p.brand.toLowerCase().replace(' ', '-') === s
    );
  }, [products, slug]);

  // Dynamically generate filter categories based on the current collection's products
  const dynamicFilterCategories = useMemo<FilterCategory[]>(() => {
    const brands = Array.from(new Set(collectionProducts.map((p) => p.brand))).filter(Boolean);
    const categories = Array.from(new Set(collectionProducts.map((p) => p.category))).filter(Boolean);
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
  };

  const handleSortChange = (value: string) => {
    setSortValue(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setCurrentPage(1);
  };

  // Filter products based on active filters
  const filteredProducts = collectionProducts.filter((product) => {
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
      if (!activeFilters.size.some((size) => product.sizes.includes(size)))
        return false;
    }
    if (activeFilters.color?.length) {
      if (!activeFilters.color.some((color) => product.colors.includes(color)))
        return false;
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
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

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 280, behavior: 'smooth' });
    }
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Collections', href: '/collections/all' },
    { label: displayTitle },
  ];

  return (
    <main className={styles.pageContainer}>
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        {/* Collection Hero */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>{displayTitle}</h1>
          <p className={styles.heroDescription}>
            Discover our curated {displayTitle.toLowerCase()} collection. Everything you need to focus, breathe, and flow comfortably.
            From high-performance gear to breathable activewear.
          </p>
        </div>

        <div className={styles.contentLayout}>
          <div className={styles.sidebarWrapper}>
            <FilterSidebar
              categories={dynamicFilterCategories}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div className={styles.mainContent}>
            <CollectionControlBar
              totalCount={sortedProducts.length}
              sortValue={sortValue}
              onSortChange={handleSortChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {sortedProducts.length === 0 ? (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters to see more results."
                action={
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <>
                <div
                  className={`${styles.productGrid} ${
                    viewMode === 'list' ? styles.listMode : ''
                  }`}
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      handle={product.handle}
                      brand={product.brand}
                      title={product.title}
                      originalPrice={product.originalPrice}
                      salePrice={product.salePrice}
                      discountPercent={product.discountPercent ?? undefined}
                      imageUrl={product.imageUrl}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={sortedProducts.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
