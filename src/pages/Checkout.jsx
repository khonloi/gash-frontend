import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import OrderSuccessModal from '../components/OrderSuccessModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../common/axiosClient';
import '../styles/Checkout.css';
import Api from "../common/SummaryAPI";

const Checkout = () => {
  // Shared success modal state
  const [successInfo, setSuccessInfo] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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
    name: user?.name || user?.username || '',
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

      const response = await Api.utils.fetchWithRetry(`/carts?acc_id=${user._id}`, {
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
      const voucher = await Api.voucher.validateCode(voucherCode, totalPrice);
      // Check min order value
      if (totalPrice < voucher.minOrderValue) {
        setToast({
          type: 'error',
          message: `Minimum order value is ${voucher.minOrderValue.toLocaleString()}₫ to use this voucher.`,
        });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      // Calculate discount
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
      setToast({ type: 'success', message: `Voucher applied: -${discountValue.toLocaleString()}₫` });
      console.log("✅ Voucher applied:", voucher);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Invalid or expired voucher code.' });
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
    const name = formData.name.trim();
    const addressReceive = formData.addressReceive.trim();
    const phone = formData.phone.trim();
    if (!name || name.length < 3 || name.length > 30) {
      setError('Name must be between 3 and 30 characters');
      setToast({ type: 'error', message: 'Name must be between 3 and 30 characters' });
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

      // Gọi API checkout qua SummaryAPI
      const checkoutRes = await Api.order.checkout({
        acc_id: user._id,
        addressReceive: formData.addressReceive,
        phone: formData.phone,
        name: formData.name,
        payment_method: paymentMethod,
        voucherCode: appliedVoucher?.code || null,
        items: itemsToOrder.map(item => ({
          variant_id: item.variant_id._id || item.variant_id,
          UnitPrice: item.pro_price,
          Quantity: item.pro_quantity
        })),
        totalPrice: Math.max(totalPrice - discount, 0),
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
          setToast({ type: "error", message: "No orderId returned from checkout!" });
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
            setToast({ type: "error", message: "Could not get VNPay payment link!" });
          }
        } catch (error) {
          console.error("payment-url error:", error);
          setToast({ type: "error", message: "Error getting VNPay payment link!" });
        }
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
      <OrderSuccessModal open={!!successInfo} info={{ ...successInfo, message: undefined }} onClose={() => setSuccessInfo(null)} />
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
                <label htmlFor="voucher" className="checkout-form-label">Voucher code</label>
                {!appliedVoucher ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      id="voucher"
                      placeholder="Enter voucher code..."
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="checkout-form-input"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="checkout-apply-voucher-button"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="voucher-applied-card">
                    <div className="voucher-info">
                      <span className="voucher-icon">🎟️</span>
                      <div className="voucher-text">
                        <p className="voucher-label">Applied</p>
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

              {/* Discount and total after discount */}
              <div className="checkout-cart-total">
                <p>Discount: {discount > 0 ? `- ${formatPrice(discount)}` : '0₫'}</p>
                <p><strong>Total payment: {formatPrice(Math.max(totalPrice - discount, 0))}</strong></p>
              </div>

            </div>
          )}
        </div>
        {!loading && itemsToDisplay.length > 0 && (
          <form onSubmit={handlePlaceOrder} className="checkout-form">
            <fieldset className="checkout-form-group">
              <legend className="checkout-form-title">Shipping Information</legend>
              <div className="checkout-form-field">
                <label htmlFor="name" className="checkout-form-label">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="checkout-form-input"
                  required
                  aria-describedby="name-description"
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
                    Cash on Delivery
                  </label>
                  <label style={{ marginLeft: '1em' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="VNPAY"
                      checked={paymentMethod === 'VNPAY'}
                      onChange={handlePaymentMethodChange}
                    />
                    Pay with VNPay
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