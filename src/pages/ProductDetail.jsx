import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ProductFeedback from "../features/feedback/components/ProductFeedback";
import Button from "../components/ui/Button";
import ProductCard, { ProductCardSkeleton } from "../features/products/components/ProductCard";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useProductDetail } from "../features/products/hooks/useProductDetail";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

const THUMBNAILS_PER_PAGE = 4;

const ProductDetail = () => {
  const {
    id,
    user,
    product,
    variants,
    selectedVariant,
    loading,
    error,
    selectedColor,
    selectedSize,
    quantity,
    availableColors,
    availableSizes,
    isAddingToCart,
    isAddingToFavorites,
    isFavorited,
    favoriteId,
    images,
    selectedImage,
    thumbnailIndex,
    isLightboxOpen,
    lightboxIndex,
    zoomLevel,
    forYouProducts,
    allProducts,
    productsLoading,
    recentlyViewed,
    isProductInactive,
    isProductDiscontinued,
    lowestPriceVariant,
    allThumbnails,
    visibleThumbnails,
    colorStockInfo,
    isInStock,
    handleQuantityChange,
    handleColorClick,
    handleSizeClick,
    handleImageClick,
    handleOpenLightbox,
    handleCloseLightbox,
    handlePrevImage,
    handleNextImage,
    handleZoomIn,
    handleZoomOut,
    handlePrevThumbnail,
    handleNextThumbnail,
    handleRetry,
    handleAddToFavorites,
    handleAddToCart,
    handleBuyNow,
    formatPrice,
    handleProductClick,
    handleKeyDown,
    isValidCombination,
    isColorInStock,
    isColorInactiveOrDiscontinued,
    isSizeInStock,
    isSizeInactiveOrDiscontinued,
  } = useProductDetail();

  // Product Detail Skeleton Component
  const ProductDetailSkeleton = () => (
    <div className="page-container page-container-centered">
      {/* Breadcrumb Skeleton */}
      <nav className="w-full mb-3 sm:mb-4" aria-label="Breadcrumb skeleton">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </nav>

      {/* Main Product Section Skeleton */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 w-full">
          {/* Image Gallery Skeleton */}
          <div className="flex-1 sm:flex-[3] max-w-full sm:max-w-[420px] flex flex-col gap-3">
            {/* Main Image Skeleton */}
            <div className="flex justify-center items-start w-full">
              <div className="w-full h-[360px] bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
            {/* Horizontal Thumbnail Navigation Skeleton */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
              <div className="flex gap-2 overflow-x-auto">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-[50px] h-[50px] bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                ))}
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="flex-1 sm:flex-[3] px-0 sm:px-3 space-y-4 sm:space-y-5">
            {/* Product Name Skeleton */}
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            {/* Price Skeleton */}
            <div className="h-7 sm:h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
            {/* Stock Status Skeleton */}
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 animate-pulse"></div>

            {/* Color Selection Skeleton */}
            <div className="space-y-3 sm:space-y-4">
              <div className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-16 mb-3 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded-md w-20 animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Size Selection Skeleton */}
              <div className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-12 mb-3 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded-md w-16 animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Quantity Skeleton */}
              <div className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-md w-20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons Sidebar Skeleton */}
          <div className="flex-1 min-w-[200px] max-w-full sm:max-w-[260px] p-4 sm:p-5 border-2 border-gray-300 rounded-xl bg-gray-50 flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
            ))}
            <div className="mt-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Description Section Skeleton */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-gray-200">
        <div className="h-6 sm:h-7 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
        </div>
      </section>

      {/* Feedback Section Skeleton */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-sm border border-gray-200">
        <div className="h-6 sm:h-7 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-2 border-gray-300 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  // Render
  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error && !product) {
    return (
      <div className="page-container page-container-centered">
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-sm border border-gray-200">
          <div className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap" role="alert" tabIndex={0} aria-live="polite">
            <span className="text-lg" aria-hidden="true">⚠</span>
            {error}
            <button
              className="px-3 py-1.5 bg-transparent border-2 border-gray-300 text-blue-600 text-xs sm:text-sm rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              onClick={handleRetry}
              disabled={loading}
              type="button"
              aria-label="Retry loading product"
            >
              Retry
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Get category name for breadcrumb
  const categoryName = product?.categoryId?.categoryName || null;
  const categoryLink = categoryName
    ? `/products?category=${encodeURIComponent(categoryName)}`
    : null;

  return (
    <div className="page-container page-container-centered">
      {/* Breadcrumbs */}
      <nav className="w-full mb-3 sm:mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 flex-wrap">
          <li>
            <button
              onClick={() => navigate("/")}
              className="hover:text-blue-600 transition-colors focus:outline-none rounded"
              aria-label="Go to home"
            >
              Home
            </button>
          </li>
          {categoryName && (
            <>
              <li aria-hidden="true">
                <span className="text-gray-400">/</span>
              </li>
              <li>
                {categoryLink ? (
                  <button
                    onClick={() => navigate(categoryLink)}
                    className="hover:text-blue-600 transition-colors focus:outline-none rounded"
                    aria-label={`Go to ${categoryName} category`}
                  >
                    {categoryName}
                  </button>
                ) : (
                  <span>{categoryName}</span>
                )}
              </li>
            </>
          )}
          <li aria-hidden="true">
            <span className="text-gray-400">/</span>
          </li>
          <li className="text-sm sm:text-base text-gray-900 font-medium" aria-current="page">
            {product?.productName || "Product"}
          </li>
        </ol>
      </nav>

      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 w-full">
          <div className="flex-1 sm:flex-[3] max-w-full sm:max-w-[420px] flex flex-col gap-3">
            {/* Main Image */}
            <div className="flex justify-center items-start w-full">
              <img
                src={selectedImage || "/placeholder-image.png"}
                alt={`${product.productName || "Product"}`}
                onClick={handleOpenLightbox}
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                  e.target.alt = `Not available for ${product.productName || "product"}`;
                }}
                loading="lazy"
                role="button"
                tabIndex={0}
                className="w-full max-h-[360px] object-contain bg-gray-50 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                aria-label={`Open lightbox for ${product.productName || "Product"} image`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleOpenLightbox();
                    e.preventDefault();
                  }
                }}
              />
            </div>
            {/* Horizontal Thumbnail Slider */}
            <div className="flex items-center justify-center gap-2 relative">
              <button
                className="bg-white border-2 border-gray-300 rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed flex-shrink-0"
                onClick={handlePrevThumbnail}
                disabled={thumbnailIndex === 0}
                aria-label="Previous thumbnails"
              >
                <ChevronLeftIcon fontSize="small" className="text-gray-900" />
              </button>
              <div className="flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-full">
                {visibleThumbnails.map((thumbnail, index) => (
                  <div
                    key={thumbnail._id || index}
                    className={`border-2 p-1 cursor-pointer rounded transition-colors flex-shrink-0 ${selectedImage === thumbnail.imageUrl
                      ? "border-amber-400"
                      : "border-gray-300 hover:border-amber-400"
                      }`}
                    onClick={() => handleImageClick(thumbnail)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select thumbnail ${thumbnailIndex + index + 1} for ${product.productName || "Product"}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleImageClick(thumbnail);
                        e.preventDefault();
                      }
                    }}
                  >
                    <img
                      src={thumbnail.imageUrl}
                      alt={`${product.productName || "Product"} thumbnail ${thumbnailIndex + index + 1}`}
                      loading="lazy"
                      className="w-[50px] h-[50px] object-contain"
                    />
                  </div>
                ))}
              </div>
              <button
                className="bg-white border-2 border-gray-300 rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed flex-shrink-0"
                onClick={handleNextThumbnail}
                disabled={
                  thumbnailIndex >= allThumbnails.length - THUMBNAILS_PER_PAGE
                }
                aria-label="Next thumbnails"
              >
                <ChevronRightIcon fontSize="small" className="text-gray-900" />
              </button>
            </div>
          </div>

          <div className="flex-1 sm:flex-[3] px-0 sm:px-3 space-y-4 sm:space-y-5">
            <h1 className="text-lg sm:text-2xl md:text-2xl font-semibold m-0 mb-3 sm:mb-4 leading-tight text-gray-900">
              {product?.productName || "Unnamed Product"}
            </h1>
            <div className="text-red-600 text-xl sm:text-2xl font-semibold my-2 sm:my-3">
              {selectedVariant && selectedVariant.variantPrice
                ? formatPrice(selectedVariant.variantPrice)
                : lowestPriceVariant
                  ? `From ${formatPrice(lowestPriceVariant.variantPrice)}`
                  : isProductDiscontinued
                    ? "Discontinued"
                    : isProductInactive
                      ? "Out of Stock"
                      : "No variants available"}
            </div>
            <div>
              <span
                className={`text-xs sm:text-sm px-2 py-1 rounded inline-block ${colorStockInfo.inStock
                  ? "text-green-700 bg-green-100"
                  : "text-red-600 bg-red-50 opacity-50"
                  }`}
              >
                {colorStockInfo.message}
              </span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {availableColors.length > 0 && (
                <fieldset className="mb-4 sm:mb-5 border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                  <legend className="text-sm sm:text-base font-semibold m-0">Color:</legend>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      // Disable if product is inactive/discontinued OR if all variants with this color are inactive/discontinued
                      const isDisabled = isProductInactive ||
                        isProductDiscontinued ||
                        isColorInactiveOrDiscontinued(color) ||
                        !isColorInStock(color);
                      return (
                        <button
                          key={color}
                          className={`px-3 py-1.5 border-2 rounded-md bg-white text-xs sm:text-sm transition-colors focus:outline-none ${isDisabled
                            ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-100"
                            : selectedColor === color
                              ? "border-amber-400 bg-amber-50 font-semibold cursor-pointer"
                              : "border-gray-300 hover:bg-gray-50 hover:border-blue-600 cursor-pointer"
                            }`}
                          onClick={() => !isDisabled && handleColorClick(color)}
                          disabled={isDisabled}
                          type="button"
                          aria-label={`Select ${color} color`}
                          aria-pressed={selectedColor === color}
                          aria-disabled={isDisabled}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {availableSizes.length > 0 && (
                <fieldset className="mb-4 sm:mb-5 border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                  <legend className="text-sm sm:text-base font-semibold m-0">Size:</legend>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      // Disable if product is inactive/discontinued OR if the specific size (or color-size combo) is inactive/discontinued
                      const isDisabled = isProductInactive ||
                        isProductDiscontinued ||
                        isSizeInactiveOrDiscontinued(size) ||
                        !isSizeInStock(size) ||
                        (selectedColor && !isValidCombination(selectedColor, size));
                      return (
                        <button
                          key={size}
                          className={`px-3 py-1.5 border-2 rounded-md bg-white text-xs sm:text-sm transition-colors focus:outline-none ${isDisabled
                            ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-100"
                            : selectedSize === size
                              ? "border-amber-400 bg-amber-50 font-semibold cursor-pointer"
                              : "border-gray-300 hover:bg-gray-50 hover:border-blue-600 cursor-pointer"
                            }`}
                          onClick={() => !isDisabled && handleSizeClick(size)}
                          disabled={isDisabled}
                          type="button"
                          aria-label={`Select ${size} size`}
                          aria-pressed={selectedSize === size}
                          aria-disabled={isDisabled}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              <div className="mb-1 flex items-center gap-3">
                <span className="text-xs sm:text-base font-semibold">Quantity:</span>
                <input
                  type="number"
                  className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white text-sm w-20 transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  disabled={!selectedVariant || !isInStock || isProductInactive || isProductDiscontinued}
                  aria-label="Select quantity"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] max-w-full sm:max-w-[320px] p-4 sm:p-5 border-2 border-gray-300 rounded-xl bg-gray-50 flex flex-col gap-2">
            <Button
              variant="secondary"
              onClick={handleAddToFavorites}
              disabled={isAddingToFavorites}
              type="button"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              {isAddingToFavorites
                ? isFavorited
                  ? "Removing..."
                  : "Adding..."
                : isFavorited
                  ? "Remove from Favorites"
                  : "Add to Favorites"}
            </Button>
            <Button
              variant="primary"
              onClick={handleAddToCart}
              disabled={!selectedVariant || !isInStock || isAddingToCart || isProductInactive || isProductDiscontinued}
              type="button"
              aria-label="Add to cart"
            >
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </Button>
            <Button
              variant="default"
              onClick={handleBuyNow}
              disabled={!selectedVariant || !isInStock || isProductInactive || isProductDiscontinued}
              type="button"
              aria-label="Buy now"
            >
              Buy Now
            </Button>
            <div className="text-xs sm:text-sm text-gray-600 text-center mt-3 space-y-2">
              <div className="leading-relaxed">
                <strong className="text-green-700">FREE delivery</strong> by tomorrow
              </div>
              <div className="leading-relaxed">
                <strong className="text-green-700">Deliver to</strong> Vietnam
              </div>
              <div className="leading-relaxed">
                <strong className="text-green-700">Return Policy:</strong> 30-day returns. Free returns on
                eligible orders.
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLightboxOpen && (
        <div className="fixed top-0 left-0 w-full h-full z-[1000] flex items-center justify-center" role="dialog" aria-label="Image lightbox">
          <div className="absolute top-0 left-0 w-full h-full bg-black/80 cursor-pointer" onClick={handleCloseLightbox}></div>
          <div className="relative max-w-[90%] max-h-[90%] bg-white rounded-xl p-4 sm:p-5 flex items-center justify-center shadow-sm border border-gray-200">
            <button
              className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 bg-white border-2 border-gray-300 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none"
              onClick={handleCloseLightbox}
              aria-label="Close lightbox"
            >
              <X className="w-4 h-4 text-gray-900" />
            </button>
            <button
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900" />
            </button>
            <button
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-900" />
            </button>
            <div className="max-w-[800px] max-h-[600px] overflow-hidden flex items-center justify-center">
              <img
                src={allThumbnails[lightboxIndex]?.imageUrl || "/placeholder-image.png"}
                alt={`${product.productName || "Product"} image ${lightboxIndex + 1}`}
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-w-full max-h-[600px] object-contain transition-transform"
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                  e.target.alt = `Not available for ${product.productName || "product"}`;
                }}
              />
            </div>
            <div className="absolute bottom-2 sm:bottom-3 flex items-center gap-3">
              <button
                className="bg-white border-2 border-gray-300 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-gray-900" />
              </button>
              <button
                className="bg-white border-2 border-gray-300 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-gray-900" />
              </button>
              <span className="text-gray-900 text-xs sm:text-sm bg-white border border-gray-300 px-2.5 py-1 rounded-md shadow-sm">
                {lightboxIndex + 1} / {allThumbnails.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {product?.description && (
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Product Description</h2>
          <div className="leading-relaxed text-sm sm:text-base text-gray-700 [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:font-semibold [&_h5]:mt-4 [&_h5]:mb-2 [&_h5]:font-semibold [&_h6]:mt-4 [&_h6]:mb-2 [&_h6]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-8 [&_ol]:my-2 [&_ol]:pl-8 [&_li]:mb-1 [&_a]:text-blue-600 [&_a]:no-underline [&_a:hover]:underline [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:my-4 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:bg-gray-50 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_br]:block [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {product.description}
            </ReactMarkdown>
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-sm border border-gray-200">
        <ProductFeedback productId={id} />
      </section>

      {/* For You Section */}
      <section className="w-full mt-6 sm:mt-8 md:mt-10 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
        <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">For You</h2>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
          role="grid"
          aria-label={productsLoading ? "Loading products" : `${forYouProducts.length} personalized products`}
        >
          {productsLoading ? (
            [...Array(5)].map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          ) : (
            forYouProducts.map((product) => (
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

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section className="w-full mt-6 sm:mt-8 md:mt-10 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">Recently Viewed</h2>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
            role="grid"
            aria-label={`${recentlyViewed.length} recently viewed products`}
          >
            {recentlyViewed.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                handleProductClick={handleProductClick}
                handleKeyDown={handleKeyDown}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
