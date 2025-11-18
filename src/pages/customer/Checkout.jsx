import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import OrderSuccessModal from '../../components/OrderSuccessModal';
import CheckoutAuthModal from '../../components/CheckoutAuthModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
// import '../../styles/Checkout.css';
import Api from "../../common/SummaryAPI";
import LoadingSpinner, { LoadingForm, LoadingButton } from '../../components/LoadingSpinner';
import ProductButton from '../../components/ProductButton';
import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';

// === LocalStorage Helpers ===
const CHECKOUT_STORAGE_KEY = 'checkout_persistent_data';

const saveCheckoutData = (data) => {
  try {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save checkout data', err);
  }
};

const loadCheckoutData = () => {
  try {
    const data = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('Failed to load checkout data', err);
    return null;
  }
};

const clearCheckoutData = () => {
  localStorage.removeItem(CHECKOUT_STORAGE_KEY);
};
// === End Helpers ===

const Checkout = () => {
  // Shared success modal state
  const [successInfo, setSuccessInfo] = useState(null);
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // === Restore persistent data from localStorage ===
  const persistentData = loadCheckoutData();

  // === selectedItems & buyNowState with persistence ===
  const selectedItems = useMemo(() => {
    const fromLocation = location.state?.selectedItems;
    if (fromLocation && Array.isArray(fromLocation)) {
      saveCheckoutData({ ...persistentData, selectedItems: fromLocation, buyNowState: null });
      return fromLocation;
    }
    return persistentData?.selectedItems || [];
  }, [location.state?.selectedItems, persistentData?.selectedItems]);

  const buyNowState = useMemo(() => {
    const fromLocation = location.state && location.state.product && location.state.variant && location.state.quantity
      ? {
          product: location.state.product,
          variant: location.state.variant,
          quantity: location.state.quantity,
        }
      : null;

    if (fromLocation) {
      saveCheckoutData({ ...persistentData, selectedItems: null, buyNowState: fromLocation });
      return fromLocation;
    }

    return persistentData?.buyNowState || null;
  }, [location.state, persistentData?.buyNowState]);

  // === Form State with persistence ===
  const [formData, setFormData] = useState({
    addressReceive: '',
    phone: '',
    name: '',
  });

  // Auto-fill from user account on mount (always use account info, not saved data)
  useEffect(() => {
    if (user) {
      // Always use account information when available
      const userFormData = {
        name: user.name || '',
        phone: user.phone || '',
        addressReceive: user.address || '',
      };
      
      // Set form data from account
      setFormData(userFormData);
      
      // Update localStorage with account data
      const saved = loadCheckoutData();
      saveCheckoutData({ ...saved, formData: userFormData });
    }
  }, [user]);

  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requireAuthForCheckout, setRequireAuthForCheckout] = useState(false);
  const [passkeys, setPasskeys] = useState([]);

  // === Fetch cart items (only if not Buy Now and no selectedItems) ===
  const fetchCartItems = useCallback(async () => {
    if (!user?._id) return;

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

  // Fetch user profile to get requireAuthForCheckout setting and passkeys
  const fetchUserSettings = useCallback(async () => {
    if (!user?._id) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch profile to get requireAuthForCheckout setting
      const profileResponse = await Api.accounts.getProfile(user._id);
      setRequireAuthForCheckout(profileResponse.data.requireAuthForCheckout || false);

      // Fetch passkeys
      const passkeysResponse = await Api.passkeys.getUserPasskeys(token);
      setPasskeys(passkeysResponse.data.passkeys || []);
    } catch (err) {
      console.error('Fetch user settings error:', err);
    }
  }, [user]);

  // === Auth & Data Restore Logic ===
  useEffect(() => {
    const token = localStorage.getItem('token');

    // If no token AND no user → redirect
    if (!token && !user) {
      showToast('Please login to continue', 'warning');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    // If token exists but user not loaded → wait (AuthContext may still be loading)
    // Do NOT redirect

    // Fetch user settings
    if (user?._id && token) {
      fetchUserSettings();
    }

    // Fetch cart only if needed
    if (!buyNowState && selectedItems.length === 0 && user?._id && token) {
      fetchCartItems();
    }
  }, [user, navigate, buyNowState, selectedItems.length, fetchCartItems, showToast, location.pathname, fetchUserSettings]);

  // Format price helper
  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }, []);

  // === Calculate total price ===
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

  // === Handle voucher apply ===
  const handleApplyVoucher = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!user || !token) {
        showToast('Please login to apply voucher.', 'error');
        return;
      }

      const applyData = {
        voucherCode: voucherCode.trim().toUpperCase(),
        totalPrice: totalPrice
      };

      const applyResponse = await Api.voucher.applyVoucher(applyData, token);

      if (applyResponse.data && applyResponse.data.success) {
        const { data } = applyResponse.data;

        if (data.voucherId && data.discountAmount > 0) {
          setAppliedVoucher({
            _id: data.voucherId,
            code: data.code,
            discountType: 'percentage',
            discountValue: data.discountAmount
          });
          setDiscount(data.discountAmount);
          showToast(`Voucher applied: -${data.discountAmount.toLocaleString()}₫`, 'success');
        } else if (data.voucherId && data.discountAmount === 0) {
          showToast(`Voucher "${data.code}" is valid but no discount applied.`, 'info');
        } else {
          showToast('No voucher applied.', 'info');
        }
      } else {
        const errorMessage = applyResponse.data?.message || 'Failed to apply voucher';
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Invalid or expired voucher code.';
      showToast(errorMessage, 'error');
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode('');
  };

  // === Validation ===
  const validateName = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return 'Recipient name is required';
    if (trimmed.length < 5) return 'Recipient name must be at least 5 characters';
    if (trimmed.length > 50) return 'Recipient name cannot exceed 50 characters';
    if (!/^[\p{L}\s]+$/u.test(trimmed)) return 'Recipient name can only contain letters and spaces';
    return null;
  }, []);

  const validateAddress = useCallback((address) => {
    const trimmed = address.trim();
    if (!trimmed) return 'Address is required';
    if (trimmed.length < 5) return 'Address must be at least 5 characters';
    if (trimmed.length > 150) return 'Address cannot exceed 150 characters';
    return null;
  }, []);

  const validatePhone = useCallback((phone) => {
    const trimmed = phone.trim();
    if (!trimmed) return 'Phone number is required';
    if (!/^\d+$/.test(trimmed)) return 'Phone number must contain only digits';
    if (trimmed.length < 7) return 'Phone number must be at least 7 digits';
    if (trimmed.length > 20) return 'Phone number must not exceed 20 digits';
    return null;
  }, []);

  // === Handle input change with persistence ===
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      const saved = loadCheckoutData();
      saveCheckoutData({ ...saved, formData: newData });
      return newData;
    });
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  // === Helper function to check if item is inactive ===
  const isItemInactive = useCallback((item, variantData, productData) => {
    const stockQuantity = variantData?.stockQuantity ?? 0;
    const isVariantDiscontinued = variantData?.variantStatus === "discontinued";
    const isProductDiscontinued = productData?.productStatus === "discontinued";
    const isOutOfStock = stockQuantity <= 0;
    return isVariantDiscontinued || isProductDiscontinued || isOutOfStock;
  }, []);

  // === Check items validity (similar to voucher check) ===
  const checkItemsValidity = useCallback(() => {
    if (!buyNowState && selectedItems.length === 0) return;

    const inactiveItems = [];

    if (buyNowState) {
      const variantData = buyNowState.variant;
      const productData = buyNowState.product;
      if (isItemInactive(buyNowState, variantData, productData)) {
        const stockQuantity = variantData?.stockQuantity ?? 0;
        const isVariantDiscontinued = variantData?.variantStatus === "discontinued";
        const isProductDiscontinued = productData?.productStatus === "discontinued";
        const isOutOfStock = stockQuantity <= 0;
        
        let message = '';
        if (isProductDiscontinued || isVariantDiscontinued) {
          message = `${productData?.productName || 'Product'} is discontinued and cannot be purchased.`;
        } else if (isOutOfStock) {
          message = `${productData?.productName || 'Product'} is out of stock and cannot be purchased.`;
        }
        inactiveItems.push(message);
      }
    } else {
      selectedItems.forEach((item) => {
        const variantData = item.variantId || item.variant;
        const productData = item.variantId?.productId || item.product;
        if (isItemInactive(item, variantData, productData)) {
          const stockQuantity = variantData?.stockQuantity ?? 0;
          const isVariantDiscontinued = variantData?.variantStatus === "discontinued";
          const isProductDiscontinued = productData?.productStatus === "discontinued";
          const isOutOfStock = stockQuantity <= 0;
          
          let message = '';
          if (isProductDiscontinued || isVariantDiscontinued) {
            message = `${productData?.productName || 'Product'} is discontinued and cannot be purchased.`;
          } else if (isOutOfStock) {
            message = `${productData?.productName || 'Product'} is out of stock and cannot be purchased.`;
          }
          inactiveItems.push(message);
        }
      });
    }

    if (inactiveItems.length > 0) {
      const errorMessage = inactiveItems.length === 1 
        ? inactiveItems[0]
        : `Some items cannot be purchased. ${inactiveItems.slice(0, 2).join(' ')}${inactiveItems.length > 2 ? ` and ${inactiveItems.length - 2} more.` : ''}`;
      showToast(errorMessage, 'error');
      return false;
    }

    return true;
  }, [buyNowState, selectedItems, isItemInactive, showToast]);

  // === Check items when loaded ===
  useEffect(() => {
    if (buyNowState || selectedItems.length > 0) {
      checkItemsValidity();
    }
  }, [buyNowState, selectedItems, checkItemsValidity]);

  // Internal order placement function (called after authentication if required)
  const handlePlaceOrderInternal = useCallback(async () => {
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

    // Check for inactive/discontinued/out of stock items
    if (!checkItemsValidity()) {
      setLoading(false);
      return;
    }

    const nameError = validateName(formData.name);
    const addressError = validateAddress(formData.addressReceive);
    const phoneError = validatePhone(formData.phone);

    if (nameError || addressError || phoneError) {
      showToast(nameError || addressError || phoneError, 'error');
      setLoading(false);
      return;
    }

    const trimmedName = formData.name.trim();
    const trimmedAddress = formData.addressReceive.trim();
    const trimmedPhone = formData.phone.trim();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

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

      const checkoutRes = await Api.order.checkout(orderData, token);

      if (paymentMethod === 'COD') {
        // Clear purchased items from cart
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

        // Refresh cart
        if (typeof fetchCartItems === 'function') {
          await fetchCartItems();
        }

        // Clear persistent data
        clearCheckoutData();
        
        // Reset authentication state
        setIsAuthenticated(false);

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
        const orderId = checkoutRes?.data?.data?.order?._id || checkoutRes?.data?.data?.order?.id || checkoutRes?.data?.data?.orderId;

        if (!orderId) {
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
            clearCheckoutData(); // Clear before redirect
            window.location.href = paymentUrl;
          } else {
            showToast("Could not get VNPay payment link!", "error");
            setLoading(false);
          }
        } catch (error) {
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
  }, [
    cartItems, user, formData, totalPrice, paymentMethod, buyNowState, showToast,
    appliedVoucher, discount, selectedItems, fetchCartItems, validateName,
    validateAddress, validatePhone, checkItemsValidity
  ]);

  // Handle authentication success
  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    // Proceed with order placement
    handlePlaceOrderInternal();
  }, [handlePlaceOrderInternal]);

  // === Handle place order (with authentication check) ===
  const handlePlaceOrder = useCallback(async (e) => {
    e.preventDefault();

    // Check if authentication is required
    if (requireAuthForCheckout && !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // If already authenticated or not required, proceed
    handlePlaceOrderInternal();
  }, [requireAuthForCheckout, isAuthenticated, handlePlaceOrderInternal]);

  // === Blur validation ===
  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    let error;
    if (name === 'name') error = validateName(value);
    if (name === 'addressReceive') error = validateAddress(value);
    if (name === 'phone') error = validatePhone(value);
    if (error) showToast(error, 'error');
  };

  // === Items to display ===
  const itemsToDisplay = buyNowState
    ? [buyNowState]
    : selectedItems.length > 0
      ? selectedItems
      : cartItems;

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
                          Color: {variantData?.productColorId?.color_name || 'N/A'}, Size: {variantData?.productSizeId?.size_name || 'N/A'}
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