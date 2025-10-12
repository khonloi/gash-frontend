import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../common/axiosClient";
import "../styles/Cart.css";

const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosClient.get(url, options);
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
    }
  }
};

const useDebouncedCallback = (callback, delay) => {
  const timeoutRef = useRef();
  const cleanup = () => timeoutRef.current && clearTimeout(timeoutRef.current);
  const debounced = useCallback(
    (...args) => {
      cleanup();
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
  useEffect(() => cleanup, []);
  return debounced;
};

const Cart = () => {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const cartCache = useRef({ items: [], timestamp: 0 });

  // Fetch cart items
  const fetchCartItems = useCallback(
    async (showLoading = true) => {
      if (!user?._id) {
        console.log("No user ID, skipping fetch");
        return;
      }

      const now = Date.now();
      console.log("Cache check:", {
        items: cartCache.current.items.length,
        timestamp: cartCache.current.timestamp,
        age: now - cartCache.current.timestamp,
      });
      // Temporarily disable cache to ensure fresh data
      // if (cartCache.current.items.length > 0 &&
      //     now - cartCache.current.timestamp < 30000 &&
      //     !showLoading) {
      //   console.log('Using cached cart items:', cartCache.current.items);
      //   setCartItems(cartCache.current.items);
      //   return;
      // }

      if (showLoading) setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        console.log("Fetching cart for user:", user._id);
        const response = await fetchWithRetry(
          `/new-carts/account/${user._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Cart fetch response:", response);
        const data = response.data; // Access the data property
        const items = Array.isArray(data)
          ? data
              .map((i) => {
                if (!i.variantId) {
                  console.warn("Cart item missing variantId:", i);
                  return null;
                }
                return { ...i, checked: i.selected };
              })
              .filter((item) => item !== null)
          : [];
        console.log("Processed cart items:", items);
        setCartItems(items);
        cartCache.current = { items, timestamp: now };
      } catch (err) {
        console.error("Fetch cart error:", err);
        setError(err.message || "Failed to load cart items");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    console.log("User:", user, "Token:", localStorage.getItem("token"));
    if (!user && !localStorage.getItem("token")) {
      navigate("/login", { replace: true });
    } else if (user) {
      fetchCartItems();
    }
  }, [user, navigate, fetchCartItems]);

  useEffect(() => {
    console.log("Cart items updated:", cartItems);
  }, [cartItems]);

  const debouncedUpdateQuantity = useDebouncedCallback(
    async (cartId, newQuantity, originalQuantity) => {
      if (!user?._id || newQuantity < 1) return;
      setActionInProgress(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        console.log(
          "Updating quantity for cartId:",
          cartId,
          "to:",
          newQuantity
        );
        await axiosClient.put(
          `/new-carts/${cartId}`,
          { productQuantity: newQuantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedItems = cartItems.map((item) =>
          item._id === cartId ? { ...item, productQuantity: newQuantity } : item
        );
        setCartItems(updatedItems);
        cartCache.current = { items: updatedItems, timestamp: Date.now() };
      } catch (err) {
        const errorMessage = err.message || "Failed to update quantity";
        console.error("Update quantity error:", err);
        setError(errorMessage);
        setCartItems((prev) =>
          prev.map((item) =>
            item._id === cartId
              ? { ...item, productQuantity: originalQuantity }
              : item
          )
        );
        setToast({ type: "error", message: errorMessage });
        setTimeout(() => setToast(null), 3000);
      } finally {
        setActionInProgress(false);
      }
    },
    500
  );

  const handleRemoveItem = useCallback(
    async (cartId) => {
      if (!user?._id) return;
      setActionInProgress(true);
      setError("");
      const previousItems = [...cartItems];
      setCartItems((prev) => prev.filter((item) => item._id !== cartId));
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        console.log("Removing cart item:", cartId);
        await axiosClient.delete(`/new-carts/${cartId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        cartCache.current = {
          items: cartItems.filter((item) => item._id !== cartId),
          timestamp: Date.now(),
        };
      } catch (err) {
        const errorMessage = err.message || "Failed to remove item";
        console.error("Remove item error:", err);
        setError(errorMessage);
        setCartItems(previousItems);
        setToast({ type: "error", message: errorMessage });
        setTimeout(() => setToast(null), 3000);
      } finally {
        setActionInProgress(false);
      }
    },
    [cartItems, user]
  );

  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }, []);

  // Calculate total for selected items
  const totalPrice = useMemo(() => {
    return cartItems
      .filter((item) => item.checked)
      .reduce((total, item) => {
        const price = item.productPrice || 0;
        const quantity = parseInt(item.productQuantity, 10) || 0;
        return total + price * quantity;
      }, 0);
  }, [cartItems]);

  const handleQuantityChange = useCallback(
    (cartId, value) => {
      const newQuantity = parseInt(value, 10);
      const currentItem = cartItems.find((item) => item._id === cartId);
      if (
        !isNaN(newQuantity) &&
        newQuantity >= 1 &&
        newQuantity <= (currentItem.variantId?.stockQuantity || Infinity)
      ) {
        const originalQuantity = currentItem
          ? parseInt(currentItem.productQuantity, 10)
          : 1;
        setCartItems((prev) =>
          prev.map((item) =>
            item._id === cartId
              ? { ...item, productQuantity: newQuantity }
              : item
          )
        );
        debouncedUpdateQuantity(cartId, newQuantity, originalQuantity);
      } else if (newQuantity > (currentItem.variantId?.stockQuantity || 0)) {
        setToast({
          type: "error",
          message: `Quantity cannot exceed available stock (${currentItem.variantId?.stockQuantity})`,
        });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [cartItems, debouncedUpdateQuantity]
  );

  const handleRetry = useCallback(() => {
    fetchCartItems(true);
  }, [fetchCartItems]);

  const toggleChecked = (cartId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === cartId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  console.log("Render conditions:", {
    loading,
    cartItemsLength: cartItems.length,
    error,
  });

  return (
    <div className="cart-container">
      <h2 className="cart-title">Shopping Cart</h2>
      {toast && (
        <div
          className={`cart-toast ${
            toast.type === "success" ? "cart-toast-success" : "cart-toast-error"
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
      {error && (
        <div
          className="product-list-error"
          role="alert"
          tabIndex={0}
          aria-live="polite"
        >
          <span className="product-list-error-icon" aria-hidden="true">
            ⚠
          </span>
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
            onClick={() => navigate("/products")}
            aria-label="Continue shopping"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <main className="cart-main-section" role="main">
          <section className="cart-items" aria-label="Cart items">
            {cartItems.map((item) => {
              console.log("Rendering item:", item);
              return (
                <article
                  key={item._id}
                  className="cart-item"
                  tabIndex={0}
                  aria-label={`Cart item: ${
                    item.variantId?.productId?.productName || "Unnamed Product"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked || false}
                    onChange={() => toggleChecked(item._id)}
                    className="cart-item-checkbox"
                  />
                  <img
                    src={item.variantId?.variantImage || "/default.png"}
                    alt={item.variantId?.productId?.productName || "Product"}
                    className="cart-item-image"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                  <div className="cart-item-info">
                    <p className="cart-item-name">
                      {item.variantId?.productId?.productName || "Unnamed Product"}
                    </p>
                    <p className="cart-item-variant">
                      Color:{" "}
                      {item.variantId?.productColorId?.color_name || "N/A"},
                      Size: {item.variantId?.productSizeId?.size_name || "N/A"}
                    </p>
                    <p className="cart-item-price">
                      Price: {formatPrice(item.productPrice)}
                    </p>
                    <p className="cart-item-total">
                      Total:{" "}
                      {formatPrice(
                        (item.productPrice || 0) *
                          (parseInt(item.productQuantity, 10) || 0)
                      )}
                    </p>
                  </div>
                  <div className="cart-item-action">
                    <div className="cart-item-quantity">
                      <div className="cart-quantity-group">
                        <label
                          htmlFor={`quantity-${item._id}`}
                          className="cart-quantity-label"
                        >
                          Quantity
                        </label>
                        <input
                          type="number"
                          id={`quantity-${item._id}`}
                          min="1"
                          value={item.productQuantity || 1}
                          onChange={(e) =>
                            handleQuantityChange(item._id, e.target.value)
                          }
                          className="cart-quantity-input"
                          aria-label={`Quantity for ${
                            item.variantId?.productId?.productName || "product"
                          }`}
                          disabled={actionInProgress}
                        />
                      </div>
                      <button
                        className="cart-remove-button"
                        onClick={() => handleRemoveItem(item._id)}
                        aria-label={`Remove ${
                          item.variantId?.productId?.productName || "product"
                        } from cart`}
                        disabled={actionInProgress}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
          {cartItems.length > 0 && (
            <aside className="cart-summary" aria-label="Cart summary">
              <p className="cart-total">Total: {formatPrice(totalPrice)}</p>
              <button
                className="cart-checkout-button"
                onClick={() => {
                  const selectedItems = cartItems.filter((i) => i.checked);
                  navigate("/checkout", { state: { selectedItems } });
                }}
                disabled={
                  cartItems.filter((i) => i.checked).length === 0 ||
                  loading ||
                  actionInProgress
                }
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
