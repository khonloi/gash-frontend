import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import axios from "axios";
import { io } from "socket.io-client";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      status === 401
        ? "Unauthorized access - please log in"
        : status === 404
        ? "Resource not found"
        : status >= 500
        ? "Server error - please try again later"
        : "Network error - please check your connection";
    return Promise.reject({ ...error, message, status });
  }
);

const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await apiClient(url, options);
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const Orders = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.removeItem('order_details_cache');
  }, []);

  const [orders, setOrders] = useState(() => {
    try {
      const userId = user?._id || localStorage.getItem("user_id");
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
  const [orderFeedbackModal, setOrderFeedbackModal] = useState({
    visible: false,
    order: null,
    input: "",
    error: "",
    loading: false,
  });
  const [detailFeedbackModal, setDetailFeedbackModal] = useState({
    visible: false,
    detail: null,
    input: "",
    error: "",
    loading: false,
  });
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [cancelModalLoading, setCancelModalLoading] = useState(false);
  const [cancelModalError, setCancelModalError] = useState("");

  const fetchOrders = useCallback(
    async (query = "") => {
      if (!user?._id) {
        setError("User not authenticated");
        return;
      }
      setLoading(true);
      setError("");
      let fetched = false;
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");
        let url = "";
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (query && dateRegex.test(query.trim())) {
          url = `/orders/search?acc_id=${user?._id}&q=${encodeURIComponent(query.trim())}`;
        } else if (query && query.trim() !== "") {
          url = `/orders/search?acc_id=${user?._id}&q=${encodeURIComponent(query)}`;
        } else {
          url = `/orders?acc_id=${user?._id}`;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const response = await fetchWithRetry(url, { method: "GET", headers });
        const ordersData = Array.isArray(response) ? response : [];
        const sortedOrders = ordersData.sort((a, b) => {
          const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
          const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
          return dateB - dateA;
        });
        setOrders(sortedOrders);
        if (!query || query.trim() === "") {
          localStorage.setItem(`orders_cache_${user._id}`, JSON.stringify(sortedOrders));
          localStorage.setItem("user_id", user._id);
        }
        fetched = true;
      } catch (err) {
        setError(err.message || "Failed to load orders");
        console.error("Fetch orders error:", err);
      } finally {
        setLoading(false);
      }
      if (!fetched && (!query || query.trim() === "")) {
        const userId = user?._id || localStorage.getItem("user_id");
        if (userId) {
          const cached = localStorage.getItem(`orders_cache_${userId}`);
          if (cached) {
            const cachedOrders = JSON.parse(cached);
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

  const fetchOrderDetails = useCallback(
    async (orderId) => {
      if (
        orderDetailsCache[orderId] &&
        orderDetailsCache[orderId].every(
          (detail) => detail?.variant_id?.pro_id?.imageURL || detail?.variant_id?.pro_id?.fullImageURL
        )
      ) {
        setOrderDetails(orderDetailsCache[orderId]);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetchWithRetry(`/order-details?order_id=${orderId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const details = Array.isArray(response) ? response : [];
        setOrderDetails(details);
        if (
          details.every(
            (detail) => detail?.variant_id?.pro_id?.imageURL || detail?.variant_id?.pro_id?.fullImageURL
          )
        ) {
          setOrderDetailsCache((prev) => ({ ...prev, [orderId]: details }));
          localStorage.setItem(
            "order_details_cache",
            JSON.stringify({ ...orderDetailsCache, [orderId]: details })
          );
        }
      } catch (err) {
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    },
    [orderDetailsCache]
  );

  const handleToggleDetails = useCallback(
    (orderId) => {
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      fetchOrders(searchQuery);
    },
    [searchQuery, fetchOrders]
  );

  const canProvideFeedback = (order) => {
    return order.order_status === "delivered" && order.pay_status === "paid";
  };

  const canProvideDetailFeedback = (order) => {
    return canProvideFeedback(order);
  };

  const canCancelOrder = (order) => {
    return ["pending", "confirmed"].includes(order.order_status) && order.pay_status === "unpaid";
  };

  const openOrderFeedbackModal = (order) => {
    setOrderFeedbackModal({
      visible: true,
      order,
      input: order.feedback_order || "",
      error: "",
      loading: false,
    });
  };

  const handleOrderFeedbackChange = (e) => {
    setOrderFeedbackModal((prev) => ({ ...prev, input: e.target.value }));
  };

  const submitOrderFeedback = async () => {
    const { order, input } = orderFeedbackModal;
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setOrderFeedbackModal((prev) => ({ ...prev, error: "Feedback cannot be empty" }));
      return;
    }
    if (trimmedInput.length > 500) {
      setOrderFeedbackModal((prev) => ({ ...prev, error: "Feedback cannot exceed 500 characters" }));
      return;
    }
    setOrderFeedbackModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.put(
        `/orders/${order._id}`,
        { feedback_order: trimmedInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrder = response.data.order;
      setOrders((prev) => {
        const updatedOrders = prev.map((o) => (o._id === order._id ? updatedOrder : o));
        return updatedOrders.sort((a, b) => {
          const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
          const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
          return dateB - dateA;
        });
      });
      showToast("Feedback submitted successfully", "success");
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

  const closeOrderFeedbackModal = () => {
    setOrderFeedbackModal({
      visible: false,
      order: null,
      input: "",
      error: "",
      loading: false,
    });
  };

  const openDetailFeedbackModal = (detail) => {
    setDetailFeedbackModal({
      visible: true,
      detail,
      input: detail.feedback_details || "",
      error: "",
      loading: false,
    });
  };

  const handleDetailFeedbackChange = (e) => {
    setDetailFeedbackModal((prev) => ({ ...prev, input: e.target.value }));
  };

  const submitDetailFeedback = async () => {
    const { detail, input } = detailFeedbackModal;
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setDetailFeedbackModal((prev) => ({ ...prev, error: "Feedback cannot be empty" }));
      return;
    }
    if (trimmedInput.length > 500) {
      setDetailFeedbackModal((prev) => ({ ...prev, error: "Feedback cannot exceed 500 characters" }));
      return;
    }
    setDetailFeedbackModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.put(
        `/order-details/${detail._id}`,
        { feedback_details: trimmedInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedDetail = response.data.orderDetail;
      setOrderDetails((prev) => prev.map((d) => (d._id === detail._id ? updatedDetail : d)));
      setOrderDetailsCache((prev) => ({
        ...prev,
        [selectedOrderId]: orderDetails.map((d) => (d._id === detail._id ? updatedDetail : d)),
      }));
      showToast("Product feedback submitted successfully", "success");
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

  const closeDetailFeedbackModal = () => {
    setDetailFeedbackModal({
      visible: false,
      detail: null,
      input: "",
      error: "",
      loading: false,
    });
  };

  const openCancelModal = (order) => {
    setCancelTargetOrder(order);
    setCancelModalVisible(true);
    setCancelModalError("");
  };

  const handleCancelOrder = async () => {
    if (!cancelTargetOrder) return;
    setCancelModalLoading(true);
    setCancelModalError("");
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.put(
        `/orders/${cancelTargetOrder._id}`,
        { order_status: "cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedOrder = response.data.order;
      setOrders((prev) => {
        const updatedOrders = prev.map((o) => (o._id === cancelTargetOrder._id ? updatedOrder : o));
        return updatedOrders.sort((a, b) => {
          const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
          const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
          return dateB - dateA;
        });
      });
      showToast("Order cancelled successfully", "success");
      closeCancelModal();
    } catch (err) {
      setCancelModalError(err.message || "Failed to cancel order");
    } finally {
      setCancelModalLoading(false);
    }
  };

  const closeCancelModal = () => {
    setCancelModalVisible(false);
    setCancelTargetOrder(null);
    setCancelModalLoading(false);
    setCancelModalError("");
  };

  useEffect(() => {
    if (!user?._id) return;
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: { userId: user._id },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("orderUpdated", (data) => {
      if (data.userId === user._id) {
        setOrders((prev) => {
          const updatedOrders = prev.map((o) => (o._id === data.order._id ? data.order : o));
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

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchOrders();
    }
  }, [isAuthLoading, user, fetchOrders]);

  if (isAuthLoading) {
    return <div className="flex items-center justify-center p-8 text-gray-600">Loading...</div>;
  }

  if (!user) {
    navigate("/login", { state: { from: location } });
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 bg-white text-gray-900 min-h-screen rounded-xl">
      {error && (
        <div
          className="flex items-center justify-center gap-2.5 flex-wrap p-8 bg-red-50 border-2 border-red-200 rounded-xl mb-4 text-red-600"
          role="alert"
        >
          {error}
        </div>
      )}
      <h1 className="text-2xl font-normal text-gray-900 mb-2">My Orders</h1>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by product name, status, address, phone, or DD/MM/YYYY"
          className="w-full max-w-md p-2 text-sm border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
          aria-label="Search orders"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-yellow-400 border-2 border-gray-300 rounded-lg text-gray-900 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          aria-label="Search"
        >
          Search
        </button>
      </form>
      {loading ? (
        <div
          className="flex items-center justify-center gap-2.5 flex-wrap p-8 border-2 border-gray-300 rounded-xl mb-4 text-gray-600 h-28"
          role="status"
        >
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center p-8 bg-white border-2 border-gray-300 rounded-xl mb-4">
          <p className="text-sm text-gray-600 mb-3">No orders found.</p>
          <button
            className="px-4 py-2.5 bg-transparent border-2 border-gray-300 rounded-full text-sm font-semibold text-blue-600 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            onClick={() => navigate("/")}
            aria-label="Continue shopping"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => (
            <article
              key={order._id}
              className="border-2 border-gray-300 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-3 md:flex-row flex-col gap-2">
                <div>
                  <p className="text-base font-semibold text-blue-600 hover:text-orange-700 hover:underline">
                    Order ID: {order._id}
                    <div className="flex md:flex-row flex-col items-start gap-2 mt-1">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border-1.5 ${
                          order.order_status === "delivered"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : order.order_status === "pending"
                            ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border-1.5 ${
                          order.pay_status === "paid"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-yellow-50 text-yellow-800 border-yellow-200"
                        }`}
                      >
                        {order.pay_status.charAt(0).toUpperCase() + order.pay_status.slice(1)}
                      </span>
                    </div>
                  </p>
                </div>
                <p className="text-sm text-gray-600">Date: {formatDate(order.orderDate)}</p>
              </div>
              <div className="flex md:flex-row flex-col justify-between items-start gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <p className="text-sm text-gray-600">Address: {order.addressReceive}</p>
                  <p className="text-sm text-gray-600">Phone: {order.phone}</p>
                  <p className="text-sm text-gray-600">Payment Method: {order.payment_method}</p>
                  {order.order_status === "cancelled" &&
                    order.payment_method === "VNPAY" &&
                    order.pay_status === "paid" && (
                      <p className="text-sm text-gray-600">Refund Status: {order.refund_status}</p>
                    )}
                  {order.feedback_order && order.feedback_order.trim() !== "" && (
                    <div className="text-sm text-gray-600">
                      <strong>Shipping Feedback:</strong>
                      <div className="break-words whitespace-pre-line mt-1">{order.feedback_order}</div>
                    </div>
                  )}
                  <p className="text-base font-semibold text-red-600">Total: {formatPrice(order.totalPrice)}</p>
                </div>
                <div className="flex md:flex-col flex-row gap-2 md:items-end items-center min-w-[160px]">
                  <button
                    onClick={() => handleToggleDetails(order._id)}
                    className={`px-3 py-1.5 text-sm border-2 border-gray-300 rounded-md bg-white text-blue-600 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition w-[130px] text-center ${
                      selectedOrderId === order._id ? "border-yellow-400 bg-yellow-50 font-semibold" : ""
                    }`}
                    aria-label={selectedOrderId === order._id ? "Hide details" : "View details"}
                  >
                    {selectedOrderId === order._id ? "Hide Details" : "View Details"}
                  </button>
                  {canCancelOrder(order) ? (
                    <button
                      className="px-3 py-1.5 text-sm border-2 border-red-600 rounded-md bg-white text-red-600 hover:bg-red-50 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition w-[130px] text-center"
                      onClick={() => openCancelModal(order)}
                      aria-label="Cancel Order"
                    >
                      Cancel Order
                    </button>
                  ) : (
                    canProvideFeedback(order) && (
                      <button
                        className="px-3 py-1.5 text-sm border-2 border-gray-300 rounded-md bg-white text-blue-600 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition w-[130px] text-center"
                        onClick={() => openOrderFeedbackModal(order)}
                        aria-label={
                          order.feedback_order && order.feedback_order.trim() !== ""
                            ? "Edit Shipping Feedback"
                            : "Add Shipping Feedback"
                        }
                      >
                        {order.feedback_order && order.feedback_order.trim() !== ""
                          ? "Edit Shipping Feedback"
                          : "Add Shipping Feedback"}
                      </button>
                    )
                  )}
                </div>
              </div>
              {selectedOrderId === order._id && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl">
                  {orderDetailsCache[order._id]?.length === 0 || !orderDetailsCache[order._id] ? (
                    <p className="text-sm text-gray-600 p-3">No details available for this order.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {orderDetails.map((detail) => {
                        const imageSrc =
                          detail?.variant_id?.pro_id?.fullImageURL ||
                          detail?.variant_id?.pro_id?.imageURL ||
                          "/placeholder.png";
                        return (
                          <div key={detail._id} className="flex md:flex-row flex-col justify-between p-2 gap-2">
                            <div className="flex-shrink-0">
                              <img
                                src={imageSrc}
                                alt={detail?.variant_id?.pro_id?.pro_name || "Product Image"}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-[0.9375rem] text-blue-600 hover:text-orange-700 hover:underline">
                                {detail?.variant_id?.pro_id?.pro_name || "Unnamed Product"}
                              </p>
                              <p className="text-[0.8125rem] text-gray-600">
                                Color: {detail?.variant_id?.color_id?.color_name || "N/A"}, Size:{" "}
                                {detail?.variant_id?.size_id?.size_name || "N/A"}
                              </p>
                              <p className="text-[0.8125rem] text-gray-600">Quantity: {detail?.Quantity || 0}</p>
                              <p className="text-[0.8125rem] text-gray-600">
                                Unit Price: {formatPrice(detail?.UnitPrice)}
                              </p>
                              {detail?.feedback_details && detail.feedback_details.trim() !== "" && (
                                <div className="text-[0.8125rem] text-gray-600">
                                  <strong>Product Feedback:</strong>
                                  <div className="break-words whitespace-pre-line">{detail.feedback_details}</div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-center gap-2 mt-2">
                              <p className="text-[0.9375rem] font-semibold text-gray-900">
                                {formatPrice((detail?.UnitPrice || 0) * (detail?.Quantity || 0))}
                              </p>
                              {canProvideDetailFeedback(order) && (
                                <button
                                  className="px-3 py-1.5 text-sm border-2 border-gray-300 rounded-md bg-white text-blue-600 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition min-w-[160px] max-w-[220px] w-full"
                                  onClick={() => openDetailFeedbackModal(detail)}
                                >
                                  {detail?.feedback_details && detail.feedback_details.trim() !== ""
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

      {orderFeedbackModal.visible && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-[2000]" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-300 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {orderFeedbackModal.order.feedback_order.trim() !== "" ? "Edit Shipping Feedback" : "Add Shipping Feedback"}
            </h2>
            {orderFeedbackModal.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {orderFeedbackModal.error}
              </p>
            )}
            <textarea
              value={orderFeedbackModal.input}
              onChange={handleOrderFeedbackChange}
              placeholder="Enter your shipping feedback here (max 500 characters)"
              className="w-full min-h-[120px] p-3 text-base border-2 border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition resize-y"
              maxLength={500}
              aria-label="Shipping feedback"
            />
            <div className="flex justify-end gap-2.5">
              <button
                onClick={submitOrderFeedback}
                disabled={orderFeedbackModal.loading}
                className={`px-3 py-2 text-sm font-semibold border-2 rounded-full transition ${
                  orderFeedbackModal.loading
                    ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-400 border-yellow-400 text-gray-900 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                }`}
              >
                {orderFeedbackModal.loading ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={closeOrderFeedbackModal}
                disabled={orderFeedbackModal.loading}
                className={`px-3 py-2 text-sm font-semibold border-2 rounded-full transition ${
                  orderFeedbackModal.loading
                    ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-transparent border-gray-300 text-blue-600 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {detailFeedbackModal.visible && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-[2000]" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-300 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {detailFeedbackModal.detail.feedback_details.trim() !== "" ? "Edit Product Feedback" : "Add Product Feedback"}
            </h2>
            {detailFeedbackModal.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {detailFeedbackModal.error}
              </p>
            )}
            <textarea
              value={detailFeedbackModal.input}
              onChange={handleDetailFeedbackChange}
              placeholder="Enter your product feedback here (max 500 characters)"
              className="w-full min-h-[120px] p-3 text-base border-2 border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition resize-y"
              maxLength={500}
              aria-label="Product feedback"
            />
            <div className="flex justify-end gap-2.5">
              <button
                onClick={submitDetailFeedback}
                disabled={detailFeedbackModal.loading}
                className={`px-3 py-2 text-sm font-semibold border-2 rounded-full transition ${
                  detailFeedbackModal.loading
                    ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-400 border-yellow-400 text-gray-900 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                }`}
              >
                {detailFeedbackModal.loading ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={closeDetailFeedbackModal}
                disabled={detailFeedbackModal.loading}
                className={`px-3 py-2 text-sm font-semibold border-2 rounded-full transition ${
                  detailFeedbackModal.loading
                    ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-transparent border-gray-300 text-blue-600 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModalVisible && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-[2000]" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border-2 border-gray-300 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Confirm Cancellation</h2>
            <p className="text-sm text-gray-600">Are you sure you want to cancel this order?</p>
            {cancelModalError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{cancelModalError}</p>
            )}
            <div className="flex justify-end gap-2.5">
              <button
                onClick={handleCancelOrder}
                disabled={cancelModalLoading}
                className={`px-3 py-2 text-sm font-semibold border-2 rounded-full transition ${
                  cancelModalLoading
                    ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-transparent border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                }`}
              >
                {cancelModalLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
              <button
                onClick={closeCancelModal}
                disabled={cancelModalLoading}
                className={`px-3 py-2 text-sm font-semibold border-2 rounded-full transition ${
                  cancelModalLoading
                    ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-transparent border-gray-300 text-blue-600 hover:bg-gray-100 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                }`}
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