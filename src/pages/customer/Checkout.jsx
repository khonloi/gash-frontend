import React, { useState, useCallback, useContext } from 'react';
import OrderSuccessModal from '../../features/orders/components/OrderSuccessModal';
import LoadingSpinner, { LoadingButton } from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Form from '../../components/ui/Form';

import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import { useCheckout } from '../../features/orders/hooks/useCheckout';
import Modal from '../../components/ui/Modal';
import PasswordInput from '../../components/ui/PasswordInput';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import Api from '../../common/SummaryAPI';
import { startAuthentication } from '@simplewebauthn/browser';
import { GoogleLogin } from '@react-oauth/google';
import ProductListItem from '../../components/ui/ProductListItem';

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
    clearCheckoutData,
    setIsAuthenticated
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
            className: 'w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50'
          }
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
            className: 'w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50'
          }
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
            className: 'w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50'
          }
        }
      ]
    },
    {
      type: 'fieldset',
      legend: 'Payment Method',
      className: 'border-2 border-gray-300 rounded-xl p-3 sm:p-4 space-y-3',
      renderBody: () => (
        <div key="payment-methods" className="space-y-3">
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
      )
    }
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

      <LocalCheckoutAuthModal
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
              <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center" role="status">
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
                  onClick={handleApplyVoucher}
                  disabled={loading}
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
                    onClick={handleRemoveVoucher}
                    className="text-sm"
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

const LocalCheckoutAuthModal = ({ open, onClose, onAuthenticated, user, passkeys = [] }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMethod, setAuthMethod] = useState(null); // 'password', 'google', 'passkey'
  const { googleLogin } = useContext(AuthContext);
  const { showToast } = useToast();

  const isGoogleUser = user?.googleId;
  const hasPasskeys = passkeys && passkeys.length > 0;
  const hasPassword = !isGoogleUser; // Regular users have passwords

  const handlePasswordAuth = useCallback(async () => {
    if (!password.trim()) {
      showToast('Please enter your password', 'error', 3000);
      return;
    }

    setIsAuthenticating(true);
    setAuthMethod('password');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please log in again', 'error', 3000);
        return;
      }

      const response = await Api.auth.verifyPassword(password, token);
      if (response.data.verified) {
        showToast('Authentication successful', 'success', 2000);
        onAuthenticated();
        onClose();
      } else {
        showToast('Invalid password', 'error', 3000);
      }
    } catch (err) {
      console.error('Password authentication error:', err);
      const errorMsg = err.response?.data?.message || 'Authentication failed';
      showToast(errorMsg, 'error', 3000);
    } finally {
      setIsAuthenticating(false);
      setAuthMethod(null);
      setPassword('');
    }
  }, [password, showToast, onAuthenticated, onClose]);

  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    if (!credentialResponse.credential) {
      showToast('Google authentication failed', 'error', 3000);
      setIsAuthenticating(false);
      setAuthMethod(null);
      return;
    }

    setIsAuthenticating(true);
    setAuthMethod('google');
    try {
      await googleLogin(credentialResponse.credential);
      showToast('Google authentication successful', 'success', 2000);
      onAuthenticated();
      onClose();
    } catch (err) {
      console.error('Google authentication error:', err);
      showToast('Google authentication failed', 'error', 3000);
    } finally {
      setIsAuthenticating(false);
      setAuthMethod(null);
    }
  }, [googleLogin, showToast, onAuthenticated, onClose]);

  const handleGoogleError = useCallback(() => {
    showToast('Google authentication failed', 'error', 3000);
    setIsAuthenticating(false);
    setAuthMethod(null);
  }, [showToast]);

  const handlePasskeyAuth = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthMethod('passkey');
    try {
      const authResponse = await Api.passkeys.generateAuthenticationOptions(user.username);
      const { options, challenge } = authResponse.data;

      const authenticationResponse = await startAuthentication(options);

      const verifyData = {
        id: authenticationResponse.id,
        rawId: authenticationResponse.rawId,
        response: authenticationResponse.response,
        type: authenticationResponse.type,
        challenge: challenge,
        username: user.username,
      };

      await Api.passkeys.verifyAuthentication(verifyData);
      showToast('Passkey authentication successful', 'success', 2000);
      onAuthenticated();
      onClose();
    } catch (err) {
      console.error('Passkey authentication error:', err);
      const errorMsg = err.response?.data?.message || 'Passkey authentication failed';
      showToast(errorMsg, 'error', 3000);
    } finally {
      setIsAuthenticating(false);
      setAuthMethod(null);
    }
  }, [user, showToast, onAuthenticated, onClose]);

  return (
    <Modal isOpen={open} onClose={onClose}>
      <Modal.Header showClose={!isAuthenticating}>Authenticate to Place Order</Modal.Header>
      <Modal.Body>
        <p className="text-sm text-gray-600 mb-6">
          Please authenticate to confirm your order. Choose your preferred method:
        </p>

        <div className="space-y-6">
          {/* Password Authentication */}
          {hasPassword && (
            <div className="space-y-3">
              <PasswordInput
                label="Password"
                id="checkout-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isAuthenticating) {
                    handlePasswordAuth();
                  }
                }}
                placeholder="Enter your password"
                disabled={isAuthenticating}
              />
              <Button
                variant="primary"
                onClick={handlePasswordAuth}
                disabled={isAuthenticating || !password.trim()}
                className="w-full justify-center py-3"
              >
                {isAuthenticating && authMethod === 'password' ? 'Verifying...' : 'Authenticate with Password'}
              </Button>
            </div>
          )}

          {/* Google Authentication */}
          {isGoogleUser && (
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                size="large"
                width="100%"
                disabled={isAuthenticating}
                aria-label="Authenticate with Google"
              />
            </div>
          )}

          {/* Passkey/Passkey Authentication */}
          {hasPasskeys && (
            <Button
              variant="secondary"
              onClick={handlePasskeyAuth}
              disabled={isAuthenticating}
              className="w-full justify-center py-3"
            >
              {isAuthenticating && authMethod === 'passkey' ? 'Authenticating...' : 'Authenticate with Passkeys'}
            </Button>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isAuthenticating}
          className="px-6"
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Checkout;
