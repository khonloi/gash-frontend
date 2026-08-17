import React from 'react';
import { Banknote, Landmark } from 'lucide-react';
import OrderSuccessModal from '../../features/orders/components/OrderSuccessModal';
import LoadingSpinner, { LoadingButton } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Form from '../../components/ui/Form';
import { useCheckout } from '../../features/orders/hooks/useCheckout';
import CheckoutAuthModal from '../../features/orders/components/CheckoutAuthModal';
import CheckoutOrderSummary from '../../features/orders/components/CheckoutOrderSummary';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const Checkout = () => {
  useDocumentTitle("Secure Checkout");
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
    clearCheckoutData,
    setIsAuthenticated,
  } = useCheckout();

  const checkoutFields = [
    {
      type: 'fieldset',
      legend: 'Shipping Information',
      className: 'border-2 border-gray-300 rounded-xl p-3 sm:p-4 space-y-4',
      fields: [
        {
          name: 'name',
          label: 'Recipient Name',
          type: 'text',
          required: true,
          value: formData.name,
          onChange: handleInputChange,
          inputProps: {
            onBlur: handleFieldBlur,
            disabled: loading,
            placeholder: 'Your recipient name',
            className:
              'w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50',
          },
        },
        {
          name: 'addressReceive',
          label: 'Delivery Address',
          type: 'text',
          required: true,
          value: formData.addressReceive,
          onChange: handleInputChange,
          inputProps: {
            onBlur: handleFieldBlur,
            disabled: loading,
            placeholder: 'Your delivery address',
            className:
              'w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50',
          },
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'tel',
          required: true,
          value: formData.phone,
          onChange: handleInputChange,
          inputProps: {
            onBlur: handleFieldBlur,
            disabled: loading,
            placeholder: 'Your phone number',
            className:
              'w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50',
          },
        },
      ],
    },
    {
      type: 'fieldset',
      legend: 'Payment Method',
      className: 'border-2 border-gray-300 rounded-xl p-3 sm:p-4 space-y-3',
      renderBody: () => (
        <div key="payment-methods" className="space-y-3">
          <label
            className={`flex items-center p-3 sm:p-4 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
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
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Cash on Delivery (COD)</span>
                <p className="text-xs text-gray-500">Pay when you receive the order</p>
              </div>
            </div>
          </label>

          <label
            className={`flex items-center p-3 sm:p-4 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
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
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">VNPay (Bank Transfer)</span>
                <p className="text-xs text-gray-500">Pay online with VNPay</p>
              </div>
            </div>
          </label>
        </div>
      ),
    },
  ];

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
        {/* Order Summary Sub-Component */}
        <CheckoutOrderSummary
          loading={loading}
          itemsToDisplay={itemsToDisplay}
          voucherCode={voucherCode}
          setVoucherCode={setVoucherCode}
          appliedVoucher={appliedVoucher}
          discount={discount}
          totalPrice={totalPrice}
          formatPrice={formatPrice}
          onApplyVoucher={handleApplyVoucher}
          onRemoveVoucher={handleRemoveVoucher}
        />

        {/* Checkout Form */}
        {itemsToDisplay.length > 0 && (
          <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 relative shadow-sm border border-gray-200">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
                <div className="text-center">
                  <LoadingSpinner size="xl" color="yellow" className="mb-4" />
                  <p className="text-gray-900 font-medium">Processing your order...</p>
                  <p className="text-gray-500 text-sm mt-2">Please wait while we process your order</p>
                </div>
              </div>
            )}
            <Form
              onSubmit={handlePlaceOrder}
              fields={checkoutFields}
              fieldsClassName="space-y-6"
              showSubmitButton={false}
            >
              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                {loading ? (
                  <LoadingButton
                    type="submit"
                    loading={loading}
                    className="flex-1"
                  >
                    {paymentMethod === 'COD' ? 'Place Order' : 'Pay with VNPay'}
                  </LoadingButton>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex-1"
                  >
                    {paymentMethod === 'COD' ? 'Place Order' : 'Pay with VNPay'}
                  </Button>
                )}
              </div>
            </Form>
          </section>
        )}
      </div>
    </div>
  );
};

export default Checkout;
