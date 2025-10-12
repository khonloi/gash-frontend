import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
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

      const response = await Api.utils.fetchWithRetry(`/new-carts/account/${user._id}`, {
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
    if (!trimmed) return 'Name is required';
    if (trimmed.length < 3) return 'Name must be at least 3 characters';
    if (trimmed.length > 30) return 'Name cannot exceed 30 characters';
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) return 'Name can only contain letters and spaces';
    return null;
  }, []);

  const validateAddress = useCallback((address) => {
    const trimmed = address.trim();
    if (!trimmed) return 'Address is required';
    if (trimmed.length < 10) return 'Address must be at least 10 characters';
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
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    const nameError = validateName(formData.name);
    const addressError = validateAddress(formData.addressReceive);
    const phoneError = validatePhone(formData.phone);

    if (nameError || addressError || phoneError) {
      showToast(nameError || addressError || phoneError, 'error');
      setLoading(false);
      return;
    }

    try {
      let orderData;
      if (buyNowState) {
        orderData = {
          accountId: user._id,
          addressReceive: formData.addressReceive,
          phone: formData.phone,
          name: formData.name,
          paymentMethod,
          orderDetails: [{
            productId: buyNowState.product._id,
            variantId: buyNowState.variant._id,
            quantity: buyNowState.quantity,
            price: buyNowState.variant?.variantPrice || 0,
          }],
          voucherId: appliedVoucher?._id || null,
          discount: discount,
          totalPrice: totalPrice - discount,
        };
      } else {
        orderData = {
          accountId: user._id,
          addressReceive: formData.addressReceive,
          phone: formData.phone,
          name: formData.name,
          paymentMethod,
          orderDetails: selectedItems.map(item => ({
            productId: item.variantId?.productId?._id || item.variantId?.productId || item.product?._id,
            variantId: item.variantId?._id || item.variantId,
            quantity: item.productQuantity || item.quantity,
            price: item.productPrice || item.variantId?.variantPrice || 0,
          })),
          voucherId: appliedVoucher?._id || null,
          discount: discount,
          totalPrice: totalPrice - discount,
        };
      }

      const response = await axiosClient.post('/orders', orderData);

      if (response.data?.order?._id) {
        setSuccessInfo({
          orderId: response.data.order._id,
          totalPrice: totalPrice - discount,
          paymentMethod,
        });
        showToast('Order placed successfully!', 'success');
      } else {
        showToast('Failed to place order', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to place order', 'error');
      console.error('Place order error:', err);
    } finally {
      setLoading(false);
    }
  };

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
          isOpen={!!successInfo}
          onClose={() => {
            setSuccessInfo(null);
            navigate('/');
          }}
          orderId={successInfo.orderId}
          totalPrice={successInfo.totalPrice}
          paymentMethod={successInfo.paymentMethod}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
  );
};

export default Checkout;