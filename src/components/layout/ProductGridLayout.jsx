import React, { useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard, { ProductCardSkeleton } from "../../features/products/components/ProductCard";
import ProductFilters from "./ProductFilters";
import ProductSortDropdown from "./ProductSortDropdown";
import Button from "../ui/Button";
import { formatPrice } from "../../utils/formatters";
import { useProductGridFilter } from "./hooks/useProductGridFilter";

const ProductGridLayout = ({
  title,
  rawProducts = [],
  variants = [],
  loading = false,
  error = null,
  onRetry,
  isFavoritesPage = false,
  syncToUrl = true,
  handleRemoveFavorite,
  showSearch = true,
}) => {
  const navigate = useNavigate();

  const {
    selectedCategory,
    selectedColor,
    selectedSize,
    minPrice,
    maxPrice,
    sortBy,
    showMobileFilters,
    setShowMobileFilters,
    searchQuery,
    setSearchQuery,
    isFiltering,
    productsList,
    categoriesList,
    colorsList,
    sizesList,
    priceRange,
    activeProducts,
    handleFilterChange,
    clearAllFilters,
    hasActiveFilters,
  } = useProductGridFilter({
    rawProducts,
    variants,
    isFavoritesPage,
    syncToUrl,
  });

  // Focus error notification
  const errorRef = useRef(null);
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleProductClick = useCallback(
    (id) => {
      if (!id) return;
      navigate(`/product/${id}`);
    },
    [navigate]
  );

  const handleKeyDown = useCallback(
    (e, id) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleProductClick(id);
      }
    },
    [handleProductClick]
  );

  return (
    <div className="page-container flex flex-col md:flex-row">
      {/* Sidebar Filters */}
      <ProductFilters
        categoriesList={categoriesList}
        colorsList={colorsList}
        sizesList={sizesList}
        selectedCategory={selectedCategory}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        minPrice={minPrice}
        maxPrice={maxPrice}
        priceRange={priceRange}
        handleFilterChange={handleFilterChange}
        clearAllFilters={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
        showMobileFilters={showMobileFilters}
        setShowMobileFilters={setShowMobileFilters}
        formatPrice={formatPrice}
      />

      {/* Main Grid Content */}
      <main className="flex-1 px-0 md:px-4 min-w-0" role="main">
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <header className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
              <h1 className="text-xl sm:text-2xl font-normal m-0">{title}</h1>
              <ProductSortDropdown
                sortBy={sortBy}
                onSortChange={(val) => handleFilterChange("sortBy", val)}
              />
            </div>
            {activeProducts.length > 0 && !loading && !isFiltering && (
              <p className="text-sm text-gray-600 mb-4">
                Showing {activeProducts.length} product{activeProducts.length !== 1 ? "s" : ""}
                {hasActiveFilters && " matching your filters"}
              </p>
            )}
          </header>

          {/* Optional Search Bar */}
          {showSearch && !loading && productsList.length > 0 && (
            <div className="mb-4 sm:mb-5 md:mb-6">
              <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <legend className="text-sm sm:text-base font-semibold m-0">Search</legend>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by product name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 pl-10 border-2 border-gray-300 rounded-md bg-white text-xs sm:text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                        aria-label="Search products"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {searchQuery && (
                    <div className="flex items-end">
                      <Button
                        variant="default"
                        size="md"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </fieldset>
            </div>
          )}

          {error && (
            <div
              ref={errorRef}
              className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap"
              role="alert"
              tabIndex={0}
              aria-live="polite"
            >
              <span className="text-lg" aria-hidden="true">⚠</span>
              {error}
              {onRetry && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onRetry}
                  disabled={loading}
                  className="text-blue-600"
                  aria-label="Retry loading"
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          {/* Product Grid Section - Always visible */}
          {!loading && !isFiltering && activeProducts.length === 0 && !error && (
            <div
              className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center"
              role="status"
            >
              <p>No products found matching the criteria</p>
              {hasActiveFilters && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-blue-600"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
            role="grid"
            aria-label={loading || isFiltering ? "Loading products" : `${activeProducts.length} products`}
          >
            {loading || isFiltering
              ? [...Array(8)].map((_, index) => <ProductCardSkeleton key={index} />)
              : activeProducts.map((item) => (
                  <ProductCard
                    key={item._id}
                    product={item}
                    isFavorite={item.isFavorite || false}
                    favoriteId={item.favoriteId}
                    handleProductClick={handleProductClick}
                    handleKeyDown={handleKeyDown}
                    handleRemoveFavorite={handleRemoveFavorite}
                  />
                ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProductGridLayout;
