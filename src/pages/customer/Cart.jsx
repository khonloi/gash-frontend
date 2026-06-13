import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import ConfirmationModal from "../../features/orders/components/ConfirmationModal";
import { useCart } from "../../features/cart/hooks/useCart";
import ListLayout from "../../components/layout/ListLayout";

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
    toggleAllChecked,
    formatPrice
  } = useCart();

  const activeFilteredItems = filteredCartItems.filter((item) => {
    const stockQuantity = item.variantId?.stockQuantity ?? 0;
    const isVariantDiscontinued = item.variantId?.variantStatus === "discontinued";
    const isProductDiscontinued = item.variantId?.productId?.productStatus === "discontinued";
    const isOutOfStock = stockQuantity <= 0;
    return !(isVariantDiscontinued || isProductDiscontinued || isOutOfStock);
  });

  const isAllChecked = activeFilteredItems.length > 0 && activeFilteredItems.every((item) => item.checked);

  const selectAllCheckbox = filteredCartItems.length > 0 && (
    <div className="flex items-center gap-3 bg-gray-50 border-2 border-gray-300 rounded-xl p-4 mb-4 select-none">
      <input
        type="checkbox"
        id="select-all"
        checked={isAllChecked}
        onChange={() => toggleAllChecked(!isAllChecked)}
        className="w-5 h-5 accent-amber-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={activeFilteredItems.length === 0}
      />
      <label
        htmlFor="select-all"
        className="text-sm sm:text-base font-semibold text-gray-750 cursor-pointer flex-1"
      >
        Select All ({activeFilteredItems.length} active item{activeFilteredItems.length !== 1 ? "s" : ""})
      </label>
    </div>
  );

  // Focus error notification
  const errorRef = useRef(null);
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const renderCartItem = (item) => {
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
        className={`bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-shadow hover:shadow-sm border border-gray-200 focus-within:shadow-sm ${isInactive ? "opacity-60 grayscale" : ""}`}
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
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleRemoveItemClick(item._id)}
            aria-label={`Remove ${item.variantId?.productId?.productName || "product"} from cart`}
            disabled={isUpdating || actionInProgress}
          >
            Remove
          </Button>
        </div>
      </article>
    );
  };

  const cartAside = (
    <div className="bg-white sm:bg-gray-50 border-0 sm:border-2 border-gray-300 rounded-none sm:rounded-xl p-0 sm:p-5 flex flex-row sm:flex-col items-center sm:items-stretch justify-between sm:justify-start gap-4 flex-shrink-0 w-full" aria-label="Cart summary">
      <p className="text-lg sm:text-xl font-bold text-red-600 m-0 shrink-0">
        Total: {formatPrice(totalPrice)}
      </p>
      <Button
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
        className="w-auto sm:w-full"
      >
        Proceed to Checkout
      </Button>
    </div>
  );

  const customEmptyState = (
    <div
      className="text-center text-[10px] sm:text-sm text-gray-500 p-4 sm:p-6 md:p-8 w-full min-h-[200px] flex flex-col items-center justify-center gap-4"
      role="status"
    >
      <h3 className="text-base sm:text-xl font-semibold text-gray-900 m-0">
        Your cart is empty.
      </h3>
      <Button
        variant="primary"
        size="md"
        onClick={() => navigate("/products")}
        aria-label="Continue shopping"
      >
        Continue Shopping
      </Button>
    </div>
  );

  return (
    <ListLayout
      title="Shopping Cart"
      searchPlaceholder="Search by product name, color, or size..."
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      loading={loading}
      totalItems={cartItems.length}
      filteredItems={filteredCartItems}
      currentItems={filteredCartItems}
      renderItem={renderCartItem}
      noResultsTitle="No items match your search"
      noResultsMessage="Try adjusting your search criteria"
      itemNamePlural="items"
      error={error}
      errorRef={errorRef}
      onRetry={handleRetry}
      aside={cartAside}
      listHeader={selectAllCheckbox}
      hideSearch={loading || cartItems.length === 0}
      hideItemCount={true}
      customEmptyState={customEmptyState}
    >
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
    </ListLayout>
  );
};

export default Cart;


