import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../common/axiosClient';
import '../styles/Cart.css';

const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosClient.get(url, options);
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const useDebouncedCallback = (callback, delay) => {
  const timeoutRef = useRef();
  const cleanup = () => timeoutRef.current && clearTimeout(timeoutRef.current);
  const debounced = useCallback((...args) => {
    cleanup();
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
  useEffect(() => cleanup, []);
  return debounced;
};

const Cart = () => {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const cartCache = useRef({ items: [], timestamp: 0 });

  // Fetch cart items
  const fetchCartItems = useCallback(async (showLoading = true) => {
    if (!user?._id) return;

    const now = Date.now();
    if (cartCache.current.items.length > 0 &&
      now - cartCache.current.timestamp < 30000 &&
      !showLoading) {
      setCartItems(cartCache.current.items);
      return;
    }

    if (showLoading) setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetchWithRetry(`/carts?acc_id=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = Array.isArray(response) ? response.map(i => ({ ...i, checked: true })) : [];
      setCartItems(items);
      cartCache.current = { items, timestamp: now };
    } catch (err) {
      setError(err.message || 'Failed to load cart items');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user && !localStorage.getItem('token')) {
      navigate('/login', { replace: true });
    } else if (user) {
      fetchCartItems();
    }
  }, [user, navigate, fetchCartItems]);

  const debouncedUpdateQuantity = useDebouncedCallback(async (itemId, newQuantity, originalQuantity) => {
    if (!user?._id || newQuantity < 1) return;
    setActionInProgress(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      await axiosClient.put(
        `/carts/${itemId}`,
        { pro_quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedItems = cartItems.map(item =>
        item._id === itemId
          ? { ...item, pro_quantity: newQuantity }
          : item
      );
      setCartItems(updatedItems);
      cartCache.current = { items: updatedItems, timestamp: Date.now() };

    } catch (err) {
      const errorMessage = err.message || 'Failed to update quantity';
      setError(errorMessage);
      setCartItems(prev =>
        prev.map(item =>
          item._id === itemId
            ? { ...item, pro_quantity: originalQuantity }
            : item
        )
      );
      setToast({ type: 'error', message: errorMessage });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActionInProgress(false);
    }
  }, 500);

  const handleRemoveItem = useCallback(async (itemId) => {
    if (!user?._id) return;
    setActionInProgress(true);
    setError('');
    const previousItems = [...cartItems];
    setCartItems(prev => prev.filter(item => item._id !== itemId));
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      await axiosClient.delete(`/carts/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cartCache.current = {
        items: cartItems.filter(item => item._id !== itemId),
        timestamp: Date.now()
      };
    } catch (err) {
      const errorMessage = err.message || 'Failed to remove item';
      setError(errorMessage);
      setCartItems(previousItems);
      setToast({ type: 'error', message: errorMessage });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActionInProgress(false);
    }
  }, [cartItems, user]);

  const formatPrice = useCallback((price) => {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);

  // ✅ chỉ tính tổng những item có checked = true
  const totalPrice = useMemo(() => {
    return cartItems
      .filter(item => item.checked)
      .reduce((total, item) => {
        const price = item.variant_id?.pro_id?.pro_price || 0;
        const quantity = item.pro_quantity || 0;
        return total + (price * quantity);
      }, 0);
  }, [cartItems]);

  const handleQuantityChange = useCallback((itemId, value) => {
    const newQuantity = parseInt(value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      const currentItem = cartItems.find(item => item._id === itemId);
      const originalQuantity = currentItem ? currentItem.pro_quantity : 1;
      setCartItems(prev => prev.map(item =>
        item._id === itemId ? { ...item, pro_quantity: newQuantity } : item
      ));
      debouncedUpdateQuantity(itemId, newQuantity, originalQuantity);
    }
  }, [cartItems, debouncedUpdateQuantity]);

  const handleRetry = useCallback(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const toggleChecked = (itemId) => {
    setCartItems(prev =>
      prev.map(item =>
        item._id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  if (loading) {
    return (
      <div className="cart-container">
        <div className="product-list-loading" role="status" aria-live="polite">
          <div className="product-list-loading-spinner" aria-hidden="true"></div>
          Loading cart...
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2 className="cart-title">Shopping Cart</h2>

      {toast && (
        <div className={`cart-toast ${toast.type === 'success' ? 'cart-toast-success' : 'cart-toast-error'}`} role="alert">
          {toast.message}
        </div>
      )}
      {error && (
        <div className="product-list-error" role="alert" tabIndex={0} aria-live="polite">
          <span className="product-list-error-icon" aria-hidden="true">⚠</span>
          {error}
          <button
            className="product-list-retry-button"
            onClick={handleRetry}
            aria-label="Retry loading cart items"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && cartItems.length === 0 && !error ? (
        <div className="cart-empty" role="status">
          <h3>Your cart is empty.</h3>
          <button
            className="cart-continue-shopping-button"
            onClick={() => navigate('/products')}
            aria-label="Continue shopping"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <main className="cart-main-section" role="main">
          <section className="cart-items" aria-label="Cart items">
            {cartItems.map((item) => (
              <article key={item._id} className="cart-item" tabIndex={0} aria-label={`Cart item: ${item.variant_id?.pro_id?.pro_name || 'Unnamed Product'}`}>
                <input
                  type="checkbox"
                  checked={item.checked || false}
                  onChange={() => toggleChecked(item._id)}
                  className="cart-item-checkbox"
                />
                <img
                  src={item.variant_id?.pro_id?.imageURL || '/default.png'}
                  alt={item.variant_id?.pro_id?.pro_name || 'Product'}
                  className="cart-item-image"
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.variant_id?.pro_id?.pro_name || 'Unnamed Product'}</p>
                  <p className="cart-item-variant">
                    Color: {item.variant_id?.color_id?.color_name || 'N/A'},
                    Size: {item.variant_id?.size_id?.size_name || 'N/A'}
                  </p>
                  <p className="cart-item-price">Price: {formatPrice(item.variant_id?.pro_id?.pro_price)}</p>
                  <p className="cart-item-total">
                    Total: {formatPrice((item.variant_id?.pro_id?.pro_price || 0) * (item.pro_quantity || 0))}
                  </p>
                </div>
                <div className="cart-item-action">
                  <div className="cart-item-quantity">
                    <div className="cart-quantity-group">
                      <label htmlFor={`quantity-${item._id}`} className="cart-quantity-label">Quantity</label>
                      <input
                        type="number"
                        id={`quantity-${item._id}`}
                        min="1"
                        value={item.pro_quantity || 1}
                        onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                        className="cart-quantity-input"
                        aria-label={`Quantity for ${item.variant_id?.pro_id?.pro_name || 'product'}`}
                        disabled={actionInProgress}
                      />
                    </div>
                    <button
                      className="cart-remove-button"
                      onClick={() => handleRemoveItem(item._id)}
                      aria-label={`Remove ${item.variant_id?.pro_id?.pro_name || 'product'} from cart`}
                      disabled={actionInProgress}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
          {cartItems.length > 0 && (
            <aside className="cart-summary" aria-label="Cart summary">
              <p className="cart-total">Total: {formatPrice(totalPrice)}</p>
              <button
                className="cart-checkout-button"
                onClick={() => {
                  const selectedItems = cartItems.filter(i => i.checked); // chỉ lấy sp đã tick
                  navigate('/checkout', { state: { selectedItems } });
                }}

                disabled={cartItems.filter(i => i.checked).length === 0 || loading || actionInProgress}
                aria-label="Proceed to checkout"
              >
                Proceed to Checkout
              </button>
            </aside>
          )}
        </main>
      )}
    </div>
  );
};

export default Cart;
