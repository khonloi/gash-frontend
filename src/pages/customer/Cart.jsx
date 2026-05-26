import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductButton from "../../components/ui/ProductButton";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useCart } from "../../features/cart/hooks/useCart";

const Cart = () => {
  const navigate = useNavigate();
  const {
    user,
    cartItems,
    loading,
    actionInProgress,
    updatingQuantities,
    error,
    quantityValues,
    setQuantityValues,
    searchQuery,
    setSearchQuery,
    showDeleteConfirm,
    setShowDeleteConfirm,
    itemToDelete,
    setItemToDelete,
    filteredCartItems,
    totalPrice,
    hasInactiveSelectedItems,
    handleRemoveItemClick,
    handleRemoveItem,
    handleQuantityChange,
    handleRetry,
    toggleChecked,
    formatPrice
  } = useCart();

  // Focus error notification
  const errorRef = useRef(null);
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  // Cart Item Skeleton Component
  const CartItemSkeleton = () => (
    <article
      className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-shadow hover:shadow-sm border border-gray-200 focus-within:shadow-sm"
      aria-label="Loading cart item"
    >
      <div className="flex items-center gap-4 sm:gap-6 flex-1 w-full">
        {/* Checkbox skeleton */}
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0" />
        {/* Image skeleton container */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2">
          <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />
        </div>
        {/* Product info skeleton */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="h-5 bg-gray-200 rounded animate-pulse w-1/4" />
        </div>
      </div>
      {/* Action buttons skeleton */}
      <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-4 self-start sm:self-center pl-9 sm:pl-0">
        <div className="w-16 sm:w-20 h-8 sm:h-10 bg-gray-200 rounded-md animate-pulse" />
        <div className="w-16 sm:w-20 h-8 sm:h-10 bg-gray-200 rounded-md animate-pulse" />
      </div>
    </article>
  );

  return (
    <div className="page-container page-container-centered">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-5xl shadow-sm border border-gray-200">
        <h2 className="text-xl sm:text-2xl font-normal mb-4 sm:mb-5 md:mb-6 m-0">
          Shopping Cart
        </h2>

        {/* Search Bar */}
        {!loading && cartItems.length > 0 && (
          <div className="mb-4 sm:mb-5 md:mb-6">
            <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
              <legend className="text-sm sm:text-base font-semibold m-0">Search</legend>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by product name, color, or size..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-3 pl-10 border-2 border-gray-300 rounded-md bg-white text-xs sm:text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                      aria-label="Search cart items"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                {searchQuery && (
                  <div className="flex items-end">
                    <ProductButton
                      variant="default"
                      size="md"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      Clear
                    </ProductButton>
                  </div>
                )}
              </div>
            </fieldset>
          </div>
        )}

        {error && (
          <div
            ref={errorRef}
            className="text-center text-[10px] sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap"
            role="alert"
            tabIndex={0}
            aria-live="polite"
          >
            <span className="text-lg" aria-hidden="true">
              ⚠
            </span>
            {error}
            <ProductButton
              variant="secondary"
              size="sm"
              onClick={handleRetry}
              disabled={loading}
              aria-label="Retry loading cart items"
            >
              Retry
            </ProductButton>
          </div>
        )}

        {!loading && cartItems.length === 0 && !error && !searchQuery ? (
          <div
            className="text-center text-[10px] sm:text-sm text-gray-500 p-4 sm:p-6 md:p-8 w-full min-h-[200px] flex flex-col items-center justify-center gap-4"
            role="status"
          >
            <h3 className="text-base sm:text-xl font-semibold text-gray-900 m-0">
              Your cart is empty.
            </h3>
            <ProductButton
              variant="primary"
              size="md"
              onClick={() => navigate("/products")}
              aria-label="Continue shopping"
            >
              Continue Shopping
            </ProductButton>
          </div>
        ) : (
          <main className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8" role="main">
            <section className="flex-1 min-w-0" aria-label="Cart items">
              {loading ? (
                <>
                  {[...Array(3)].map((_, index) => (
                    <CartItemSkeleton key={`skeleton-${index}`} />
                  ))}
                </>
              ) : filteredCartItems.length === 0 && searchQuery ? (
                <div className="text-center text-[10px] sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[200px] flex flex-col items-center justify-center gap-4" role="status">
                  <p className="text-gray-500 italic text-base sm:text-lg">No items match your search</p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-2">
                    Try adjusting your search criteria
                  </p>
                  <ProductButton
                    variant="default"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600"
                  >
                    Clear Search
                  </ProductButton>
                </div>
              ) : (
                filteredCartItems.map((item) => {
                  const quantityValue = quantityValues[item._id];
                  const quantity = quantityValue !== undefined && quantityValue !== ""
                    ? (typeof quantityValue === "number" ? quantityValue : parseInt(quantityValue, 10))
                    : parseInt(item.productQuantity, 10) || 1;
                  const maxQuantity = item.variantId?.stockQuantity || Infinity;
                  const isUpdating = updatingQuantities.has(item._id);
                  const stockQuantity = item.variantId?.stockQuantity ?? 0;
                  const isVariantDiscontinued = item.variantId?.variantStatus === "discontinued";
                  const isProductDiscontinued = item.variantId?.productId?.productStatus === "discontinued";
                  const isOutOfStock = stockQuantity <= 0;
                  const isInactive = isVariantDiscontinued || isProductDiscontinued || isOutOfStock;
                  const inactiveMessage = isProductDiscontinued || isVariantDiscontinued
                    ? "Discontinued"
                    : isOutOfStock
                      ? "Out of Stock"
                      : "";

                  return (
                    <article
                      key={item._id}
                      className={`bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-shadow hover:shadow-sm border border-gray-200 focus-within:shadow-sm border border-gray-200 ${isInactive ? "opacity-60 grayscale" : ""}`}
                      tabIndex={0}
                      aria-label={`Cart item: ${item.variantId?.productId?.productName || "Unnamed Product"}`}
                    >
                      <div className="flex items-center gap-4 sm:gap-6 flex-1 w-full">
                        <input
                          type="checkbox"
                          checked={item.checked || false}
                          onChange={() => toggleChecked(item._id)}
                          className="w-5 h-5 accent-amber-400 cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Select ${item.variantId?.productId?.productName || "product"} for checkout`}
                          disabled={isInactive}
                        />

                        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 rounded-xl flex items-center justify-center">
                          <img
                            src={item.variantId?.variantImage || "/placeholder-image.png"}
                            alt={item.variantId?.productId?.productName || "Product"}
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => {
                              e.target.src = "/placeholder-image.png";
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 sm:gap-1.5">
                          <p className="text-base sm:text-lg font-semibold text-gray-900 m-0 line-clamp-2 leading-tight">
                            {item.variantId?.productId?.productName || "Unnamed Product"}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 m-0">
                            Color: {item.variantId?.productColorId?.productColorName || "N/A"}, Size:{" "}
                            {item.variantId?.productSizeId?.productSizeName || "N/A"}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 m-0">
                            Price: {formatPrice(item.productPrice)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 m-0">
                            Stock: {stockQuantity}
                          </p>
                          {isInactive && (
                            <p className="text-xs sm:text-sm font-semibold text-red-600 m-0">
                              {inactiveMessage}
                            </p>
                          )}
                          <p className="text-sm sm:text-base font-bold text-red-600 m-0 mt-1">
                            Total: {formatPrice((item.productPrice || 0) * quantity)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-4 shrink-0 self-start sm:self-center pl-9 sm:pl-0">
                        <input
                          type="number"
                          id={`quantity-${item._id}`}
                          min="1"
                          max={maxQuantity}
                          value={quantityValue !== undefined ? quantityValue : quantity}
                          onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value === "" || isNaN(parseInt(value, 10))) {
                              const currentQty = parseInt(item.productQuantity, 10) || 1;
                              setQuantityValues((prev) => ({ ...prev, [item._id]: currentQty }));
                            }
                          }}
                          className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white text-xs sm:text-sm w-20 transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                          aria-label={`Quantity for ${item.variantId?.productId?.productName || "product"}`}
                          disabled={isUpdating || actionInProgress || isInactive}
                        />
                        <ProductButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveItemClick(item._id)}
                          aria-label={`Remove ${item.variantId?.productId?.productName || "product"} from cart`}
                          disabled={isUpdating || actionInProgress}
                        >
                          Remove
                        </ProductButton>
                      </div>
                    </article>
                  );
                })
              )}
            </section>

            {!loading && filteredCartItems.length > 0 && (
              <aside
                className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 sm:p-5 flex-shrink-0 sm:w-64 w-full"
                aria-label="Cart summary"
              >
                <p className="text-lg sm:text-xl font-bold text-red-600 mb-4 m-0">
                  Total: {formatPrice(totalPrice)}
                </p>
                <ProductButton
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    const selectedItems = filteredCartItems.filter((i) => i.checked);
                    navigate("/checkout", { state: { selectedItems } });
                  }}
                  disabled={
                    filteredCartItems.filter((i) => i.checked).length === 0 ||
                    loading ||
                    actionInProgress ||
                    hasInactiveSelectedItems
                  }
                  aria-label="Proceed to checkout"
                  className="w-full"
                >
                  Proceed to Checkout
                </ProductButton>
              </aside>
            )}
          </main>
        )}
      </section>

      {/* Confirmation Modal for Removing Item */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Remove Item from Cart"
        message={
          itemToDelete?.item
            ? `Are you sure you want to remove "${itemToDelete.item.variantId?.productId?.productName || "this product"}" from your cart?`
            : "Are you sure you want to remove this item from your cart?"
        }
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleRemoveItem}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
};

export default Cart;

