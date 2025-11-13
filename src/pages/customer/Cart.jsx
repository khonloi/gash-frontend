import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import Api from "../../common/SummaryAPI";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY,
  TOAST_TIMEOUT,
} from "../../constants/constants";

// Custom hook for debounced values
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// API retry function
const fetchWithRetry = async (apiCall, retries = API_RETRY_COUNT, delay = API_RETRY_DELAY) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await apiCall();
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const Cart = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [updatingQuantities, setUpdatingQuantities] = useState(new Set());
  const [error, setError] = useState(null);
  const [quantityValues, setQuantityValues] = useState({});

  // Cache for cart items
  const cartCache = useRef({ items: [], timestamp: 0 });

  // Debounced quantity values
  const debouncedQuantities = useDebounce(quantityValues, 500);

  // Fetch cart items
  const fetchCartItems = useCallback(
    async (showLoading = true) => {
      if (!user?._id) {
        console.log("No user ID, skipping fetch");
        return;
      }

      const now = Date.now();
      const cacheAge = now - cartCache.current.timestamp;

      // Use cache if data is fresh (less than 30 seconds old) and not explicitly loading
      if (
        cartCache.current.items.length > 0 &&
        cacheAge < 30000 &&
        !showLoading
      ) {
        console.log("Using cached cart items");
        setCartItems(cartCache.current.items);
        return;
      }

      if (showLoading) setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        console.log("Fetching cart for user:", user._id);
        const response = await fetchWithRetry(() =>
          Api.newCart.getByAccount(user._id, token)
        );

        console.log("Cart fetch response:", response);
        const data = response?.data || response;
        const items = Array.isArray(data)
          ? data
              .map((i) => {
                if (!i.variantId) {
                  console.warn("Cart item missing variantId:", i);
                  return null;
                }
                return { ...i, checked: i.selected || false };
              })
              .filter((item) => item !== null)
          : [];

        console.log("Processed cart items:", items);
        setCartItems(items);
        cartCache.current = { items, timestamp: now };

        // Initialize quantity values
        const initialQuantities = {};
        items.forEach((item) => {
          initialQuantities[item._id] = parseInt(item.productQuantity, 10) || 1;
        });
        setQuantityValues(initialQuantities);
      } catch (err) {
        console.error("Fetch cart error:", err);
        const errorMessage =
          err.response?.data?.message || err.message || "Failed to load cart items";
        setError(errorMessage);
        showToast(errorMessage, "error", TOAST_TIMEOUT);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [user, showToast]
  );

  // Initial fetch
  useEffect(() => {
    console.log("User:", user, "Token:", localStorage.getItem("token"));
    if (!user && !localStorage.getItem("token")) {
      navigate("/login", { replace: true });
    } else if (user) {
      fetchCartItems();
    }
  }, [user, navigate, fetchCartItems]);

  // Update quantity when debounced value changes
  useEffect(() => {
    const updateQuantities = async () => {
      if (!user?._id || Object.keys(debouncedQuantities).length === 0) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      const updates = [];
      const updatingIds = new Set();

      // Get current cart items state
      setCartItems((currentItems) => {
        for (const [cartId, newQuantityRaw] of Object.entries(debouncedQuantities)) {
          const item = currentItems.find((i) => i._id === cartId);
          if (!item) continue;

          // Skip if empty string
          if (newQuantityRaw === "" || newQuantityRaw === null || newQuantityRaw === undefined) continue;

          const newQuantity = typeof newQuantityRaw === "number" 
            ? newQuantityRaw 
            : parseInt(newQuantityRaw, 10);
          
          if (isNaN(newQuantity) || newQuantity < 1) continue;

          const currentQuantity = parseInt(item.productQuantity, 10) || 1;
          if (newQuantity === currentQuantity) continue;

          updates.push({ cartId, newQuantity, originalQuantity: currentQuantity });
          updatingIds.add(cartId);
        }

        if (updates.length === 0) return currentItems;

        // Mark items as updating
        setUpdatingQuantities(updatingIds);

        // Perform API updates
        Promise.all(
          updates.map(({ cartId, newQuantity }) =>
            Api.newCart.update(
              cartId,
              { productQuantity: newQuantity },
              token
            )
          )
        )
          .then(() => {
            // Update local state on success
            setCartItems((prevItems) => {
              const updatedItems = prevItems.map((item) => {
                const update = updates.find((u) => u.cartId === item._id);
                return update
                  ? { ...item, productQuantity: update.newQuantity }
                  : item;
              });
              cartCache.current = { items: updatedItems, timestamp: Date.now() };
              return updatedItems;
            });
          })
          .catch((err) => {
            console.error("Update quantity error:", err);
            const errorMessage =
              err.response?.data?.message || err.message || "Failed to update quantity";
            showToast(errorMessage, "error", TOAST_TIMEOUT);

            // Revert to original quantities
            setCartItems((prevItems) => {
              const revertedItems = prevItems.map((item) => {
                const update = updates.find((u) => u.cartId === item._id);
                if (update) {
                  setQuantityValues((prev) => ({
                    ...prev,
                    [item._id]: update.originalQuantity,
                  }));
                  return { ...item, productQuantity: update.originalQuantity };
                }
                return item;
              });
              return revertedItems;
            });
          })
          .finally(() => {
            setUpdatingQuantities((prev) => {
              const updated = new Set(prev);
              updatingIds.forEach((id) => updated.delete(id));
              return updated;
            });
          });

        return currentItems;
      });
    };

    updateQuantities();
  }, [debouncedQuantities, user, showToast]);

  // Remove item from cart
  const handleRemoveItem = useCallback(
    async (cartId) => {
      if (!user?._id) return;

      setActionInProgress(true);
      setError(null);
      const previousItems = [...cartItems];
      const itemToRemove = cartItems.find((item) => item._id === cartId);

      // Optimistic update
      setCartItems((prev) => prev.filter((item) => item._id !== cartId));
      setQuantityValues((prev) => {
        const updated = { ...prev };
        delete updated[cartId];
        return updated;
      });

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        console.log("Removing cart item:", cartId);
        await Api.newCart.delete(cartId, token);

        cartCache.current = {
          items: cartItems.filter((item) => item._id !== cartId),
          timestamp: Date.now(),
        };
        showToast("Item removed from cart", "success", TOAST_TIMEOUT);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || "Failed to remove item";
        console.error("Remove item error:", err);
        setError(errorMessage);
        setCartItems(previousItems);
        if (itemToRemove) {
          setQuantityValues((prev) => ({
            ...prev,
            [cartId]: parseInt(itemToRemove.productQuantity, 10) || 1,
          }));
        }
        showToast(errorMessage, "error", TOAST_TIMEOUT);
      } finally {
        setActionInProgress(false);
      }
    },
    [cartItems, user, showToast]
  );

  // Format price helper
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

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (cartId, value) => {
      // Handle empty input - allow it temporarily for better UX
      if (value === "" || value === null || value === undefined) {
        setQuantityValues((prev) => ({ ...prev, [cartId]: "" }));
        return;
      }

      const newQuantity = parseInt(value, 10);
      const currentItem = cartItems.find((item) => item._id === cartId);

      if (!currentItem) return;

      const maxQuantity = currentItem.variantId?.stockQuantity || Infinity;

      // Validate and clamp quantity
      if (isNaN(newQuantity)) {
        // If invalid, revert to current quantity
        const currentQty = parseInt(currentItem.productQuantity, 10) || 1;
        setQuantityValues((prev) => ({ ...prev, [cartId]: currentQty }));
        return;
      }

      if (newQuantity < 1) {
        setQuantityValues((prev) => ({ ...prev, [cartId]: 1 }));
        return;
      }

      if (newQuantity > maxQuantity) {
        showToast(
          `Quantity cannot exceed available stock (${maxQuantity})`,
          "error",
          TOAST_TIMEOUT
        );
        setQuantityValues((prev) => ({ ...prev, [cartId]: maxQuantity }));
        return;
      }

      // Update local state immediately for responsive UI
      setQuantityValues((prev) => ({ ...prev, [cartId]: newQuantity }));
      setCartItems((prev) =>
        prev.map((item) =>
          item._id === cartId
            ? { ...item, productQuantity: newQuantity }
            : item
        )
      );
    },
    [cartItems, showToast]
  );

  // Retry handler
  const handleRetry = useCallback(() => {
    cartCache.current = { items: [], timestamp: 0 };
    fetchCartItems(true);
  }, [fetchCartItems]);

  // Toggle checked state
  const toggleChecked = useCallback((cartId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === cartId ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  // Focus error notification
  const errorRef = useRef(null);
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  // Cart Item Skeleton Component
  const CartItemSkeleton = () => (
    <article
      className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row gap-4"
      aria-label="Loading cart item"
    >
      <div className="flex items-stretch gap-6 flex-1">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0 self-center" />
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="h-5 bg-gray-200 rounded animate-pulse w-1/4" />
        </div>
      </div>
      <div className="flex flex-row sm:flex-col items-center sm:items-center sm:justify-center gap-3 sm:gap-4">
        <div className="w-20 h-10 bg-gray-200 rounded-md animate-pulse" />
        <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </article>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full">
        <h2 className="text-xl sm:text-2xl font-md mb-4 sm:mb-5 md:mb-6 m-0">
          Shopping Cart
        </h2>

        {error && (
          <div
            ref={errorRef}
            className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap"
            role="alert"
            tabIndex={0}
            aria-live="polite"
          >
            <span className="text-lg" aria-hidden="true">
              ⚠
            </span>
            {error}
            <button
              className="px-3 py-1.5 bg-transparent border-2 border-gray-300 text-blue-600 text-sm rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              onClick={handleRetry}
              disabled={loading}
              aria-label="Retry loading cart items"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && cartItems.length === 0 && !error ? (
          <div
            className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[200px] flex flex-col items-center justify-center gap-4"
            role="status"
          >
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 m-0">
              Your cart is empty.
            </h3>
            <button
              className="px-3 py-1.5 bg-amber-400 border-2 border-amber-500 text-gray-900 text-sm rounded-lg cursor-pointer hover:bg-amber-500 hover:border-amber-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 transition-colors font-semibold"
              onClick={() => navigate("/products")}
              aria-label="Continue shopping"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <main className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8" role="main">
            <section className="flex-1 min-w-0" aria-label="Cart items">
              {loading ? (
                <>
                  {[...Array(3)].map((_, index) => (
                    <CartItemSkeleton key={`skeleton-${index}`} />
                  ))}
                </>
              ) : (
                cartItems.map((item) => {
                const quantityValue = quantityValues[item._id];
                const quantity = quantityValue !== undefined && quantityValue !== ""
                  ? (typeof quantityValue === "number" ? quantityValue : parseInt(quantityValue, 10))
                  : parseInt(item.productQuantity, 10) || 1;
                const maxQuantity = item.variantId?.stockQuantity || Infinity;
                const isUpdating = updatingQuantities.has(item._id);

                return (
                  <article
                    key={item._id}
                    className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row gap-4 transition-shadow hover:shadow-md focus-within:shadow-md"
                    tabIndex={0}
                    aria-label={`Cart item: ${item.variantId?.productId?.productName || "Unnamed Product"}`}
                  >
                    <div className="flex items-stretch gap-6 flex-1">
                      <input
                        type="checkbox"
                        checked={item.checked || false}
                        onChange={() => toggleChecked(item._id)}
                        className="w-5 h-5 accent-amber-400 cursor-pointer flex-shrink-0 self-center"
                        aria-label={`Select ${item.variantId?.productId?.productName || "product"} for checkout`}
                      />
                      <img
                        src={item.variantId?.variantImage || "/placeholder-image.png"}
                        alt={item.variantId?.productId?.productName || "Product"}
                        className="w-20 sm:w-24 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                        <p className="text-base sm:text-lg font-semibold text-gray-900 m-0 line-clamp-2">
                          {item.variantId?.productId?.productName || "Unnamed Product"}
                        </p>
                        <p className="text-sm text-gray-600 m-0">
                          Color: {item.variantId?.productColorId?.color_name || "N/A"}, Size:{" "}
                          {item.variantId?.productSizeId?.size_name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 m-0">
                          Price: {formatPrice(item.productPrice)}
                        </p>
                        <p className="text-base font-semibold text-red-600 m-0">
                          Total: {formatPrice((item.productPrice || 0) * quantity)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-center sm:justify-center gap-3 sm:gap-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="number"
                          id={`quantity-${item._id}`}
                          min="1"
                          max={maxQuantity}
                          value={quantityValue !== undefined ? quantityValue : quantity}
                          onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                          onBlur={(e) => {
                            // Ensure valid value on blur
                            const value = e.target.value;
                            if (value === "" || isNaN(parseInt(value, 10))) {
                              const currentQty = parseInt(item.productQuantity, 10) || 1;
                              setQuantityValues((prev) => ({ ...prev, [item._id]: currentQty }));
                            }
                          }}
                          className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white text-sm w-20 transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                          aria-label={`Quantity for ${item.variantId?.productId?.productName || "product"}`}
                          disabled={isUpdating || actionInProgress}
                        />
                      </div>
                      <button
                        className="px-3 py-1.5 border-2 border-gray-300 text-red-600 text-sm rounded-lg cursor-pointer hover:bg-gray-50 hover:border-red-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-semibold"
                        onClick={() => handleRemoveItem(item._id)}
                        aria-label={`Remove ${item.variantId?.productId?.productName || "product"} from cart`}
                        disabled={isUpdating || actionInProgress}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })
              )}
            </section>

            {!loading && cartItems.length > 0 && (
              <aside
                className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 sm:p-5 flex-shrink-0 sm:w-64 w-full"
                aria-label="Cart summary"
              >
                <p className="text-lg sm:text-xl font-bold text-red-600 mb-4 m-0">
                  Total: {formatPrice(totalPrice)}
                </p>
                <button
                  className="w-full px-3 py-2.5 sm:py-3 border-2 rounded-full cursor-pointer text-sm font-semibold transition-colors focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed bg-amber-400 border-amber-500 text-gray-900 hover:bg-amber-500 hover:border-amber-600"
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
      </section>
    </div>
  );
};

export default Cart;

