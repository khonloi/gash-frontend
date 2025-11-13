// ProductCard.jsx
import React from "react";

// Helper function to get minimum price from product variants
const getMinPrice = (product) => {
  if (!product.productVariantIds || product.productVariantIds.length === 0) {
    return 0;
  }
  const prices = product.productVariantIds
    .filter(v => v.variantStatus !== 'discontinued' && v.variantPrice > 0)
    .map(v => v.variantPrice);
  return prices.length > 0 ? Math.min(...prices) : 0;
};

// Helper function to get main image URL
const getMainImageUrl = (product) => {
  if (!product.productImageIds || product.productImageIds.length === 0) {
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

const ProductCard = ({ product, handleProductClick, handleKeyDown }) => {
  const minPrice = getMinPrice(product);
  const imageUrl = getMainImageUrl(product);

  return (
    <article
      className="flex flex-col h-[19em] w-[12em] sm:h-[22em] sm:w-[14em] border-2 border-gray-300 rounded-xl overflow-hidden hover:shadow-md focus:shadow-md focus:outline-none cursor-pointer transition-shadow duration-200"
      onClick={() => handleProductClick(product._id)}
      onKeyDown={(e) => handleKeyDown(e, product._id)}
      role="gridcell"
      tabIndex={0}
      aria-label={`View ${product.productName || "product"} details`}
    >
      <div className="h-1/2 overflow-hidden bg-gray-50">
        <img
          src={imageUrl}
          alt={product.productName || "Product image"}
          loading="lazy"
          className="w-full h-full object-cover rounded-t-xl"
          onError={(e) => {
            e.target.src = "/placeholder-image.png";
            e.target.alt = `Image not available for ${product.productName || "product"}`;
          }}
        />
      </div>
      <div className="h-1/2 p-4 flex flex-col justify-between bg-white">
        <div className="space-y-1.5">
          <h2
            title={product.productName}
            className="text-black line-clamp-2 leading-tight text-base font-medium"
          >
            {product.productName || "Unnamed Product"}
          </h2>
          <p className="text-gray-600 text-sm">
            {product.categoryId?.cat_name || "Uncategorized"}
          </p>
          <div className="pt-1">
            <StatusBadge status={product.productStatus} />
          </div>
        </div>
        <p
          className="text-red-600 text-lg font-semibold mt-2"
          aria-label={`Price: ${formatPrice(minPrice)}`}
        >
          {formatPrice(minPrice)}
        </p>
      </div>
    </article>
  );
};

export default ProductCard;