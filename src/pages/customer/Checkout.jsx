import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import OrderSuccessModal from '../../components/OrderSuccessModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import '../../styles/Checkout.css';
import Api from "../../common/SummaryAPI";
import LoadingSpinner, { LoadingForm, LoadingButton } from '../../components/LoadingSpinner';

const Checkout = () => {
  // Shared success modal state
  const [successInfo, setSuccessInfo] = useState(null);
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedItems = useMemo(() => location.state?.selectedItems || [], [location.state?.selectedItems]);
  const buyNowState = useMemo(() =>
    location.state && location.state.product && location.state.variant && location.state.quantity
      ? {
        product: location.state.product,
        variant: location.state.variant,
        quantity: location.state.quantity,
      }
      : null,
    [location.state]
  );
  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState({
    addressReceive: '',
    phone: '',
    name: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Fetch cart items (only if not Buy Now)
  const fetchCartItems = useCallback(async () => {
    if (!user?._id) {
      showToast('User not authenticated', 'error');
      return;
    }
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await Api.newCart.getByAccount(user._id, token);
      setCartItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      showToast(err.message || 'Failed to load cart items', 'error');
      console.error('Fetch cart items error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!buyNowState) {
      fetchCartItems();
    }
  }, [user, navigate, fetchCartItems, buyNowState]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (buyNowState) {
      return (buyNowState.variant?.variantPrice || 0) * (buyNowState.quantity || 1);
    }
    return selectedItems.reduce((total, item) => {
      const price = item.productPrice || item.variantId?.variantPrice || 0;
      const quantity = item.productQuantity || item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  }, [selectedItems, buyNowState]);

  // ==== Handle voucher apply ====
  const handleApplyVoucher = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (!user || !token) {
        showToast('Please login to apply voucher.', 'error');
        return;
      }

      // Prepare data for apply API call
      const applyData = {
        voucherCode: voucherCode.trim().toUpperCase(),
        totalPrice: totalPrice
      };

      // Apply voucher directly using backend API
      const applyResponse = await Api.voucher.applyVoucher(applyData, token);

      if (applyResponse.data && applyResponse.data.success) {
        const { data } = applyResponse.data;

        console.log("Voucher apply successful:", data);

        if (data.voucherId && data.discountAmount > 0) {
          // Voucher applied successfully
          setAppliedVoucher({
            _id: data.voucherId,
            code: data.code,
            discountType: 'percentage', // Default, will be updated when backend provides full voucher data
            discountValue: data.discountAmount
          });
          setDiscount(data.discountAmount);
          showToast(`Voucher applied: -${data.discountAmount.toLocaleString()}₫`, 'success');
        } else if (data.voucherId && data.discountAmount === 0) {
          // Voucher is valid but no discount applied (e.g., min order not met)
          showToast(`Voucher "${data.code}" is valid but no discount applied.`, 'info');
        } else {
          // No voucher applied (empty voucherCode)
          showToast('No voucher applied.', 'info');
        }
      } else {
        // Backend returned error - hiển thị lỗi do backend trả về
        const errorMessage = applyResponse.data?.message || 'Failed to apply voucher';
        showToast(errorMessage, 'error');
        return;
      }
    } catch (err) {
      // Hiển thị lỗi do backend trả về
      let errorMessage = 'Invalid or expired voucher code.';

      if (err.response?.data?.message) {
        // Backend error message
        errorMessage = err.response.data.message;
      } else if (err.message) {
        // JavaScript error message
        errorMessage = err.message;
      }

      showToast(errorMessage, 'error');
    }
  };

  // Xóa voucher đã áp dụng
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode('');
  };

  // Validation functions
  const validateName = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return 'Recipient name is required';
    if (trimmed.length < 3) return 'Recipient name must be at least 3 characters';
    if (trimmed.length > 30) return 'Recipient name cannot exceed 30 characters';
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) return 'Recipient name can only contain letters, numbers and spaces';
    return null;
  }, []);

  const validateAddress = useCallback((address) => {
    const trimmed = address.trim();
    if (!trimmed) return 'Address is required';
    if (trimmed.length < 5) return 'Address must be at least 5 characters';
    return null;
  }, []);

  const validatePhone = useCallback((phone) => {
    const trimmed = phone.trim();
    if (!trimmed) return 'Phone number is required';
    if (!/^(0|\+84)[1-9]\d{8}$/.test(trimmed)) return 'Invalid Vietnamese phone number';
    return null;
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle payment method change
  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  // Handle place order
  const handlePlaceOrder = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);

    const isBuyNow = !!buyNowState;
    const itemsToOrder = isBuyNow
      ? [{
        variant_id: buyNowState.variant._id,
        pro_price: buyNowState.variant.variantPrice || 0,
        pro_quantity: buyNowState.quantity,
        pro_name: buyNowState.product.productName,
      }]
      : selectedItems;

    if (itemsToOrder.length === 0) {
      showToast('Your cart is empty', 'error');
      setLoading(false);
      return;
    }

    // Validate all fields
    const nameError = validateName(formData.name);
    const addressError = validateAddress(formData.addressReceive);
    const phoneError = validatePhone(formData.phone);

    if (nameError || addressError || phoneError) {
      // Show first error in toast
      const firstError = nameError || addressError || phoneError;
      showToast(firstError, 'error');
      setLoading(false);
      return;
    }

    // Trim fields for submission
    const trimmedName = formData.name.trim();
    const trimmedAddress = formData.addressReceive.trim();
    const trimmedPhone = formData.phone.trim();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Prepare order data for API call
      const orderData = {
        acc_id: user._id,
        addressReceive: trimmedAddress,
        phone: trimmedPhone,
        name: trimmedName,
        payment_method: paymentMethod,
        voucherCode: appliedVoucher?.code || null,
        items: itemsToOrder.map(item => ({
          variant_id: item.variantId?._id || item.variant_id || item.variant?._id,
          UnitPrice: item.productPrice || item.pro_price || item.variantId?.variantPrice || item.variant?.variantPrice || 0,
          Quantity: item.productQuantity || item.quantity || item.pro_quantity,
        })),
        totalPrice: totalPrice,
      };

      // Gọi API checkout qua SummaryAPI
      const checkoutRes = await Api.order.checkout(orderData, token);

      if (paymentMethod === 'COD') {
        // Remove purchased items from cart if not Buy Now
        if (!isBuyNow && itemsToOrder.length > 0) {
          try {
            const boughtCartIds = itemsToOrder
              .map(item => {
                const variantId = item.variantId?._id || item.variant_id || item.variant?._id;
                const cartItem = cartItems.find(ci => (ci.variantId?._id || ci.variant_id || ci.variant?._id) === variantId);
                return cartItem?._id;
              })
              .filter(Boolean);
            if (boughtCartIds.length > 0) {
              await Api.cart.batchRemove(boughtCartIds, token);
            }
          } catch (e) {
            console.error('Clear cart error:', e);
          }
        }
        if (typeof fetchCartItems === 'function') {
          await fetchCartItems();
        }
        setSuccessInfo({
          status: 'success',
          message: 'Your order will be promptly prepared and sent to you.',
          orderId: checkoutRes?.data?.data?.order?._id || checkoutRes?.data?.data?.order?.id || checkoutRes?.data?.data?.orderId,
          amount: Math.max(totalPrice - discount, 0),
          paymentMethod: 'COD',
        });
        showToast('Order placed successfully!', 'success');
        setLoading(false);
      } else if (paymentMethod === "VNPAY") {
        const orderId =
          checkoutRes?.data?.data?.order?._id ||
          checkoutRes?.data?.data?.order?.id ||
          checkoutRes?.data?.data?.orderId;

        if (!orderId) {
          console.error("checkoutRes.data:", checkoutRes.data);
          showToast("No orderId returned from checkout!", "error");
          setLoading(false);
          return;
        }

        try {
          const paymentUrlRes = await Api.order.getPaymentUrl(
            { orderId, bankCode: "", language: "vn" },
            token
          );

          const paymentUrl = paymentUrlRes?.data?.paymentUrl;
          if (paymentUrl && paymentUrl.startsWith("http")) {
            window.location.href = paymentUrl;
          } else {
            showToast("Could not get VNPay payment link!", "error");
            setLoading(false);
          }
        } catch (error) {
          console.error("payment-url error:", error);
          showToast("Error getting VNPay payment link!", "error");
          setLoading(false);
        }
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to place order';
      showToast(errorMessage, 'error');
      console.error('Place order error:', err);
      setLoading(false);
    }
  }, [cartItems, user, formData, totalPrice, paymentMethod, buyNowState, showToast, appliedVoucher, discount, selectedItems, fetchCartItems, validateName, validateAddress, validatePhone]);

  // Handle field blur (for validation)
  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    let error;
    if (name === 'name') error = validateName(value);
    if (name === 'addressReceive') error = validateAddress(value);
    if (name === 'phone') error = validatePhone(value);
    if (error) showToast(error, 'error');
  };

  const itemsToDisplay = buyNowState
    ? [buyNowState]
    : selectedItems.length > 0
      ? selectedItems
      : cartItems;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {successInfo && (
        <OrderSuccessModal
          open={!!successInfo}
          info={successInfo}
          onClose={() => {
            setSuccessInfo(null);
            navigate('/');
          }}
        />
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-yellow-800">Order Summary</h2>

          {/* Items List */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner size="lg" color="yellow" />
              </div>
            ) : itemsToDisplay.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No items in checkout</p>
            ) : (
              itemsToDisplay.map((item) => {
                const productData = item.variantId?.productId || item.product;
                const variantData = item.variantId || item.variant;
                const quantity = item.productQuantity || item.quantity;
                const price = item.productPrice || variantData?.variantPrice || 0;
                return (
                  <div key={item._id || variantData?._id} className="flex gap-4 py-4 border-b">
                    <img
                      src={variantData?.variantImage || ''}
                      alt={productData?.productName || ''}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{productData?.productName || ''}</h3>
                      <p className="text-sm text-gray-600">
                        Variant: {variantData?.productColorId?.color_name || 'N/A'} - Size: {variantData?.productSizeId?.size_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">Quantity: {quantity}</p>
                      <p className="font-medium text-yellow-600">
                        Price: {price.toLocaleString()}₫
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Voucher Section */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Enter voucher code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <button
                onClick={handleApplyVoucher}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                disabled={loading}
              >
                Apply
              </button>
            </div>
            {appliedVoucher && (
              <div className="mt-2 flex justify-between items-center text-green-600">
                <span>Applied: {appliedVoucher.code}</span>
                <button
                  onClick={handleRemoveVoucher}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div className="mt-6 pt-6 border-t space-y-4 text-lg">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{totalPrice.toLocaleString()}₫</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{discount.toLocaleString()}₫</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl pt-4 border-t">
              <span>Total:</span>
              <span>{(totalPrice - discount).toLocaleString()}₫</span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        {itemsToDisplay.length > 0 && (
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200 relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
                <div className="text-center">
                  <LoadingSpinner size="xl" color="yellow" className="mb-4" />
                  <p className="text-yellow-600 font-medium">Processing your order...</p>
                  <p className="text-gray-500 text-sm mt-2">Please wait while we process your order</p>
                </div>
              </div>
            )}
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Shipping Information */}
              <fieldset className="space-y-4">
                <legend className="text-xl font-bold text-yellow-800 mb-4">Shipping Information</legend>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-describedby="name-description"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-describedby="address-description"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-describedby="phone-description"
                    disabled={loading}
                  />
                </div>
              </fieldset>

              {/* Payment Method */}
              <fieldset className="space-y-4">
                <legend className="text-xl font-bold text-yellow-800 mb-4">Payment Method</legend>
                <div className="space-y-3">
                  <label className={`flex items-center p-4 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={handlePaymentMethodChange}
                      className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                      disabled={loading}
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">Cash on Delivery (COD)</span>
                      <p className="text-xs text-gray-500">Pay when you receive the order</p>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={paymentMethod === 'VNPAY'}
                      onChange={handlePaymentMethodChange}
                      className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                      disabled={loading}
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">VNPay</span>
                      <p className="text-xs text-gray-500">Pay online with VNPay</p>
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition font-medium"
                  disabled={loading}
                >
                  Back
                </button>
                <LoadingButton
                  type="submit"
                  loading={loading}
                  className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition font-medium"
                >
                  {paymentMethod === 'COD' ? 'Place Order' : 'Pay with VNPay'}
                </LoadingButton>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;