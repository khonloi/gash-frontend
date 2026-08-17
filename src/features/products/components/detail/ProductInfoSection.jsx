import React from "react";
import Button from "@/components/ui/Button";

/**
 * Product information panel with pricing, stock status, color/size selection chips, quantity, and buy/cart actions.
 */
export default function ProductInfoSection({
  product,
  selectedVariant,
  lowestPriceVariant,
  isProductInactive,
  isProductDiscontinued,
  colorStockInfo,
  availableColors = [],
  selectedColor,
  availableSizes = [],
  selectedSize,
  quantity,
  isAddingToCart,
  isAddingToFavorites,
  isFavorited,
  isInStock,
  formatPrice,
  onColorClick,
  onSizeClick,
  onQuantityChange,
  onAddToFavorites,
  onAddToCart,
  onBuyNow,
  isColorInactiveOrDiscontinued,
  isColorInStock,
  isSizeInactiveOrDiscontinued,
  isSizeInStock,
  isValidCombination,
}) {
  return (
    <>
      {/* Product Information Column */}
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
            className={`text-xs sm:text-sm px-2 py-1 rounded inline-block ${
              colorStockInfo.inStock
                ? "text-green-700 bg-green-100"
                : "text-red-600 bg-red-50 opacity-50"
            }`}
          >
            {colorStockInfo.message}
          </span>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {/* Color Selection */}
          {availableColors.length > 0 && (
            <fieldset className="mb-4 sm:mb-5 border-2 border-gray-300 rounded-xl p-3 sm:p-4">
              <legend className="text-sm sm:text-base font-semibold m-0">Color:</legend>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const colorName =
                    typeof color === "object" && color !== null
                      ? color.productColorName || color.name || ""
                      : color;
                  const isDisabled =
                    isProductInactive ||
                    isProductDiscontinued ||
                    isColorInactiveOrDiscontinued(colorName) ||
                    !isColorInStock(colorName);
                  return (
                    <button
                      key={colorName || color}
                      className={`px-3 py-1.5 border-2 rounded-md bg-white text-xs sm:text-sm transition-colors focus:outline-none ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-100"
                          : selectedColor === colorName
                          ? "border-amber-400 bg-amber-50 font-semibold cursor-pointer"
                          : "border-gray-300 hover:bg-gray-50 hover:border-blue-600 cursor-pointer"
                      }`}
                      onClick={() => !isDisabled && onColorClick(colorName)}
                      disabled={isDisabled}
                      type="button"
                      aria-label={`Select ${colorName} color`}
                      aria-pressed={selectedColor === colorName}
                      aria-disabled={isDisabled}
                    >
                      {colorName}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Size Selection */}
          {availableSizes.length > 0 && (
            <fieldset className="mb-4 sm:mb-5 border-2 border-gray-300 rounded-xl p-3 sm:p-4">
              <legend className="text-sm sm:text-base font-semibold m-0">Size:</legend>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const sizeName =
                    typeof size === "object" && size !== null
                      ? size.productSizeName || size.name || ""
                      : size;
                  const isDisabled =
                    isProductInactive ||
                    isProductDiscontinued ||
                    isSizeInactiveOrDiscontinued(sizeName) ||
                    !isSizeInStock(sizeName) ||
                    (selectedColor && !isValidCombination(selectedColor, sizeName));
                  return (
                    <button
                      key={sizeName || size}
                      className={`px-3 py-1.5 border-2 rounded-md bg-white text-xs sm:text-sm transition-colors focus:outline-none ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-100"
                          : selectedSize === sizeName
                          ? "border-amber-400 bg-amber-50 font-semibold cursor-pointer"
                          : "border-gray-300 hover:bg-gray-50 hover:border-blue-600 cursor-pointer"
                      }`}
                      onClick={() => !isDisabled && onSizeClick(sizeName)}
                      disabled={isDisabled}
                      type="button"
                      aria-label={`Select ${sizeName} size`}
                      aria-pressed={selectedSize === sizeName}
                      aria-disabled={isDisabled}
                    >
                      {sizeName}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Quantity Selector */}
          <div className="mb-1 flex items-center gap-3">
            <span className="text-xs sm:text-base font-semibold">Quantity:</span>
            <input
              type="number"
              className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white text-sm w-20 transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              value={quantity}
              onChange={onQuantityChange}
              min="1"
              disabled={!selectedVariant || !isInStock || isProductInactive || isProductDiscontinued}
              aria-label="Select quantity"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons Sidebar */}
      <div className="flex-1 min-w-[200px] max-w-full sm:max-w-[320px] p-4 sm:p-5 border-2 border-gray-300 rounded-xl bg-gray-50 flex flex-col gap-2">
        <Button
          variant="secondary"
          onClick={onAddToFavorites}
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
          onClick={onAddToCart}
          disabled={!selectedVariant || !isInStock || isAddingToCart || isProductInactive || isProductDiscontinued}
          type="button"
          aria-label="Add to cart"
        >
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </Button>
        <Button
          variant="default"
          onClick={onBuyNow}
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
    </>
  );
}
