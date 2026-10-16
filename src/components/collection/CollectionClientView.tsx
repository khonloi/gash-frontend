'use client';

import React from 'react';
import {
  Breadcrumb,
  FilterSidebar,
  CollectionControlBar,
  ProductCard,
  Pagination,
  EmptyState,
  Button,
} from '@/components/ui';
import { FrontendProduct } from '@/types/product';
import { useProductsQuery } from '@/hooks/useProducts';
import { useCollectionFilters } from '@/hooks/useCollectionFilters';
import { SITE_CONFIG } from '@/constants/site';
import styles from '@/app/collections/[slug]/page.module.css';

interface CollectionClientViewProps {
  initialProducts: FrontendProduct[];
  slug: string;
  initialQuery?: string;
}

export function CollectionClientView({
  initialProducts,
  slug,
  initialQuery = '',
}: CollectionClientViewProps) {
  const {
    data: products = initialProducts,
    isError,
    error,
    refetch,
  } = useProductsQuery(initialProducts);

  const {
    isPending,
    activeFilters,
    sortValue,
    viewMode,
    setViewMode,
    currentPage,
    displayTitle,
    dynamicFilterCategories,
    sortedProducts,
    totalPages,
    paginatedProducts,
    handleFilterChange,
    handleSortChange,
    handleClearFilters,
    handlePageChange,
  } = useCollectionFilters({
    products,
    slug,
    initialQuery,
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Collections', href: '/collections/all' },
    { label: displayTitle },
  ];

  return (
    <main id="main-content" className={styles.pageContainer}>
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        {/* Collection Hero */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>{displayTitle}</h1>
          <p className={styles.heroDescription}>
            Discover our curated {displayTitle.toLowerCase()} collection. Everything you need to
            focus, breathe, and flow comfortably. From high-performance gear to breathable
            activewear.
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

            {isError && products.length === 0 ? (
              <EmptyState
                title="Failed to load collection"
                description={
                  error instanceof Error
                    ? error.message
                    : 'We could not load the products for this collection. Please check your connection.'
                }
                action={
                  <Button variant="primary" onClick={() => refetch()}>
                    Retry Loading
                  </Button>
                }
              />
            ) : sortedProducts.length === 0 ? (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters to see more results."
                action={
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <>
                <div
                  className={`${styles.productGrid} ${viewMode === 'list' ? styles.listMode : ''} ${
                    isPending ? styles.isPending : ''
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
                  itemsPerPage={SITE_CONFIG.defaultPageSize}
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
