import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axiosClient from "../../common/axiosClient";

const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosClient.get(url, options);
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
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
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const cartCache = useRef({ items: [], timestamp: 0 });

  const fetchCartItems = useCallback(
    async (showLoading = true) => {
      if (!user?._id) {
        console.log("No user ID, skipping fetch");
        return;
      }
      const now = Date.now();
      if (showLoading) setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        console.log("Fetching cart for user:", user._id);
        const response = await fetchWithRetry(`/new-carts/account/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Cart fetch response:", response);
        const data = response.data;
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
        console.log("Updating quantity for cartId:", cartId, "to:", newQuantity);
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCartItems = useMemo(() => {
    if (!searchTerm) return cartItems;
    return cartItems.filter((item) =>
      item.variantId?.productId?.productName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [cartItems, searchTerm]);

  console.log("Render conditions:", {
    loading,
    cartItemsLength: cartItems.length,
    filteredCartItemsLength: filteredCartItems.length,
    error,
    searchTerm,
  });

  return (
    <div className="max-w-6xl mx-auto p-4 bg-white text-gray-900 min-h-screen rounded-xl">
      <h2 className="text-2xl font-normal text-gray-900 mb-4">Shopping Cart</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products in cart..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-md p-2 border-2 border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search products in cart"
        />
      </div>
      {toast && (
        <div
          className={`fixed top-4 right-4 p-3 rounded-xl text-sm z-[1000] shadow-md border-2 ${
            toast.type === "success"
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
      {error && (
        <div
          className="flex items-center gap-2 bg-red-50 text-red-600 border-2 border-red-200 p-3 rounded-xl mb-4 shadow-md"
          role="alert"
          tabIndex={0}
          aria-live="polite"
        >
          <span className="text-lg" aria-hidden="true">
            ⚠
          </span>
          {error}
          <button
            className="px-3 py-2 bg-yellow-400 border-2 border-yellow-500 rounded-full text-sm font-semibold text-gray-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500"
            onClick={handleRetry}
            aria-label="Retry loading cart items"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && filteredCartItems.length === 0 && !error ? (
        <div
          className="text-center p-8 bg-white border-2 border-gray-200 rounded-xl mb-4 shadow-md"
          role="status"
        >
          <h3 className="text-sm text-gray-600 mb-3">
            {searchTerm ? "No products match your search." : "Your cart is empty."}
          </h3>
          <button
            className="px-3 py-2 bg-yellow-400 border-2 border-yellow-500 rounded-full text-sm font-semibold text-gray-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500"
            onClick={() => navigate("/products")}
            aria-label="Continue shopping"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <main className="flex flex-row gap-8 w-full max-md:flex-col max-md:gap-0">
          <section className="flex-3 overflow-x-auto" aria-label="Cart items">
            {filteredCartItems.map((item) => {
              console.log("Rendering item:", item);
              return (
                <article
                  key={item._id}
                  className="bg-white border-2 border-gray-200 rounded-xl mb-5 shadow-sm p-5 flex justify-between items-start hover:shadow-md focus:shadow-md focus:outline-none transition-shadow"
                  tabIndex={0}
                  aria-label={`Cart item: ${
                    item.variantId?.productId?.productName || "Unnamed Product"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked || false}
                    onChange={() => toggleChecked(item._id)}
                    className="mt-2"
                  />
                  <img
                    src={item.variantId?.variantImage || "/default.png"}
                    alt={item.variantId?.productId?.productName || "Product"}
                    className="w-[100px] h-[100px] object-cover rounded-lg ml-4"
                  />
                  <div className="flex flex-col gap-1 ml-4">
                    <p className="text-base font-semibold text-blue-600 hover:text-orange-600 hover:underline">
                      {item.variantId?.productId?.productName || "Unnamed Product"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Color: {item.variantId?.productColorId?.color_name || "N/A"}, Size:{" "}
                      {item.variantId?.productSizeId?.size_name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Price: {formatPrice(item.productPrice)}
                    </p>
                    <p className="text-base text-red-600 font-semibold">
                      Total:{" "}
                      {formatPrice(
                        (item.productPrice || 0) * (parseInt(item.productQuantity, 10) || 0)
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-3 ml-4">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`quantity-${item._id}`}
                        className="text-sm text-gray-900"
                      >
                        Quantity
                      </label>
                      <input
                        type="number"
                        id={`quantity-${item._id}`}
                        min="1"
                        value={item.productQuantity || 1}
                        onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                        className="w-14 p-1 border-2 border-gray-200 rounded-md text-sm text-center bg-white hover:bg-gray-50 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 appearance-textfield"
                        aria-label={`Quantity for ${
                          item.variantId?.productId?.productName || "product"
                        }`}
                        disabled={actionInProgress}
                      />
                    </div>
                    <button
                      className="px-3 py-1 bg-transparent border-2 border-gray-200 rounded-md text-sm font-semibold text-red-600 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 w-full"
                      onClick={() => handleRemoveItem(item._id)}
                      aria-label={`Remove ${
                        item.variantId?.productId?.productName || "product"
                      } from cart`}
                      disabled={actionInProgress}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
          {filteredCartItems.length > 0 && (
            <aside
              className="flex-1 self-start bg-white border-2 border-gray-200 p-4 rounded-xl shadow-md max-md:mt-4 max-md:w-full"
              aria-label="Cart summary"
            >
              <p className="text-lg font-bold text-red-600 mb-3">
                Total: {formatPrice(totalPrice)}
              </p>
              <button
                className="w-full px-3 py-2 bg-yellow-400 border-2 border-yellow-500 rounded-full text-sm font-semibold text-gray-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500"
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