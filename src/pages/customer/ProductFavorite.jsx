import React, { useEffect, useRef } from "react";
import ProductCard, { ProductCardSkeleton } from "../../features/products/components/ProductCard";
import Button from "../../components/ui/Button";
import ConfirmationModal from "../../features/orders/components/ConfirmationModal";
import { useFavorites } from "../../features/products/hooks/useFavorites";

const ProductFavorite = () => {
  const {
    user,
    favorites,
    filteredFavorites,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    showDeleteConfirm,
    setShowDeleteConfirm,
    favoriteToDelete,
    setFavoriteToDelete,
    handleDeleteFavoriteClick,
    handleDeleteFavorite,
    handleProductClick,
    handleKeyDown,
    handleRetry
  } = useFavorites();

  // Focus error notification
  const errorRef = useRef(null);
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  return (
    <div className="page-container page-container-centered">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-sm border border-gray-200">
        <header className="mb-4">
          <h1 className="text-xl sm:text-2xl font-normal mb-2 m-0">Your Favorite Products</h1>
        </header>

        {/* Search Bar */}
        {!loading && favorites.length > 0 && (
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
                      aria-label="Search favorite products"
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
            <Button
              variant="default"
              size="sm"
              onClick={handleRetry}
              disabled={loading}
              className="text-blue-600"
              aria-label="Retry loading favorites"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Product Grid Section - Always visible */}
        {!loading && favorites.length === 0 && !error && !searchQuery && (
          <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center gap-4" role="status">
            <p>No favorite products found.</p>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/products")}
              className="text-blue-600"
            >
              Browse Products
            </Button>
          </div>
        )}

        {!loading && filteredFavorites.length === 0 && searchQuery && (
          <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center gap-4" role="status">
            <p className="text-gray-500 italic text-lg">No products match your search</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your search criteria
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-blue-600"
            >
              Clear Search
            </Button>
          </div>
        )}

        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
          role="grid"
          aria-label={loading ? "Loading favorites" : `${filteredFavorites.length} favorite products`}
        >
          {loading ? (
            [...Array(8)].map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          ) : (
            filteredFavorites.map((favorite) => {
              if (!favorite.productId) {
                return null; // Skip rendering if productId is missing
              }
              const product = favorite.productId;
              return (
                <ProductCard
                  key={favorite._id}
                  product={product}
                  isFavorite={true}
                  favoriteId={favorite._id}
                  handleProductClick={handleProductClick}
                  handleKeyDown={handleKeyDown}
                  handleRemoveFavorite={handleDeleteFavoriteClick}
                />
              );
            })
          )}
        </div>
      </section>

      {/* Confirmation Modal for Removing Favorite */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Remove from Favorites"
        message={
          favoriteToDelete?.favorite?.productId
            ? `Are you sure you want to remove "${favoriteToDelete.favorite.productId.productName || "this product"}" from your favorites?`
            : "Are you sure you want to remove this product from your favorites?"
        }
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteFavorite}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setFavoriteToDelete(null);
        }}
      />
    </div>
  );
};

export default ProductFavorite;