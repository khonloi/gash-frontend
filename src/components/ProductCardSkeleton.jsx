// ProductCardSkeleton.jsx
import React from "react";

const ProductCardSkeleton = () => {
  return (
    <article
      className="flex flex-col h-[19em] w-[12em] sm:h-[22em] sm:w-[14em] border-2 border-gray-300 rounded-xl overflow-hidden"
      aria-label="Loading product"
      role="gridcell"
    >
      {/* Image skeleton */}
      <div className="h-1/2 overflow-hidden bg-gray-200 animate-pulse rounded-t-xl" />
      
      {/* Content skeleton */}
      <div className="h-1/2 p-4 flex flex-col justify-between bg-white">
        <div className="space-y-1.5">
          {/* Product name skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>
          
          {/* Category skeleton */}
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          
          {/* Badge skeleton */}
          <div className="pt-1">
            <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
        </div>
        
        {/* Price skeleton */}
        <div className="h-6 bg-gray-200 rounded w-24 mt-2 animate-pulse" />
      </div>
    </article>
  );
};

export default ProductCardSkeleton;
