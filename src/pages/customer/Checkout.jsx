import React from 'react';
import OrderSuccessModal from '../../features/orders/components/OrderSuccessModal';
import CheckoutAuthModal from '../../features/auth/components/CheckoutAuthModal';
import LoadingSpinner, { LoadingButton } from '../../components/ui/LoadingSpinner';
import ProductButton from '../../components/ui/ProductButton';
import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import { useCheckout } from '../../features/orders/hooks/useCheckout';

const Checkout = () => {
  const {
    successInfo,
    setSuccessInfo,
    user,
    navigate,
    formData,
    paymentMethod,
    loading,
    voucherCode,
    setVoucherCode,
    discount,
    appliedVoucher,
    showAuthModal,
    setShowAuthModal,
    passkeys,
    formatPrice,
    totalPrice,
    handleApplyVoucher,
    handleRemoveVoucher,
    handleInputChange,
    handlePaymentMethodChange,
    handleAuthSuccess,
    handlePlaceOrder,
    handleFieldBlur,
    itemsToDisplay,
    clearCheckoutData
  } = useCheckout();

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      {successInfo && (
        <OrderSuccessModal
          open={!!successInfo}
          info={successInfo}
          onClose={() => {
            setSuccessInfo(null);
            clearCheckoutData();
            navigate('/');
          }}
        />
      )}

      <CheckoutAuthModal
        open={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setIsAuthenticated(false);
        }}
        onAuthenticated={handleAuthSuccess}
        user={user}
        passkeys={passkeys}
      />

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Order Summary */}
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-normal mb-4 text-gray-900">Order Summary</h2>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner size="lg" color="yellow" />
              </div>
            ) : itemsToDisplay.length === 0 ? (
              <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center gap-4" role="status">
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
                  <article
                    key={item._id || variantData?._id}
                    className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 transition-shadow hover:shadow-sm"
                    tabIndex={0}
                    aria-label={`Checkout item: ${productData?.productName || 'Unnamed Product'}`}
                  >
                    <div className="flex items-stretch gap-6">
                      <img
                        src={variantData?.variantImage || '/placeholder.png'}
                        alt={productData?.productName || 'Product'}
                        className="w-20 sm:w-24 aspect-square object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src = '/placeholder.png';
                        }}
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                        <p className="text-base sm:text-lg font-semibold text-gray-900 m-0 line-clamp-2">
                          {productData?.productName || 'Unnamed Product'}
                        </p>
                        <p className="text-sm text-gray-600 m-0">
                          Color: {variantData?.productColorId?.productColorName || 'N/A'}, Size: {variantData?.productSizeId?.productSizeName || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 m-0">
                          Price: {formatPrice(price)}
                        </p>
                        <p className="text-base font-semibold text-red-600 m-0">
                          Total: {formatPrice(totalItemPrice)}
                        </p>
                      </div>
                    </div>
                  </article>
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
                <ProductButton
                  variant="primary"
                  size="sm"
                  onClick={handleApplyVoucher}
                  disabled={loading}
                >
                  Apply
                </ProductButton>
              </div>
              {appliedVoucher && (
                <div className="mt-2 flex justify-between items-center text-green-600">
                  <span className="text-sm">Applied: {appliedVoucher.code}</span>
                  <ProductButton
                    variant="danger"
                    size="xs"
                    onClick={handleRemoveVoucher}
                    className="text-sm"
                  >
                    Remove
                  </ProductButton>
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
              <span className="text-red-600">{formatPrice(Math.max(totalPrice - discount, 0))}</span>
            </div>
          </div>
        </section>

        {/* Checkout Form */}
        {itemsToDisplay.length > 0 && (
          <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border-2 border-gray-300 relative shadow-sm border border-gray-200">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
                <div className="text-center">
                  <LoadingSpinner size="xl" color="yellow" className="mb-4" />
                  <p className="text-gray-900 font-medium">Processing your order...</p>
                  <p className="text-gray-500 text-sm mt-2">Please wait while we process your order</p>
                </div>
              </div>
            )}
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Shipping Information */}
              <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4 space-y-4">
                <legend className="text-sm sm:text-base font-semibold m-0">Shipping Information</legend>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="Your recipient name"
                    className="w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="addressReceive" className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    id="addressReceive"
                    name="addressReceive"
                    value={formData.addressReceive}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="Your delivery address"
                    className="w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    placeholder="Your phone number"
                    className="w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  />
                </div>
              </fieldset>

              {/* Payment Method */}
              <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4 space-y-3">
                <legend className="text-sm sm:text-base font-semibold m-0">Payment Method</legend>
                <div className="space-y-3">
                  <label className={`flex items-center p-3 sm:p-4 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={handlePaymentMethodChange}
                      className="w-4 h-4 accent-amber-400 border-gray-300 focus:ring-blue-600"
                      disabled={loading}
                    />
                    <div className="ml-3 flex items-center gap-3 flex-1">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                        <LocalAtmOutlinedIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">Cash on Delivery (COD)</span>
                        <p className="text-xs text-gray-500">Pay when you receive the order</p>
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-center p-3 sm:p-4 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={paymentMethod === 'VNPAY'}
                      onChange={handlePaymentMethodChange}
                      className="w-4 h-4 accent-amber-400 border-gray-300 focus:ring-blue-600"
                      disabled={loading}
                    />
                    <div className="ml-3 flex items-center gap-3 flex-1">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg flex-shrink-0">
                        <AccountBalanceOutlinedIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">VNPay (Bank Transfer)</span>
                        <p className="text-xs text-gray-500">Pay online with VNPay</p>
                      </div>
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <ProductButton
                  type="button"
                  variant="default"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </ProductButton>
                {loading ? (
                  <LoadingButton
                    type="submit"
                    loading={loading}
                    className="flex-1"
                  >
                    {paymentMethod === 'COD' ? 'Place Order' : 'Pay with VNPay'}
                  </LoadingButton>
                ) : (
                  <ProductButton
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex-1"
                  >
                    {paymentMethod === 'COD' ? 'Place Order' : 'Pay with VNPay'}
                  </ProductButton>
                )}
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
};

export default Checkout;