import React from "react";
import ProductCard, { ProductCardSkeleton } from "../ProductCard";

/**
 * Recommendations and recently viewed products grid sections for ProductDetail page.
 */
export default function ProductRecommendations({
  forYouProducts = [],
  recentlyViewed = [],
  productsLoading = false,
  onProductClick,
  onKeyDown,
}) {
  return (
    <>
      {/* For You Section */}
      <section className="w-full mt-6 sm:mt-8 md:mt-10 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
        <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">
          For You
        </h2>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
          role="grid"
          aria-label={
            productsLoading
              ? "Loading products"
              : `${forYouProducts.length} personalized products`
          }
        >
          {productsLoading
            ? [...Array(5)].map((_, index) => <ProductCardSkeleton key={index} />)
            : forYouProducts.map((prod) => (
                <ProductCard
                  key={prod._id}
                  product={prod}
                  handleProductClick={onProductClick}
                  handleKeyDown={onKeyDown}
                />
              ))}
        </div>
      </section>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section className="w-full mt-6 sm:mt-8 md:mt-10 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">
            Recently Viewed
          </h2>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
            role="grid"
            aria-label={`${recentlyViewed.length} recently viewed products`}
          >
            {recentlyViewed.map((prod) => (
              <ProductCard
                key={prod._id}
                product={prod}
                handleProductClick={onProductClick}
                handleKeyDown={onKeyDown}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
