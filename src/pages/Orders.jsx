import { createSocket } from "../common/axiosClient";
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../components/Toast"; // Import useToast from Toast.js
import "../styles/Orders.css";
import axiosClient from '../common/axiosClient';
import { useRef } from "react";

// API functions
const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosClient(url, options);
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
    }
  }
};

const Orders = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const { showToast } = useToast(); // Use the useToast hook
  console.log("[Orders] Component mounted");
  const getUserId = (user) => user?._id || localStorage.getItem("user_id");
  const location = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // Clear stale cache on mount
  useEffect(() => {
    localStorage.removeItem('order_details_cache');
  }, []);

  // Load cached orders and orderDetailsCache from localStorage if available
  const [orders, setOrders] = useState(() => {
    try {
      const userId = getUserId(user);
      if (!userId) return [];
      const cached = localStorage.getItem(`orders_cache_${userId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [orderDetailsCache, setOrderDetailsCache] = useState(() => {
    try {
      const cached = localStorage.getItem("order_details_cache");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [feedbackFormVisible, setFeedbackFormVisible] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetail, setModalDetail] = useState(null); // { detail, order }
  const [modalInput, setModalInput] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [cancelModalLoading, setCancelModalLoading] = useState(false);
  const [cancelModalError, setCancelModalError] = useState("");

  // Add new state for order-level feedback modal
  const [orderFeedbackModal, setOrderFeedbackModal] = useState({
    visible: false,
    order: null,
    input: "",
    error: "",
    loading: false,
  });
  // Add new state for detail-level feedback modal
  const [detailFeedbackModal, setDetailFeedbackModal] = useState({
    visible: false,
    detail: null,
    input: "",
    error: "",
    loading: false,
  });

  // Fetch orders
  const fetchOrders = useCallback(
    async (query = "") => {
      if (!user?._id) {
        setError("User not authenticated");
        return;
      }
      setLoading(true);
      setError("");

      // Always try to fetch from backend first
      let fetched = false;
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        let url = "";
        // Check if query matches DD/MM/YYYY
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (query && dateRegex.test(query.trim())) {
          url = `/orders/search?acc_id=${user?._id}&q=${encodeURIComponent(
            query.trim()
          )}`;
        } else if (query && query.trim() !== "") {
          url = `/orders/search?acc_id=${user?._id}&q=${encodeURIComponent(
            query
          )}`;
        } else {
          url = `/orders?acc_id=${user?._id}`;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const response = await fetchWithRetry(url, {
          method: "GET",
          headers,
        });
        const ordersData = Array.isArray(response) ? response : [];
        // Sort orders by orderDate in descending order (newest first)
        const sortedOrders = ordersData.sort((a, b) => {
          const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
          const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
          return dateB - dateA;
        });
        setOrders(sortedOrders);
        // Only cache if not a search
        if (!query || query.trim() === "") {
          localStorage.setItem(
            `orders_cache_${user._id}`,
            JSON.stringify(sortedOrders)
          );
          localStorage.setItem("user_id", user._id);
        }
        fetched = true;
      } catch (err) {
        setError(err.message || "Failed to load orders");
        console.error("Fetch orders error:", err);
      } finally {
        setLoading(false);
      }
      // If fetch failed and not a search, try cache as fallback
      if (!fetched && (!query || query.trim() === "")) {
        const userId = getUserId(user);
        if (userId) {
          const cached = localStorage.getItem(`orders_cache_${userId}`);
          if (cached) {
            const cachedOrders = JSON.parse(cached);
            // Sort cached orders by orderDate in descending order
            const sortedCachedOrders = cachedOrders.sort((a, b) => {
              const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
              const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
              return dateB - dateA;
            });
            setOrders(sortedCachedOrders);
          }
        }
      }
    },
    [user]
  );

  // Fetch order details with validation
  const fetchOrderDetails = useCallback(
    async (orderId) => {
      // Check cache only if data is valid
      if (
        orderDetailsCache[orderId] &&
        orderDetailsCache[orderId].every(
          (detail) =>
            detail?.variant_id?.pro_id?.imageURL ||
            detail?.variant_id?.pro_id?.fullImageURL
        )
      ) {
        console.log('Using valid cached details for order:', orderId);
        setOrderDetails(orderDetailsCache[orderId]);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        console.log('Fetching details for order:', orderId, 'Token:', token);
        const response = await fetchWithRetry(
          `/order-details?order_id=${orderId}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const details = Array.isArray(response) ? response : [];
        console.log('Fetched order details:', details);
        setOrderDetails(details);
        // Cache only if data is valid
        if (
          details.every(
            (detail) =>
              detail?.variant_id?.pro_id?.imageURL ||
              detail?.variant_id?.pro_id?.fullImageURL
          )
        ) {
          setOrderDetailsCache((prev) => ({ ...prev, [orderId]: details }));
          localStorage.setItem(
            "order_details_cache",
            JSON.stringify({ ...orderDetailsCache, [orderId]: details })
          );
        } else {
          console.warn('Invalid details data, not caching:', details);
        }
      } catch (err) {
        setError(err.message || "Failed to load order details");
        console.error("Fetch order details error:", err);
      } finally {
        setLoading(false);
      }
    },
    [orderDetailsCache]
  );

  // Toggle order details
  const handleToggleDetails = useCallback(
    (orderId) => {
      console.log('Toggling details for order:', orderId);
      if (selectedOrderId === orderId) {
        setSelectedOrderId(null);
        setOrderDetails([]);
      } else {
        setSelectedOrderId(orderId);
        fetchOrderDetails(orderId);
      }
    },
    [selectedOrderId, fetchOrderDetails]
  );

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Handle search
  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      fetchOrders(searchQuery);
    },
    [searchQuery, fetchOrders]
  );

  // Can provide feedback
  const canProvideFeedback = (order) => {
    return order.order_status === "delivered" && order.pay_status === "paid";
  };

  // Can provide detail feedback
  const canProvideDetailFeedback = (order) => {
    return canProvideFeedback(order);
  };

  // Can cancel order
  const canCancelOrder = (order) => {
    return (
      ["pending", "confirmed"].includes(order.order_status) &&
      order.pay_status === "unpaid"
    );
  };

  // Open order feedback modal
  const openOrderFeedbackModal = (order) => {
    setOrderFeedbackModal({
      visible: true,
      order,
      input: order.feedback_order || "",
      error: "",
      loading: false,
    });
  };

  // Handle order feedback change
  const handleOrderFeedbackChange = (e) => {
    setOrderFeedbackModal((prev) => ({ ...prev, input: e.target.value }));
  };

  // Submit order feedback
  const submitOrderFeedback = async () => {
    const { order, input } = orderFeedbackModal;
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setOrderFeedbackModal((prev) => ({
        ...prev,
        error: "Feedback cannot be empty",
      }));
      return;
    }
    if (trimmedInput.length > 500) {
      setOrderFeedbackModal((prev) => ({
        ...prev,
        error: "Feedback cannot exceed 500 characters",
      }));
      return;
    }
    setOrderFeedbackModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const token = localStorage.getItem("token");
      const response = await axiosClient.put(
        `/orders/${order._id}`,
        { feedback_order: trimmedInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrder = response.data.order;
      setOrders((prev) => {
        const updatedOrders = prev.map((o) => (o._id === order._id ? updatedOrder : o));
        // Sort orders by orderDate in descending order
        return updatedOrders.sort((a, b) => {
          const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
          const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
          return dateB - dateA;
        });
      });
      showToast("Feedback submitted successfully", "success"); // Use showToast
      closeOrderFeedbackModal();
    } catch (err) {
      setOrderFeedbackModal((prev) => ({
        ...prev,
        error: err.message || "Failed to submit feedback",
      }));
    } finally {
      setOrderFeedbackModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Close order feedback modal
  const closeOrderFeedbackModal = () => {
    setOrderFeedbackModal({
      visible: false,
      order: null,
      input: "",
      error: "",
      loading: false,
    });
  };

  // Open detail feedback modal
  const openDetailFeedbackModal = (detail) => {
    setDetailFeedbackModal({
      visible: true,
      detail,
      input: detail.feedback_details || "",
      error: "",
      loading: false,
    });
  };

  // Handle detail feedback change
  const handleDetailFeedbackChange = (e) => {
    setDetailFeedbackModal((prev) => ({ ...prev, input: e.target.value }));
  };

  // Submit detail feedback
  const submitDetailFeedback = async () => {
    const { detail, input } = detailFeedbackModal;
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setDetailFeedbackModal((prev) => ({
        ...prev,
        error: "Feedback cannot be empty",
      }));
      return;
    }
    if (trimmedInput.length > 500) {
      setDetailFeedbackModal((prev) => ({
        ...prev,
        error: "Feedback cannot exceed 500 characters",
      }));
      return;
    }
    setDetailFeedbackModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const token = localStorage.getItem("token");
      const response = await axiosClient.put(
        `/order-details/${detail._id}`,
        { feedback_details: trimmedInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedDetail = response.data.orderDetail;
      setOrderDetails((prev) =>
        prev.map((d) => (d._id === detail._id ? updatedDetail : d))
      );
      setOrderDetailsCache((prev) => ({
        ...prev,
        [selectedOrderId]: orderDetails.map((d) =>
          d._id === detail._id ? updatedDetail : d
        ),
      }));
      showToast("Product feedback submitted successfully", "success"); // Use showToast
      closeDetailFeedbackModal();
    } catch (err) {
      setDetailFeedbackModal((prev) => ({
        ...prev,
        error: err.message || "Failed to submit feedback",
      }));
    } finally {
      setDetailFeedbackModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Close detail feedback modal
  const closeDetailFeedbackModal = () => {
    setDetailFeedbackModal({
      visible: false,
      detail: null,
      input: "",
      error: "",
      loading: false,
    });
  };

  // Open cancel modal
  const openCancelModal = (order) => {
    setCancelTargetOrder(order);
    setCancelModalVisible(true);
    setCancelModalError("");
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!cancelTargetOrder) return;
    setCancelModalLoading(true);
    setCancelModalError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axiosClient.put(
        `/orders/${cancelTargetOrder._id}`,
        { order_status: "cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrder = response.data.order;
      setOrders((prev) => {
        const updatedOrders = prev.map((o) => (o._id === cancelTargetOrder._id ? updatedOrder : o));
        // Sort orders by orderDate in descending order
        return updatedOrders.sort((a, b) => {
          const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
          const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
          return dateB - dateA;
        });
      });
      showToast("Order cancelled successfully", "success"); // Use showToast
      closeCancelModal();
    } catch (err) {
      setCancelModalError(err.message || "Failed to cancel order");
    } finally {
      setCancelModalLoading(false);
    }
  };

  // Close cancel modal
  const closeCancelModal = () => {
    setCancelModalVisible(false);
    setCancelTargetOrder(null);
    setCancelModalLoading(false);
    setCancelModalError("");
  };

  // Setup socket
  useEffect(() => {
    if (!user?._id) return;
    // Use centralized socket client
    const socket = createSocket({ userId: user._id });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("orderUpdated", (data) => {
      if (data.userId === user._id) {
        setOrders((prev) => {
          const updatedOrders = prev.map((o) => (o._id === data.order._id ? data.order : o));
          // Sort orders by orderDate in descending order
          return updatedOrders.sort((a, b) => {
            const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
            const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
            return dateB - dateA;
          });
        });
        if (selectedOrderId === data.order._id) {
          fetchOrderDetails(data.order._id);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, selectedOrderId, fetchOrderDetails]);

  // Fetch orders on mount
  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchOrders();
    }
  }, [isAuthLoading, user, fetchOrders]);

  if (isAuthLoading) {
    return <div className="orders-loading">Loading...</div>;
  }

  if (!user) {
    navigate("/login", { state: { from: location } });
    return null;
  }

  return (
    <div className="orders-container">
      {error && (
        <div className="orders-error" role="alert">
          {error}
        </div>
      )}
      <h1 className="orders-title">My Orders</h1>
      <form onSubmit={handleSearch} className="orders-search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by product name, status, address, phone, or DD/MM/YYYY"
          className="orders-search-input"
          aria-label="Search orders"
        />
        <button
          type="submit"
          className="orders-search-button"
          aria-label="Search"
        >
          Search
        </button>
      </form>
      {loading ? (
        <div className="orders-loading" role="status">
          <div className="orders-loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty" role="status">
          <p>No orders found.</p>
          <button
            className="orders-continue-shopping"
            onClick={() => navigate("/")}
            aria-label="Continue shopping"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article key={order._id} className="orders-order-card">
              <div className="orders-order-header">
                <div>
                  <p className="orders-order-id">
                    Order ID: {order._id}
                    <div className="orders-order-status-tags">
                      <span
                        className={`orders-order-status-badge ${order.order_status}`}
                      >
                        {order.order_status.charAt(0).toUpperCase() +
                          order.order_status.slice(1)}
                      </span>
                      <span
                        className={`orders-order-status-badge ${order.pay_status}`}
                      >
                        {order.pay_status.charAt(0).toUpperCase() +
                          order.pay_status.slice(1)}
                      </span>
                    </div>
                  </p>
                </div>
                <p className="orders-order-date">
                  Date: {formatDate(order.orderDate)}
                </p>
              </div>
              <div className="orders-order-info-actions">
                <div className="orders-order-info">
                  <p className="orders-order-address">
                    Address: {order.addressReceive}
                  </p>
                  <p className="orders-order-phone">Phone: {order.phone}</p>
                  <p className="orders-order-payment-method">
                    Payment Method: {order.payment_method}
                  </p>
                  {order.order_status === "cancelled" &&
                    order.payment_method === "VNPAY" &&
                    order.pay_status === "paid" && (
                      <p className="orders-order-refund">
                        Refund Status: {order.refund_status}
                      </p>
                    )}
                  {order.feedback_order &&
                    order.feedback_order.trim() !== "" && (
                      <div className="orders-order-feedback-list orders-order-date orders-order-shipping">
                        <strong>Shipping Feedback:</strong>
                        <div className="orders-order-feedback-item">
                          {order.feedback_order}
                        </div>
                      </div>
                    )}
                  <p className="orders-order-total">
                    Total: {formatPrice(order.totalPrice)}
                  </p>
                </div>
                <div className="orders-order-actions">
                  <button
                    onClick={() => handleToggleDetails(order._id)}
                    className="orders-toggle-details"
                    aria-label={
                      selectedOrderId === order._id
                        ? `Hide details for order`
                        : `View details for order`
                    }
                  >
                    {selectedOrderId === order._id
                      ? "Hide Details"
                      : "View Details"}
                  </button>
                  {canCancelOrder(order) ? (
                    <button
                      className="orders-feedback-modal-btn cancel-order"
                      onClick={() => openCancelModal(order)}
                      aria-label="Cancel Order"
                    >
                      Cancel Order
                    </button>
                  ) : (
                    canProvideFeedback(order) && (
                      <button
                        className="orders-feedback-modal-btn"
                        onClick={() => openOrderFeedbackModal(order)}
                        aria-label={
                          order.feedback_order &&
                            order.feedback_order.trim() !== ""
                            ? "Edit Shipping Feedback"
                            : "Add Shipping Feedback"
                        }
                      >
                        {order.feedback_order &&
                          order.feedback_order.trim() !== ""
                          ? "Edit Shipping Feedback"
                          : "Add Shipping Feedback"}
                      </button>
                    )
                  )}
                </div>
              </div>
              {/* Order Details */}
              {selectedOrderId === order._id && (
                <div className="orders-details-section">
                  {orderDetailsCache[order._id]?.length === 0 ||
                    !orderDetailsCache[order._id] ? (
                    <p className="orders-no-details">
                      No details available for this order.
                    </p>
                  ) : (
                    <div className="orders-details-list">
                      {orderDetails.map((detail) => {
                        // ✅ pick the right image
                        const imageSrc =
                          detail?.variant_id?.pro_id?.fullImageURL ||
                          detail?.variant_id?.pro_id?.imageURL ||
                          "/placeholder.png";

                        return (
                          <div key={detail._id} className="orders-detail-item">
                            {/* Image section */}
                            <div className="orders-detail-image">
                              <img
                                src={imageSrc}
                                alt={
                                  detail?.variant_id?.pro_id?.pro_name ||
                                  "Product Image"
                                }
                              />
                            </div>

                            {/* Product info */}
                            <div className="orders-detail-info">
                              <p className="orders-detail-name">
                                {detail?.variant_id?.pro_id?.pro_name ||
                                  "Unnamed Product"}
                              </p>
                              <p className="orders-detail-variant">
                                Color:{" "}
                                {detail?.variant_id?.color_id?.color_name ||
                                  "N/A"}
                                , Size:{" "}
                                {detail?.variant_id?.size_id?.size_name ||
                                  "N/A"}
                              </p>
                              <p className="orders-detail-quantity">
                                Quantity: {detail?.Quantity || 0}
                              </p>
                              <p className="orders-detail-price">
                                Unit Price: {formatPrice(detail?.UnitPrice)}
                              </p>
                              {detail?.feedback_details &&
                                detail.feedback_details.trim() !== "" && (
                                  <div className="orders-detail-feedback">
                                    <strong>Product Feedback:</strong>
                                    <div className="orders-order-feedback-item">
                                      {detail.feedback_details}
                                    </div>
                                  </div>
                                )}
                            </div>

                            {/* Actions column */}
                            <div className="orders-detail-actions-col">
                              <p className="orders-detail-total">
                                {formatPrice(
                                  (detail?.UnitPrice || 0) *
                                  (detail?.Quantity || 0)
                                )}
                              </p>
                              {canProvideDetailFeedback(order) && (
                                <button
                                  className="orders-feedback-modal-btn"
                                  style={{ marginTop: 8 }}
                                  onClick={() =>
                                    openDetailFeedbackModal(detail)
                                  }
                                >
                                  {detail?.feedback_details &&
                                    detail.feedback_details.trim() !== ""
                                    ? "Edit Product Feedback"
                                    : "Add Product Feedback"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Order Feedback Modal */}
      {orderFeedbackModal.visible && (
        <div className="orders-modal-overlay" role="dialog" aria-modal="true">
          <div className="orders-modal-content">
            <h2>
              {orderFeedbackModal.order.feedback_order.trim() !== ""
                ? "Edit Shipping Feedback"
                : "Add Shipping Feedback"}
            </h2>
            {orderFeedbackModal.error && (
              <p className="orders-modal-error">{orderFeedbackModal.error}</p>
            )}
            <textarea
              value={orderFeedbackModal.input}
              onChange={handleOrderFeedbackChange}
              placeholder="Enter your shipping feedback here (max 500 characters)"
              className="orders-modal-textarea"
              maxLength={500}
              aria-label="Shipping feedback"
            />
            <div className="orders-modal-actions">
              <button
                onClick={submitOrderFeedback}
                disabled={orderFeedbackModal.loading}
                className="orders-modal-submit"
              >
                {orderFeedbackModal.loading ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={closeOrderFeedbackModal}
                disabled={orderFeedbackModal.loading}
                className="orders-modal-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Feedback Modal */}
      {detailFeedbackModal.visible && (
        <div className="orders-modal-overlay" role="dialog" aria-modal="true">
          <div className="orders-modal-content">
            <h2>
              {detailFeedbackModal.detail.feedback_details.trim() !== ""
                ? "Edit Product Feedback"
                : "Add Product Feedback"}
            </h2>
            {detailFeedbackModal.error && (
              <p className="orders-modal-error">{detailFeedbackModal.error}</p>
            )}
            <textarea
              value={detailFeedbackModal.input}
              onChange={handleDetailFeedbackChange}
              placeholder="Enter your product feedback here (max 500 characters)"
              className="orders-modal-textarea"
              maxLength={500}
              aria-label="Product feedback"
            />
            <div className="orders-modal-actions">
              <button
                onClick={submitDetailFeedback}
                disabled={detailFeedbackModal.loading}
                className="orders-modal-submit"
              >
                {detailFeedbackModal.loading ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={closeDetailFeedbackModal}
                disabled={detailFeedbackModal.loading}
                className="orders-modal-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalVisible && (
        <div className="orders-modal-overlay" role="dialog" aria-modal="true">
          <div className="orders-modal-content">
            <h2>Confirm Cancellation</h2>
            <p>Are you sure you want to cancel this order?</p>
            {cancelModalError && (
              <p className="orders-modal-error">{cancelModalError}</p>
            )}
            <div className="orders-modal-actions">
              <button
                onClick={handleCancelOrder}
                disabled={cancelModalLoading}
                className="orders-modal-submit cancel-order"
              >
                {cancelModalLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
              <button
                onClick={closeCancelModal}
                disabled={cancelModalLoading}
                className="orders-modal-cancel"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;