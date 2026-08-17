import React from "react";
import ProductCard, { ProductCardSkeleton } from "../../products/components/ProductCard";

export default function HomeProductSection({
  title,
  subtitle,
  products = [],
  loading = false,
  handleProductClick,
  handleKeyDown,
  viewAllLink,
  onViewAll,
  maxItems = 5,
}) {
  if (!loading && products.length === 0) return null;

  const displayProducts = products.slice(0, maxItems);

  return (
    <section className="w-full mt-8 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs sm:text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            aria-label={`View all ${title}`}
          >
            View All →
          </button>
        )}
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
        role="grid"
        aria-label={loading ? `Loading ${title}` : `${displayProducts.length} items for ${title}`}
      >
        {loading ? (
          [...Array(maxItems)].map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))
        ) : (
          displayProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              handleProductClick={handleProductClick}
              handleKeyDown={handleKeyDown}
            />
          ))
        )}
      </div>
    </section>
  );
}
