// ProductCard.jsx
import React from "react";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

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

const formatPrice = (price) => {
  if (typeof price !== "number" || isNaN(price)) return "N/A";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "In Stock"
    },
    inactive: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Out of Stock"
    },
    discontinued: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Discontinued"
    }
  };

  const config = statusConfig[status?.toLowerCase()] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    label: "Unknown"
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] sm:text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

// Loading Skeleton component
export const ProductCardSkeleton = () => {
  return (
    <article
      className="flex flex-col h-[17em] w-[11em] sm:h-[20em] sm:w-[13em] border-2 border-gray-300 rounded-xl overflow-hidden bg-white"
      aria-label="Loading product"
      role="gridcell"
    >
      {/* Image skeleton */}
      <div className="h-1/2 overflow-hidden bg-gray-200 animate-pulse rounded-t-xl" />

      {/* Content skeleton */}
      <div className="h-1/2 p-3 sm:p-4 flex flex-col justify-between bg-white">
        <div className="space-y-1 sm:space-y-1.5">
          {/* Product name skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>

          {/* Category skeleton */}
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />

          {/* Badge skeleton */}
          <div className="pt-0.5 sm:pt-1">
            <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
        </div>

        {/* Price skeleton */}
        <div className="h-6 bg-gray-200 rounded w-24 mt-1 sm:mt-2 animate-pulse" />
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
      className="flex flex-col h-[17em] w-[11em] sm:h-[20em] sm:w-[13em] border-2 border-gray-300 rounded-xl overflow-hidden hover:shadow-lg focus:shadow-lg focus:outline-none cursor-pointer transition-all duration-300 ease-in-out bg-white relative"
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
          className="absolute top-2 right-2 z-10 bg-white border border-gray-300 rounded-full p-1.5 shadow-sm hover:bg-red-50 hover:border-red-500 transition-colors focus:outline focus:outline-2 focus:outline-red-600 focus:outline-offset-2"
          aria-label={`Remove ${product.productName || "product"} from favorites`}
          title="Remove from favorites"
        >
          <DeleteOutlineIcon fontSize="small" className="text-gray-700 hover:text-red-600" />
        </button>
      )}

      <div className="h-1/2 overflow-hidden bg-gray-50 transition-transform duration-300 ease-in-out hover:scale-105">
        <img
          src={imageUrl}
          alt={product.productName || "Product image"}
          loading="lazy"
          className="w-full h-full object-cover rounded-t-xl transition-transform duration-300 ease-in-out"
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
            className="text-black line-clamp-2 leading-tight text-sm sm:text-base font-medium"
          >
            {product.productName || "Unnamed Product"}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm truncate">
            {product.categoryId?.categoryName || "Uncategorized"}
          </p>
          <div className="pt-0.5 sm:pt-1">
            <StatusBadge status={product.productStatus} />
          </div>
        </div>
        <p
          className="text-red-600 text-base sm:text-lg font-semibold mt-1 sm:mt-2"
          aria-label={`Price: ${formatPrice(minPrice)}`}
        >
          {formatPrice(minPrice)}
        </p>
      </div>
    </article>
  );
};

export default ProductCard;