import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../common/axiosClient';
import '../styles/Checkout.css';
import Api from "../common/SummaryAPI"; // ✅ thêm API voucher

// API functions
const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosClient.get(url, options);
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const selectedItems = location.state?.selectedItems || [];
  const buyNowState = location.state && location.state.product && location.state.variant && location.state.quantity
    ? {
      product: location.state.product,
      variant: location.state.variant,
      quantity: location.state.quantity,
    }
    : null;
  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState({
    addressReceive: '',
    phone: '',
    username: user?.username || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD'); // Updated to match backend enum
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  // ✅ Voucher state
const [voucherCode, setVoucherCode] = useState('');
const [discount, setDiscount] = useState(0);
const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Fetch cart items (only if not Buy Now)
  const fetchCartItems = useCallback(async () => {
    if (!user?._id) {
      setError('User not authenticated');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetchWithRetry(`/carts?acc_id=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err.message || 'Failed to load cart items');
      console.error('Fetch cart items error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    const voucher = await Api.voucher.validateCode(voucherCode, totalPrice);
    // Kiểm tra đơn hàng có đạt minOrderValue không
    if (totalPrice < voucher.minOrderValue) {
      setToast({
        type: 'error',
        message: `Đơn hàng tối thiểu phải đạt ${voucher.minOrderValue.toLocaleString()}₫ để dùng voucher này.`,
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Tính giá trị giảm
    let discountValue = 0;
    if (voucher.discountType === 'percentage') {
      discountValue = (totalPrice * voucher.discountValue) / 100;
      if (voucher.maxDiscount && discountValue > voucher.maxDiscount)
        discountValue = voucher.maxDiscount;
    } else {
      discountValue = voucher.discountValue;
    }

    setAppliedVoucher(voucher);
    setDiscount(discountValue);
    setToast({ type: 'success', message: `Áp dụng voucher thành công: -${discountValue.toLocaleString()}₫` });
    console.log("✅ Voucher applied:", voucher);
    setTimeout(() => setToast(null), 3000);
  } catch (err) {
    setToast({ type: 'error', message: err.message || 'Mã voucher không hợp lệ hoặc đã hết hạn.' });
    setTimeout(() => setToast(null), 3000);
  }
};

// Xóa voucher đã áp dụng
const handleRemoveVoucher = () => {
  setAppliedVoucher(null);
  setDiscount(0);
  setVoucherCode('');
};


  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

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
      setError('Your cart is empty');
      setToast({ type: 'error', message: 'Your cart is empty' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Trim and validate fields
    const username = formData.username.trim();
    const addressReceive = formData.addressReceive.trim();
    const phone = formData.phone.trim();
    if (!username || username.length < 3 || username.length > 30) {
      setError('Username must be 3-30 characters');
      setToast({ type: 'error', message: 'Username must be 3-30 characters' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!addressReceive || addressReceive.length > 100) {
      setError('Address is required and cannot exceed 100 characters');
      setToast({ type: 'error', message: 'Address is required and cannot exceed 100 characters' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!phone || !/^\d{10}$/.test(phone)) {
      setError('Phone number must be exactly 10 digits');
      setToast({ type: 'error', message: 'Phone number must be exactly 10 digits' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Create order
      const orderResponse = await axiosClient.post(
  '/orders',
  {
    acc_id: user._id,
    addressReceive: formData.addressReceive,
    phone: formData.phone,
    totalPrice: Math.max(totalPrice - discount, 0), // ✅ tổng sau giảm
    voucherCode: appliedVoucher?.code || null,      // ✅ lưu mã nếu có
    order_status: 'pending',
    pay_status: 'unpaid',
    payment_method: paymentMethod,
    refund_status: 'not_applicable',
    feedback_order: '',
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

      const orderId = orderResponse.data.order._id;

      // Create order details
      await Promise.all(
        itemsToOrder.map(async (item) => {
          await axiosClient.post(
            '/order-details',
            {
              order_id: orderId,
              variant_id: item.variant_id,
              UnitPrice: item.pro_price || 0,
              Quantity: item.pro_quantity || 1,
              feedback_details: '',
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        })
      );

      if (paymentMethod === 'COD') {
        // Clear cart if not Buy Now
        if (!isBuyNow) {
          await Promise.all(
            cartItems.map(async (item) => {
              await axiosClient.delete(`/carts/${item._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
            })
          );
        }
        setToast({ type: 'success', message: 'Order placed successfully!' });
        setTimeout(() => {
          setToast(null);
          navigate('/orders', { state: { forceFetch: true } });
        }, 3000);
      } else if (paymentMethod === 'VNPAY') {
        // Call backend to get VNPay payment URL
        const paymentUrlRes = await axiosClient.post(
          '/orders/payment-url',
          {
            orderId,
            bankCode: '',
            language: 'vn',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Redirect to VNPay payment page
        window.location.href = paymentUrlRes.data.paymentUrl;
        return;
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to place order';
      setError(errorMessage);
      setToast({ type: 'error', message: errorMessage });
      setTimeout(() => setToast(null), 3000);
      console.error('Place order error:', err);
    } finally {
      setLoading(false);
    }
  }, [cartItems, user, formData, totalPrice, navigate, paymentMethod, buyNowState]);

  // Retry fetching cart items
  const handleRetry = useCallback(() => {
    fetchCartItems();
  }, [fetchCartItems]);

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
    <div className="checkout-container">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`checkout-toast ${toast.type === 'success' ? 'checkout-toast-success' : 'checkout-toast-error'}`}
          role="alert"
        >
          {toast.message}
        </div>
      )}

      <h1 className="checkout-title">Checkout</h1>

      {/* Error Display */}
      {error && (
        <div className="checkout-error" role="alert" aria-live="true">
          <span className="checkout-error-icon">⚠</span>
          <span>{error}</span>
          {error.includes('Failed to load') && (
            <button
              className="checkout-retry-button"
              onClick={handleRetry}
              aria-label="Retry loading cart items"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <div className="checkout-main-section">
        <div className="checkout-cart-summary">
          <h2 className="checkout-cart-title">Cart Summary</h2>
          {loading && !buyNowState ? (
            <div className="checkout-loading" role="status" aria-live="true">
              <div className="checkout-loading-spinner"></div>
              <p>Loading cart...</p>
            </div>
          ) : itemsToDisplay.length === 0 ? (
            <div className="checkout-empty-cart" role="status">
              <p>Your cart is empty.</p>
              <button
                className="checkout-continue-shopping-button"
                onClick={() => navigate('/')}
                aria-label="Continue shopping"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="checkout-cart-items">
              {itemsToDisplay.map((item) => (
                <div key={item._id} className="checkout-cart-item">
                  <div className="checkout-item-info">
                    <p className="checkout-item-name">
                      {item.variant_id?.pro_id?.pro_name || item.pro_name || 'Unnamed Product'}
                    </p>
                    <p className="checkout-item-variant">
                      Color: {item.variant_id?.color_id?.color_name || 'N/A'},
                      Size: {item.variant_id?.size_id?.size_name || 'N/A'}
                    </p>
                    <p className="checkout-item-quantity">Quantity: {item.pro_quantity || 0}</p>
                    <p className="checkout-item-price">Price: {formatPrice(item.pro_price)}</p>
                  </div>
                  <p className="checkout-item-total">
                    {formatPrice((item.pro_price || 0) * (item.pro_quantity || 0))}
                  </p>
                </div>
              ))}
              <div className="checkout-cart-total">
                <p>Total: {formatPrice(totalPrice)}</p>
              </div>
              {/* Voucher input */}
<div className="checkout-voucher-section">
  <label htmlFor="voucher" className="checkout-form-label">Mã giảm giá</label>
  {!appliedVoucher ? (
    <div className="flex gap-2 mt-1">
      <input
        type="text"
        id="voucher"
        placeholder="Nhập mã voucher..."
        value={voucherCode}
        onChange={(e) => setVoucherCode(e.target.value)}
        className="checkout-form-input"
      />
      <button
        type="button"
        onClick={handleApplyVoucher}
        className="checkout-apply-voucher-button"
      >
        Áp dụng
      </button>
    </div>
  ) : (
    <div className="voucher-applied-card">
  <div className="voucher-info">
    <span className="voucher-icon">🎟️</span>
    <div className="voucher-text">
      <p className="voucher-label">Đã áp dụng</p>
      <p className="voucher-code">
        {appliedVoucher.code} <span className="voucher-discount">(-{formatPrice(discount)})</span>
      </p>
    </div>
  </div>
  <button onClick={handleRemoveVoucher} className="voucher-remove-btn">
    ✕
  </button>
</div>

  )}
</div>

{/* Tổng sau giảm */}
<div className="checkout-cart-total">
  <p>Giảm giá: {discount > 0 ? `- ${formatPrice(discount)}` : '0₫'}</p>
  <p><strong>Tổng thanh toán: {formatPrice(Math.max(totalPrice - discount, 0))}</strong></p>
</div>

            </div>
          )}
        </div>
        {!loading && itemsToDisplay.length > 0 && (
          <form onSubmit={handlePlaceOrder} className="checkout-form">
            <fieldset className="checkout-form-group">
              <legend className="checkout-form-title">Shipping Information</legend>
              <div className="checkout-form-field">
                <label htmlFor="username" className="checkout-form-label">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="checkout-form-input"
                  required
                  aria-describedby="username-description"
                />
              </div>
              <div className="checkout-form-field">
                <label htmlFor="addressReceive" className="checkout-form-label">
                  Address
                </label>
                <input
                  type="text"
                  id="addressReceive"
                  name="addressReceive"
                  value={formData.addressReceive}
                  onChange={handleInputChange}
                  className="checkout-form-input"
                  required
                  aria-describedby="address-description"
                />
              </div>
              <div className="checkout-form-field">
                <label htmlFor="phone" className="checkout-form-label">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="checkout-form-input"
                  required
                  aria-describedby="phone-description"
                />
              </div>
              <div className="checkout-form-field">
                <label className="checkout-form-label">Payment Method</label>
                <div className="checkout-payment-methods">
                  <label>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={handlePaymentMethodChange}
                    />
                    Pay by Cash on Delivery
                  </label>
                  <label style={{ marginLeft: '1em' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={paymentMethod === 'VNPAY'}
                      onChange={handlePaymentMethodChange}
                    />
                    Pay by VNPay
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="checkout-place-order-button"
                aria-label="Place order"
              >
                {loading ? 'Placing Order...' : paymentMethod === 'COD' ? 'Place Order' : 'Pay with VNPay'}
              </button>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
};

export default Checkout;