import React from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ProductListItem from '../../../components/ui/ProductListItem';
import Button from '../../../components/ui/Button';

/**
 * Order summary sidebar for the Checkout page with item list, voucher input, and price totals.
 */
export default function CheckoutOrderSummary({
  loading = false,
  itemsToDisplay = [],
  voucherCode = '',
  setVoucherCode,
  appliedVoucher = null,
  discount = 0,
  totalPrice = 0,
  formatPrice,
  onApplyVoucher,
  onRemoveVoucher,
}) {
  return (
    <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
      <h2 className="text-xl sm:text-2xl font-normal mb-4 text-gray-900">Order Summary</h2>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size="lg" color="yellow" />
          </div>
        ) : itemsToDisplay.length === 0 ? (
          <div
            className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center"
            role="status"
          >
            <p>No items in checkout</p>
          </div>
        ) : (
          itemsToDisplay.map((item) => {
            const productData = item.variantId?.productId || item.product;
            const variantData = item.variantId || item.variant;
            const quantity = item.productQuantity || item.quantity;
            const price = item.productPrice || variantData?.variantPrice || 0;
            const totalItemPrice = price * quantity;
            return (
              <ProductListItem
                key={item._id || variantData?._id}
                image={variantData?.variantImage}
                title={productData?.productName || 'Unnamed Product'}
                subtitle={`Color: ${variantData?.productColorId?.productColorName || 'N/A'}, Size: ${variantData?.productSizeId?.productSizeName || 'N/A'}`}
                price={formatPrice(price)}
                totalPrice={formatPrice(totalItemPrice)}
                ariaLabel={`Checkout item: ${productData?.productName || 'Unnamed Product'}`}
              />
            );
          })
        )}
      </div>

      {/* Voucher Section */}
      <div className="mt-6 pt-6 border-t border-gray-300">
        <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
          <legend className="text-sm sm:text-base font-semibold m-0">Voucher Code</legend>
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Enter voucher code"
              className="flex-1 p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={onApplyVoucher}
              disabled={loading}
              type="button"
            >
              Apply
            </Button>
          </div>
          {appliedVoucher && (
            <div className="mt-2 flex justify-between items-center text-green-600">
              <span className="text-sm">Applied: {appliedVoucher.code}</span>
              <Button
                variant="danger"
                size="xs"
                onClick={onRemoveVoucher}
                className="text-sm"
                type="button"
              >
                Remove
              </Button>
            </div>
          )}
        </fieldset>
      </div>

      {/* Total Summary */}
      <div className="mt-6 pt-6 border-t border-gray-300 space-y-4">
        <div className="flex justify-between text-base">
          <span>Subtotal:</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600 text-base">
            <span>Discount:</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg sm:text-xl pt-4 border-t border-gray-300">
          <span>Total:</span>
          <span className="text-red-600">
            {formatPrice(Math.max(totalPrice - discount, 0))}
          </span>
        </div>
      </div>
    </section>
  );
}
