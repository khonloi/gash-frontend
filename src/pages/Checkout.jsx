import React, { useState, useContext, useMemo, useCallback } from 'react';
import OrderSuccessModal from '../components/OrderSuccessModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import axiosClient from '../common/axiosClient';
import '../styles/Checkout.css';
import Api from "../common/SummaryAPI";

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
    name: user?.name || user?.username || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD'); // Updated to match backend enum
  const [loading, setLoading] = useState(false);
  // ✅ Voucher state
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

      const response = await Api.utils.fetchWithRetry(`/carts?acc_id=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(Array.isArray(response) ? response : []);
    } catch (err) {
      showToast(err.message || 'Failed to load cart items', 'error');
      console.error('Fetch cart items error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  // Redirect to login if not authenticated
  // useEffect(() => {
  //   if (!user) {
  //     navigate('/login');
  //   } else if (!buyNowState) {
  //     fetchCartItems();
  //   }
  // }, [user, navigate, fetchCartItems, buyNowState]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (buyNowState) {
      return (buyNowState.variant?.pro_price || buyNowState.product?.pro_price || 0) * (buyNowState.quantity || 1);
    }
    return selectedItems.reduce((total, item) => {
      const price = item.pro_price || 0;
      const quantity = item.pro_quantity || 0;
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
          // console.log("✅ Voucher applied via API:", data);
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
    if (!trimmed) return 'Name is required';
    if (trimmed.length < 3) return 'Name must be at least 3 characters';
    if (trimmed.length > 30) return 'Name cannot exceed 30 characters';
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) return 'Name can only contain letters and spaces';
    return null;
  }, []);

  const validateAddress = useCallback((address) => {
    const trimmed = address.trim();
    if (!trimmed) return 'Address is required';
    if (trimmed.length < 5) return 'Address must be at least 5 characters';
    if (trimmed.length > 100) return 'Address cannot exceed 100 characters';
    return null;
  }, []);

  const validatePhone = useCallback((phone) => {
    const trimmed = phone.trim();
    if (!trimmed) return 'Phone number is required';
    if (!/^\d{10}$/.test(trimmed)) return 'Phone number must be exactly 10 digits';
    if (!/^0[3-9]\d{8}$/.test(trimmed)) return 'Phone number must start with 0 and be a valid Vietnamese number';
    return null;
  }, []);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle field blur validation
  const handleFieldBlur = useCallback((e) => {
    const { name, value } = e.target;
    let errorMessage = '';

    switch (name) {
      case 'name':
        errorMessage = validateName(value);
        break;
      case 'addressReceive':
        errorMessage = validateAddress(value);
        break;
      case 'phone':
        errorMessage = validatePhone(value);
        break;
      default:
        break;
    }

    // Show toast for validation error
    if (errorMessage) {
      showToast(errorMessage, 'error');
    }
  }, [validateName, validateAddress, validatePhone, showToast]);

  // Handle payment method change
  const handlePaymentMethodChange = useCallback((e) => {
    setPaymentMethod(e.target.value);
  }, []);

  // Handle form submission
  const handlePlaceOrder = useCallback(async (e) => {
    e.preventDefault();
    const isBuyNow = !!buyNowState;
    const itemsToOrder = isBuyNow
      ? [{
        variant_id: buyNowState.variant._id,
        pro_price: buyNowState.variant.pro_price || buyNowState.product.pro_price || 0,
        pro_quantity: buyNowState.quantity,
        pro_name: buyNowState.product.pro_name,
      }]
      : selectedItems;

    if (itemsToOrder.length === 0) {
      showToast('Your cart is empty', 'error');
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
      return;
    }

    // Trim fields for submission
    const trimmedName = formData.name.trim();
    const trimmedAddress = formData.addressReceive.trim();
    const trimmedPhone = formData.phone.trim();

    setLoading(true);

    try {

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Gọi API checkout qua SummaryAPI
      const checkoutRes = await Api.order.checkout({
        acc_id: user._id,
        addressReceive: trimmedAddress,
        phone: trimmedPhone,
        name: trimmedName,
        payment_method: paymentMethod,
        voucherCode: appliedVoucher?.code || null,
        items: itemsToOrder.map(item => ({
          variant_id: item.variant_id._id || item.variant_id,
          UnitPrice: item.pro_price,
          Quantity: item.pro_quantity
        })),
        totalPrice: totalPrice,
      }, token);

      if (paymentMethod === 'COD') {
        // Remove purchased items from cart if not Buy Now
        if (!isBuyNow && itemsToOrder.length > 0) {
          try {
            const boughtCartIds = itemsToOrder
              .map(item => {
                const variantId = item.variant_id._id || item.variant_id;
                const cartItem = cartItems.find(ci => (ci.variant_id._id || ci.variant_id) === variantId);
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
        return;
      } else if (paymentMethod === "VNPAY") {
        const orderId =
          checkoutRes?.data?.data?.order?._id ||
          checkoutRes?.data?.data?.order?.id ||
          checkoutRes?.data?.data?.orderId;

        if (!orderId) {
          console.error("checkoutRes.data:", checkoutRes.data);
          showToast("No orderId returned from checkout!", "error");
          return;
        }

        try {
          const paymentUrlRes = await axiosClient.post(
            "/orders/payment-url",
            { orderId, bankCode: "", language: "vn" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const paymentUrl = paymentUrlRes?.data?.paymentUrl;
          if (paymentUrl && paymentUrl.startsWith("http")) {
            window.location.href = paymentUrl;
          } else {
            showToast("Could not get VNPay payment link!", "error");
          }
        } catch (error) {
          console.error("payment-url error:", error);
          showToast("Error getting VNPay payment link!", "error");
        }
      }

    } catch (err) {
      const errorMessage = err.message || 'Failed to place order';
      showToast(errorMessage, 'error');
      console.error('Place order error:', err);
    } finally {
      setLoading(false);
    }
  }, [cartItems, user, formData, totalPrice, paymentMethod, buyNowState, showToast, appliedVoucher?.code, discount, selectedItems, fetchCartItems, validateName, validateAddress, validatePhone]);


  // Format price
  const formatPrice = useCallback((price) => {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);

  // Render items for summary
  const itemsToDisplay = buyNowState
    ? [{
      _id: 'buy-now',
      variant_id: buyNowState.variant,
      pro_price: buyNowState.variant.pro_price || buyNowState.product.pro_price || 0,
      pro_quantity: buyNowState.quantity,
      pro_name: buyNowState.product.pro_name,
    }]
    : selectedItems.length > 0
      ? selectedItems
      : cartItems;

  return (
    <div className="min-h-screen bg-white py-10 px-6">
      <OrderSuccessModal open={!!successInfo} info={{ ...successInfo, message: undefined }} onClose={() => setSuccessInfo(null)} />

      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-yellow-200">
        <h1 className="text-3xl font-bold text-yellow-600 text-center mb-8">
          Checkout
        </h1>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cart Summary */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h2 className="text-xl font-bold text-yellow-800 mb-6">Cart Summary</h2>
            {loading && !buyNowState ? (
              <div className="flex items-center justify-center py-8" role="status" aria-live="true">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                <p className="ml-3 text-gray-600">Loading cart...</p>
              </div>
            ) : itemsToDisplay.length === 0 ? (
              <div className="text-center py-8" role="status">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
                <button
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition font-medium"
                  onClick={() => navigate('/')}
                  aria-label="Continue shopping"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {itemsToDisplay.map((item) => (
                  <div key={item._id} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-yellow-200">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.variant_id?.pro_id?.pro_name || item.pro_name || 'Unnamed Product'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Color: {item.variant_id?.color_id?.color_name || 'N/A'} |
                        Size: {item.variant_id?.size_id?.size_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.pro_quantity || 0} × {formatPrice(item.pro_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-yellow-600">
                        {formatPrice((item.pro_price || 0) * (item.pro_quantity || 0))}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Subtotal:</span>
                    <span className="font-semibold text-gray-900">{formatPrice(totalPrice)}</span>
                  </div>
                  {/* Voucher Section */}
                  <div className="mt-4 pt-4 border-t border-yellow-300">
                    <label htmlFor="voucher" className="block text-sm font-medium text-gray-700 mb-2">
                      Voucher Code
                    </label>
                    {!appliedVoucher ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="voucher"
                          placeholder="Enter voucher code..."
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                        />
                        <button
                          type="button"
                          onClick={handleApplyVoucher}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition font-medium"
                        >
                          Apply
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-green-800">Applied</p>
                            <p className="text-sm text-green-600">
                              {appliedVoucher.code}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveVoucher}
                          className="text-green-600 hover:text-green-800 transition"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Discount and Total */}
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="font-medium">Discount Applied:</span>
                      <span className="font-semibold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <hr className="border-gray-300 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Payment:</span>
                    <span className="text-xl font-bold text-yellow-600">{formatPrice(Math.max(totalPrice - discount, 0))}</span>
                  </div>
                </div>

              </div>
            )}
          </div>
          {/* Checkout Form */}
          {!loading && itemsToDisplay.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                {/* Shipping Information */}
                <fieldset className="space-y-4">
                  <legend className="text-xl font-bold text-yellow-800 mb-4">Shipping Information</legend>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                      placeholder="Your name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                      aria-describedby="name-description"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                      aria-describedby="address-description"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                      aria-describedby="phone-description"
                    />
                  </div>
                </fieldset>

                {/* Payment Method */}
                <fieldset className="space-y-4">
                  <legend className="text-xl font-bold text-yellow-800 mb-4">Payment Method</legend>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={handlePaymentMethodChange}
                        className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Cash on Delivery (COD)</span>
                        <p className="text-xs text-gray-500">Pay when you receive the order</p>
                      </div>
                    </label>

                    <label className="flex items-center p-4 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="VNPAY"
                        checked={paymentMethod === 'VNPAY'}
                        onChange={handlePaymentMethodChange}
                        className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
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
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      paymentMethod === 'COD' ? 'Place Order' : 'Pay with VNPay'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;