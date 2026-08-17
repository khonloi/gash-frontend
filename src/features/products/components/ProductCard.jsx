import React from "react";
import { Trash2 } from "lucide-react";
import { formatPrice } from "../../../utils/formatters";

// Helper function to get minimum price from product variants
const getMinPrice = (product) => {
  if (!product?.productVariantIds || product.productVariantIds.length === 0) {
    return 0;
  }
  const prices = product.productVariantIds
    .filter(v => v.variantStatus !== 'discontinued' && v.variantPrice > 0)
    .map(v => v.variantPrice);
  return prices.length > 0 ? Math.min(...prices) : 0;
};

// Helper function to get main image URL
const getMainImageUrl = (product) => {
  if (!product?.productImageIds || product.productImageIds.length === 0) {
    return "/placeholder-image.png";
  }
  const mainImage = product.productImageIds.find(img => img.isMain);
  return mainImage?.imageUrl || product.productImageIds[0]?.imageUrl || "/placeholder-image.png";
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "In Stock"
    },
    inactive: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Low Stock"
    },
    discontinued: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      label: "Sold Out"
    }
  };

  const config = statusConfig[status?.toLowerCase()] || {
    bg: "bg-gray-50 text-gray-700 border-gray-200",
    label: "Available"
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${config.bg}`}
    >
      {config.label}
    </span>
  );
};

// Loading Skeleton component
export const ProductCardSkeleton = () => {
  return (
    <article
      className="flex flex-col h-[18em] w-full max-w-[11.5em] sm:h-[21em] sm:max-w-[13.5em] border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-xs"
      aria-label="Loading product"
      role="gridcell"
    >
      {/* Image skeleton */}
      <div className="h-1/2 overflow-hidden animate-shimmer" />

      {/* Content skeleton */}
      <div className="h-1/2 p-3.5 sm:p-4 flex flex-col justify-between bg-white">
        <div className="space-y-2">
          <div className="h-4 rounded-md animate-shimmer w-full" />
          <div className="h-3 rounded-md animate-shimmer w-2/3" />
          <div className="h-4 rounded-full animate-shimmer w-16 mt-1" />
        </div>

        {/* Price skeleton */}
        <div className="h-5 rounded-md animate-shimmer w-20 mt-2" />
      </div>
    </article>
  );
};

const ProductCard = ({
  product,
  handleProductClick,
  handleKeyDown,
  isFavorite = false,
  favoriteId,
  handleRemoveFavorite,
  isSkeleton = false
}) => {
  if (isSkeleton) {
    return <ProductCardSkeleton />;
  }

  const minPrice = getMinPrice(product);
  const imageUrl = getMainImageUrl(product);

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    if (handleRemoveFavorite) {
      handleRemoveFavorite(favoriteId);
    }
  };

  return (
    <article
      className="group flex flex-col h-[18em] w-full max-w-[11.5em] sm:h-[21em] sm:max-w-[13.5em] border-2 border-gray-200 rounded-2xl overflow-hidden card-lift cursor-pointer bg-white relative focus:outline-none focus:ring-2 focus:ring-amber-500"
      onClick={() => handleProductClick(product._id)}
      onKeyDown={(e) => handleKeyDown(e, product._id)}
      role="gridcell"
      tabIndex={0}
      aria-label={`View ${product.productName || "product"} details`}
    >
      {/* Remove button (Favorites view only) */}
      {isFavorite && (
        <button
          onClick={handleRemoveClick}
          className="absolute top-2.5 right-2.5 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-red-50 hover:border-red-500 transition-colors focus:outline-none"
          aria-label={`Remove ${product.productName || "product"} from favorites`}
          title="Remove from favorites"
        >
          <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-red-600" />
        </button>
      )}

      <div className="h-1/2 overflow-hidden bg-gray-50 flex items-center justify-center p-2">
        <img
          src={imageUrl}
          alt={product.productName || "Product image"}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-108"
          onError={(e) => {
            e.target.src = "/placeholder-image.png";
            e.target.alt = `Image not available for ${product.productName || "product"}`;
          }}
        />
      </div>
      <div className="h-1/2 p-3 sm:p-4 flex flex-col justify-between bg-white">
        <div className="space-y-1 sm:space-y-1.5">
          <h2
            title={product.productName}
            className="text-gray-900 line-clamp-2 leading-tight text-sm sm:text-base font-semibold group-hover:text-amber-700 transition-colors"
          >
            {product.productName || "Unnamed Product"}
          </h2>
          <p className="text-gray-500 text-xs truncate">
            {product.categoryId?.categoryName || "Uncategorized"}
          </p>
          <div className="pt-0.5">
            <StatusBadge status={product.productStatus} />
          </div>
        </div>
        <p
          className="text-red-600 text-base sm:text-lg font-bold mt-1"
          aria-label={`Price: ${formatPrice(minPrice)}`}
        >
          {formatPrice(minPrice)}
        </p>
      </div>
    </article>
  );
};

export default React.memo(ProductCard);