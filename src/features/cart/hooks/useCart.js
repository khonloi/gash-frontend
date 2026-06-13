import { useState, useEffect, useCallback, useMemo, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";
import Api from "../../../common/SummaryAPI";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY,
  TOAST_TIMEOUT,
} from "../../../constants/constants";

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

export const useCart = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [updatingQuantities, setUpdatingQuantities] = useState(new Set());
  const [error, setError] = useState(null);
  const [quantityValues, setQuantityValues] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const lastSavedQuantities = useRef({});
  const cartCache = useRef({ items: [], timestamp: 0 });
  const debouncedQuantities = useDebounce(quantityValues, 500);

  const fetchCartItems = useCallback(
    async (showLoading = true) => {
      if (!user?._id) return;

      const now = Date.now();
      const cacheAge = now - cartCache.current.timestamp;

      if (
        cartCache.current.items.length > 0 &&
        cacheAge < 30000 &&
        !showLoading
      ) {
        setCartItems(cartCache.current.items);
        return;
      }

      if (showLoading) setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        const response = await fetchWithRetry(() =>
          Api.newCart.getByAccount(user._id, token)
        );

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

        setCartItems(items);
        cartCache.current = { items, timestamp: now };

        const initialQuantities = {};
        const savedQuantities = {};
        items.forEach((item) => {
          const qty = parseInt(item.productQuantity, 10) || 1;
          initialQuantities[item._id] = qty;
          savedQuantities[item._id] = qty;
        });
        setQuantityValues(initialQuantities);
        lastSavedQuantities.current = savedQuantities;
      } catch (err) {
        console.error("Fetch cart error:", err);
        let errorMessage = "Failed to load cart items";

        if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        } else if (!err.response) {
          errorMessage = "Failed to load cart items. Please try again later.";
        }

        setError(errorMessage);
        showToast(errorMessage, "error", TOAST_TIMEOUT);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [user, showToast]
  );

  useEffect(() => {
    if (!user && !localStorage.getItem("token")) {
      navigate("/login", { replace: true });
    } else if (user) {
      fetchCartItems();
    }
  }, [user, navigate, fetchCartItems]);

  useEffect(() => {
    const updateQuantities = async () => {
      if (!user?._id || Object.keys(debouncedQuantities).length === 0) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      setCartItems((currentItems) => {
        const updates = [];
        const updatingIds = new Set();

        for (const [cartId, newQuantityRaw] of Object.entries(debouncedQuantities)) {
          const item = currentItems.find((i) => i._id === cartId);
          if (!item) continue;

          if (newQuantityRaw === "" || newQuantityRaw === null || newQuantityRaw === undefined) continue;

          const newQuantity = typeof newQuantityRaw === "number"
            ? newQuantityRaw
            : parseInt(newQuantityRaw, 10);

          if (isNaN(newQuantity) || newQuantity < 1) continue;

          const lastSavedQty = lastSavedQuantities.current[cartId];
          const savedQuantity = lastSavedQty !== undefined ? lastSavedQty : (parseInt(item.productQuantity, 10) || 1);

          if (newQuantity === savedQuantity) continue;

          updates.push({
            cartId,
            newQuantity,
            originalQuantity: savedQuantity,
            item
          });
          updatingIds.add(cartId);
        }

        if (updates.length === 0) return currentItems;

        setUpdatingQuantities(updatingIds);
        cartCache.current = { items: [], timestamp: 0 };

        Promise.all(
          updates.map(async ({ cartId, newQuantity }) => {
            try {
              const response = await Api.newCart.update(
                cartId,
                { productQuantity: newQuantity.toString() },
                token
              );
              return { cartId, response, newQuantity, success: true };
            } catch (err) {
              console.error("API update error for", cartId, ":", err);
              return { cartId, error: err, newQuantity, success: false };
            }
          })
        )
          .then((results) => {
            const allSucceeded = results.every(r => r.success);

            if (allSucceeded) {
              setCartItems((prevItems) => {
                const updatedItems = prevItems.map((item) => {
                  const result = results.find((r) => r.cartId === item._id);
                  if (result && result.success) {
                    let updatedQuantity = result.newQuantity;

                    if (result.response?.data) {
                      const responseData = result.response.data?.data || result.response.data;
                      if (responseData?.productQuantity !== undefined) {
                        updatedQuantity = parseInt(responseData.productQuantity, 10);
                      }
                    }

                    return {
                      ...item,
                      productQuantity: updatedQuantity.toString()
                    };
                  }
                  return item;
                });

                cartCache.current = { items: updatedItems, timestamp: 0 };

                results.forEach(({ cartId, newQuantity }) => {
                  if (newQuantity !== undefined) {
                    lastSavedQuantities.current[cartId] = newQuantity;
                  }
                });

                setQuantityValues((prev) => {
                  const updated = { ...prev };
                  results.forEach(({ cartId, newQuantity }) => {
                    if (newQuantity !== undefined) {
                      updated[cartId] = newQuantity;
                    }
                  });
                  return updated;
                });

                return updatedItems;
              });
            } else {
              const failedResults = results.filter(r => !r.success);
              console.error("Some updates failed:", failedResults);

              const errorMessage = "Failed to update quantity";
              showToast(errorMessage, "error", TOAST_TIMEOUT);

              setCartItems((prevItems) => {
                const revertedItems = prevItems.map((item) => {
                  const update = updates.find((u) => u.cartId === item._id);
                  if (update) {
                    return {
                      ...item,
                      productQuantity: update.originalQuantity.toString()
                    };
                  }
                  return item;
                });

                setQuantityValues((prev) => {
                  const updated = { ...prev };
                  updates.forEach(({ cartId, originalQuantity }) => {
                    updated[cartId] = originalQuantity;
                    lastSavedQuantities.current[cartId] = originalQuantity;
                  });
                  return updated;
                });

                return revertedItems;
              });
            }
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

  const handleRemoveItemClick = useCallback((cartId) => {
    const item = cartItems.find((item) => item._id === cartId);
    setItemToDelete({ cartId, item });
    setShowDeleteConfirm(true);
  }, [cartItems]);

  const handleRemoveItem = useCallback(
    async () => {
      if (!user?._id || !itemToDelete) return;

      const { cartId } = itemToDelete;
      setShowDeleteConfirm(false);
      setActionInProgress(true);
      setError(null);
      const previousItems = [...cartItems];
      const itemToRemove = cartItems.find((item) => item._id === cartId);

      setCartItems((prev) => prev.filter((item) => item._id !== cartId));
      setQuantityValues((prev) => {
        const updated = { ...prev };
        delete updated[cartId];
        return updated;
      });

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

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
        setItemToDelete(null);
      }
    },
    [cartItems, user, showToast, itemToDelete]
  );

  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }, []);

  const filteredCartItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return cartItems;
    }

    const query = searchQuery.toLowerCase().trim();
    return cartItems.filter((item) => {
      const productName = item.variantId?.productId?.productName?.toLowerCase() || "";
      if (productName.includes(query)) return true;

      const productColorName = item.variantId?.productColorId?.productColorName?.toLowerCase() || "";
      if (productColorName.includes(query)) return true;

      const productSizeName = item.variantId?.productSizeId?.productSizeName?.toLowerCase() || "";
      if (productSizeName.includes(query)) return true;

      return false;
    });
  }, [cartItems, searchQuery]);

  const totalPrice = useMemo(() => {
    return filteredCartItems
      .filter((item) => item.checked)
      .reduce((total, item) => {
        const price = item.productPrice || 0;
        const quantity = parseInt(item.productQuantity, 10) || 0;
        return total + price * quantity;
      }, 0);
  }, [filteredCartItems]);

  const hasInactiveSelectedItems = useMemo(() => {
    return filteredCartItems.some((item) => {
      if (!item.checked) return false;
      const stockQuantity = item.variantId?.stockQuantity ?? 0;
      const isVariantDiscontinued = item.variantId?.variantStatus === "discontinued";
      const isProductDiscontinued = item.variantId?.productId?.productStatus === "discontinued";
      const isOutOfStock = stockQuantity <= 0;
      return isVariantDiscontinued || isProductDiscontinued || isOutOfStock;
    });
  }, [filteredCartItems]);

  const handleQuantityChange = useCallback(
    (cartId, value) => {
      if (value === "" || value === null || value === undefined) {
        setQuantityValues((prev) => ({ ...prev, [cartId]: "" }));
        return;
      }

      const newQuantity = parseInt(value, 10);
      const currentItem = cartItems.find((item) => item._id === cartId);

      if (!currentItem) return;

      const maxQuantity = currentItem.variantId?.stockQuantity || Infinity;

      if (isNaN(newQuantity)) {
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

      setQuantityValues((prev) => ({ ...prev, [cartId]: newQuantity }));

      setCartItems((prev) =>
        prev.map((item) =>
          item._id === cartId
            ? { ...item, productQuantity: newQuantity.toString() }
            : item
        )
      );
    },
    [cartItems, showToast]
  );

  const handleRetry = useCallback(() => {
    cartCache.current = { items: [], timestamp: 0 };
    fetchCartItems(true);
  }, [fetchCartItems]);

  const toggleChecked = useCallback((cartId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === cartId ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  const toggleAllChecked = useCallback((checkedValue) => {
    setCartItems((prev) =>
      prev.map((item) => {
        const stockQuantity = item.variantId?.stockQuantity ?? 0;
        const isVariantDiscontinued = item.variantId?.variantStatus === "discontinued";
        const isProductDiscontinued = item.variantId?.productId?.productStatus === "discontinued";
        const isOutOfStock = stockQuantity <= 0;
        const isInactive = isVariantDiscontinued || isProductDiscontinued || isOutOfStock;

        if (isInactive) return item;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const productName = item.variantId?.productId?.productName?.toLowerCase() || "";
          const productColorName = item.variantId?.productColorId?.productColorName?.toLowerCase() || "";
          const productSizeName = item.variantId?.productSizeId?.productSizeName?.toLowerCase() || "";
          const matches = productName.includes(query) || productColorName.includes(query) || productSizeName.includes(query);

          if (!matches) return item;
        }

        return { ...item, checked: checkedValue };
      })
    );
  }, [searchQuery]);

  return {
    user,
    cartItems,
    loading,
    actionInProgress,
    updatingQuantities,
    error,
    quantityValues,
    setQuantityValues,
    searchQuery,
    setSearchQuery,
    showDeleteConfirm,
    setShowDeleteConfirm,
    itemToDelete,
    setItemToDelete,
    filteredCartItems,
    totalPrice,
    hasInactiveSelectedItems,
    handleRemoveItemClick,
    handleRemoveItem,
    handleQuantityChange,
    handleRetry,
    toggleChecked,
    toggleAllChecked,
    formatPrice
  };
};
