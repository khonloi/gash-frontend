import { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../hooks/useToast';
import Api from "../../../common/SummaryAPI";

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

export const useCheckout = () => {
  const [successInfo, setSuccessInfo] = useState(null);
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const persistentData = loadCheckoutData();

  const selectedItems = useMemo(() => {
    const fromLocation = location.state?.selectedItems;
    if (fromLocation && Array.isArray(fromLocation)) {
      saveCheckoutData({ ...persistentData, selectedItems: fromLocation, buyNowState: null });
      return fromLocation;
    }
    return persistentData?.selectedItems || [];
  }, [location.state?.selectedItems, persistentData]);

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
  }, [location.state, persistentData]);

  const [formData, setFormData] = useState({
    addressReceive: '',
    phone: '',
    name: '',
  });

  useEffect(() => {
    if (user) {
      const userFormData = {
        name: user.name || '',
        phone: user.phone || '',
        addressReceive: user.address || '',
      };
      
      setFormData(userFormData);
      
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

  const fetchCartItems = useCallback(async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await Api.newCart.getByAccount(user._id, token);
      setCartItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      let errorMessage = 'Failed to load cart items';
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (!err.response) {
        errorMessage = 'Failed to load cart items. Please try again later.';
      }
      
      showToast(errorMessage, 'error');
      console.error('Fetch cart items error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const fetchUserSettings = useCallback(async () => {
    if (!user?._id) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const profileResponse = await Api.accounts.getProfile(user._id);
      setRequireAuthForCheckout(profileResponse.data.requireAuthForCheckout || false);

      const passkeysResponse = await Api.passkeys.getUserPasskeys(token);
      setPasskeys(passkeysResponse.data.passkeys || []);
    } catch (err) {
      console.error('Fetch user settings error:', err);
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token && !user) {
      showToast('Please login to continue', 'warning');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (user?._id && token) {
      fetchUserSettings();
    }

    if (!buyNowState && selectedItems.length === 0 && user?._id && token) {
      fetchCartItems();
    }
  }, [user, navigate, buyNowState, selectedItems.length, fetchCartItems, showToast, location.pathname, fetchUserSettings]);

  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }, []);

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

  const validateName = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return 'Please fill in all required fields';
    if (trimmed.length < 2 || trimmed.length > 100) return 'Recipient name must be between 2 and 100 characters';
    if (!/^[\p{L}\s]+$/u.test(trimmed)) return 'Recipient name must contain only letters and spaces';
    return null;
  }, []);

  const validateAddress = useCallback((address) => {
    const trimmed = address.trim();
    if (!trimmed) return 'Please fill in all required fields';
    if (trimmed.length < 5 || trimmed.length > 150) return 'Address must be between 5 and 150 characters.';
    if (!/^[\p{L}\p{N}\s,/-]+$/u.test(trimmed)) return 'Address must only contain letters, numbers, commas and slashes';
    return null;
  }, []);

  const validatePhone = useCallback((phone) => {
    const trimmed = phone.trim();
    if (!trimmed) return 'Please fill in all required fields';
    if (!/^\d{10}$/.test(trimmed)) return 'Phone number must be 10 digits';
    return null;
  }, []);

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

  const isItemInactive = useCallback((item, variantData, productData) => {
    const stockQuantity = variantData?.stockQuantity ?? 0;
    const isVariantDiscontinued = variantData?.variantStatus === "discontinued";
    const isProductDiscontinued = productData?.productStatus === "discontinued";
    const isOutOfStock = stockQuantity <= 0;
    return isVariantDiscontinued || isProductDiscontinued || isOutOfStock;
  }, []);

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

  useEffect(() => {
    if (buyNowState || selectedItems.length > 0) {
      checkItemsValidity();
    }
  }, [buyNowState, selectedItems, checkItemsValidity]);

  const handlePlaceOrderInternal = useCallback(async () => {
    setLoading(true);

    const isBuyNow = !!buyNowState;
    const itemsToOrder = isBuyNow
      ? [{
          variantId: buyNowState.variant._id,
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
        accountId: user._id,
        addressReceive: trimmedAddress,
        phone: trimmedPhone,
        name: trimmedName,
        paymentMethod: paymentMethod,
        voucherCode: appliedVoucher?.code || null,
        items: itemsToOrder.map(item => ({
          variantId: item.variantId?._id || item.variantId || item.variant?._id,
          unitPrice: item.productPrice || item.pro_price || item.variantId?.variantPrice || item.variant?.variantPrice || 0,
          Quantity: item.productQuantity || item.quantity || item.pro_quantity,
        })),
        totalPrice: totalPrice,
      };

      const checkoutRes = await Api.order.checkout(orderData, token);

      if (paymentMethod === 'COD') {
        if (!isBuyNow && itemsToOrder.length > 0) {
          try {
            const boughtCartIds = itemsToOrder
              .map(item => {
                const variantId = item.variantId?._id || item.variantId || item.variant?._id;
                const cartItem = cartItems.find(ci => (ci.variantId?._id || ci.variantId || ci.variant?._id) === variantId);
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

        clearCheckoutData();
        setIsAuthenticated(false);

        setSuccessInfo({
          status: 'success',
          message: 'Your order will be promptly prepared and sent to you.',
          orderId: checkoutRes?.data?.data?.order?._id || checkoutRes?.data?.data?.order?.id || checkoutRes?.data?.data?.orderId,
          amount: Math.max(totalPrice - discount, 0),
          paymentMethod: 'COD',
        });
        showToast('Order created successfully', 'success');
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
            clearCheckoutData();
            window.location.href = paymentUrl;
          } else {
            showToast("Could not get VNPay payment link!", "error");
            setLoading(false);
          }
        } catch {
          showToast("Error getting VNPay payment link!", "error");
          setLoading(false);
        }
      }
    } catch (err) {
      let errorMessage = 'Failed to place order';
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (!err.response) {
        errorMessage = 'Failed to place order. Please try again later.';
      }
      
      showToast(errorMessage, 'error');
      console.error('Place order error:', err);
      setLoading(false);
    }
  }, [
    cartItems, user, formData, totalPrice, paymentMethod, buyNowState, showToast,
    appliedVoucher, discount, selectedItems, fetchCartItems, validateName,
    validateAddress, validatePhone, checkItemsValidity
  ]);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    handlePlaceOrderInternal();
  }, [handlePlaceOrderInternal]);

  const handlePlaceOrder = useCallback(async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (requireAuthForCheckout && !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    handlePlaceOrderInternal();
  }, [requireAuthForCheckout, isAuthenticated, handlePlaceOrderInternal]);

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

  return {
    successInfo,
    setSuccessInfo,
    user,
    location,
    navigate,
    selectedItems,
    buyNowState,
    formData,
    cartItems,
    paymentMethod,
    loading,
    voucherCode,
    setVoucherCode,
    discount,
    appliedVoucher,
    showAuthModal,
    setShowAuthModal,
    isAuthenticated,
    setIsAuthenticated,
    requireAuthForCheckout,
    passkeys,
    fetchCartItems,
    formatPrice,
    totalPrice,
    handleApplyVoucher,
    handleRemoveVoucher,
    handleInputChange,
    handlePaymentMethodChange,
    isItemInactive,
    checkItemsValidity,
    handlePlaceOrderInternal,
    handleAuthSuccess,
    handlePlaceOrder,
    handleFieldBlur,
    itemsToDisplay,
    clearCheckoutData
  };
};
