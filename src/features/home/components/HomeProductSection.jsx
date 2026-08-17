import React from "react";
import ProductCard, { ProductCardSkeleton } from "../../products/components/ProductCard";
import { ArrowRight } from "lucide-react";

export default function HomeProductSection({
  title,
  subtitle,
  products = [],
  loading = false,
  handleProductClick,
  handleKeyDown,
  onViewAll,
  maxItems = 5,
}) {
  if (!loading && products.length === 0) return null;

  const displayProducts = products.slice(0, maxItems);

  return (
    <section className="w-full mt-10 bg-white rounded-2xl p-5 sm:p-6 md:p-8 shadow-xs border border-gray-100">
      <div className="flex items-center justify-between mb-5 sm:mb-7">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 bg-brand-primary-500 rounded-full inline-block" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1 pl-4">{subtitle}</p>}
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100/80 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
            aria-label={`View all ${title}`}
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
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
