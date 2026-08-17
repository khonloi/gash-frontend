import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import ProductFeedback from "../features/feedback/components/ProductFeedback";
import { useProductDetail } from "../features/products/hooks/useProductDetail";
import useDocumentTitle from "../hooks/useDocumentTitle";
import ProductDetailSkeleton from "../features/products/components/detail/ProductDetailSkeleton";
import ProductDetailLightbox from "../features/products/components/detail/ProductDetailLightbox";
import ProductGallerySection from "../features/products/components/detail/ProductGallerySection";
import ProductInfoSection from "../features/products/components/detail/ProductInfoSection";
import ProductRecommendations from "../features/products/components/detail/ProductRecommendations";

const MarkdownRenderer = lazy(() => import("../components/common/MarkdownRenderer"));

const ProductDetail = () => {
  const navigate = useNavigate();
  const {
    id,
    product,
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
    selectedImage,
    thumbnailIndex,
    isLightboxOpen,
    lightboxIndex,
    zoomLevel,
    forYouProducts,
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

  useDocumentTitle(
    product?.productName || "Product Detail",
    product?.productDescription ? product.productDescription.slice(0, 150) : undefined
  );

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error && !product) {
    return (
      <div className="page-container page-container-centered">
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-sm border border-gray-200">
          <div
            className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap"
            role="alert"
            tabIndex={0}
            aria-live="polite"
          >
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

      {/* Main Product Card */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 w-full">
          {/* Gallery Sub-Component */}
          <ProductGallerySection
            productName={product.productName}
            selectedImage={selectedImage}
            visibleThumbnails={visibleThumbnails}
            allThumbnails={allThumbnails}
            thumbnailIndex={thumbnailIndex}
            onOpenLightbox={handleOpenLightbox}
            onImageClick={handleImageClick}
            onPrevThumbnail={handlePrevThumbnail}
            onNextThumbnail={handleNextThumbnail}
          />

          {/* Info & Options Sub-Component */}
          <ProductInfoSection
            product={product}
            selectedVariant={selectedVariant}
            lowestPriceVariant={lowestPriceVariant}
            isProductInactive={isProductInactive}
            isProductDiscontinued={isProductDiscontinued}
            colorStockInfo={colorStockInfo}
            availableColors={availableColors}
            selectedColor={selectedColor}
            availableSizes={availableSizes}
            selectedSize={selectedSize}
            quantity={quantity}
            isAddingToCart={isAddingToCart}
            isAddingToFavorites={isAddingToFavorites}
            isFavorited={isFavorited}
            isInStock={isInStock}
            formatPrice={formatPrice}
            onColorClick={handleColorClick}
            onSizeClick={handleSizeClick}
            onQuantityChange={handleQuantityChange}
            onAddToFavorites={handleAddToFavorites}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isColorInactiveOrDiscontinued={isColorInactiveOrDiscontinued}
            isColorInStock={isColorInStock}
            isSizeInactiveOrDiscontinued={isSizeInactiveOrDiscontinued}
            isSizeInStock={isSizeInStock}
            isValidCombination={isValidCombination}
          />
        </div>
      </section>

      {/* Lightbox Modal */}
      <ProductDetailLightbox
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
        allThumbnails={allThumbnails}
        lightboxIndex={lightboxIndex}
        zoomLevel={zoomLevel}
        productName={product.productName}
        onPrev={handlePrevImage}
        onNext={handleNextImage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      {/* Product Description */}
      {product?.description && (
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">
            Product Description
          </h2>
          <Suspense fallback={<div className="h-24 bg-gray-50 rounded-lg animate-pulse" />}>
            <MarkdownRenderer content={product.description} />
          </Suspense>
        </section>
      )}

      {/* Feedback Section */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-sm border border-gray-200">
        <ProductFeedback productId={id} />
      </section>

      {/* Recommendations & Recently Viewed */}
      <ProductRecommendations
        forYouProducts={forYouProducts}
        recentlyViewed={recentlyViewed}
        productsLoading={productsLoading}
        onProductClick={handleProductClick}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default ProductDetail;
