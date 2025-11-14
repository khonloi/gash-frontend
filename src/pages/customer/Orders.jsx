import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import Api from "../../common/SummaryAPI";
import OrderDetailsModal from "../../components/OrderDetails";
import LoadingSpinner, { LoadingSkeleton } from "../../components/LoadingSpinner";
import ProductButton from "../../components/ProductButton";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../../common/axiosClient";

const Orders = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchType, setSearchType] = useState("phone");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const socketRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchOrders = useCallback(
    async () => {
      if (!user?._id) {
        showToast("No user ID available", "error");
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await Api.order.getOrders(user._id, token);
        const data = response.data.data || [];

        if (!Array.isArray(data)) {
          showToast("Invalid API response format", "error");
          setOrders([]);
          setFilteredOrders([]);
          setLoading(false);
          return;
        }

        if (data.length === 0) {
          showToast("No orders found for this user", "info");
        }

        const sorted = data.sort(
          (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
        );
        setOrders(sorted);
        setFilteredOrders(sorted);
      } catch (err) {
        setError(err.message);
        showToast("Failed to load orders", "error");
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [user, showToast]
  );

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchOrders();
    }
  }, [isAuthLoading, user, fetchOrders]);

  // Setup Socket.IO for real-time order updates
  useEffect(() => {
    if (!user?._id) return;

    // Initialize socket if not already created
    if (!socketRef.current) {
      const token = localStorage.getItem("token");
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        auth: { token },
        withCredentials: true,
      });
    }

    const socket = socketRef.current;

    // Connect and authenticate
    socket.on("connect", () => {
      console.log("✅ Orders Socket connected:", socket.id);
      // Emit user connection
      socket.emit("userConnected", user._id);
      // Also try authentication if token available
      const token = localStorage.getItem("token");
      if (token) {
        socket.emit("authenticate", token);
      }
    });

    // Listen for order updates
    socket.on("orderUpdated", (payload) => {
      const updatedOrder = payload.order || payload;
      const orderUserId = payload.userId || updatedOrder.acc_id?._id || updatedOrder.acc_id;

      // Only update if this order belongs to the current user
      if (orderUserId && orderUserId.toString() === user._id.toString()) {
        console.log("📦 Order updated via Socket.IO:", updatedOrder._id);
        
        setOrders((prevOrders) => {
          const existingIndex = prevOrders.findIndex((o) => o._id === updatedOrder._id);
          
          if (existingIndex !== -1) {
            // Update existing order
            const updated = [...prevOrders];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...updatedOrder,
            };
            // Re-sort by orderDate
            return updated.sort(
              (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
            );
          } else {
            // New order - add to beginning
            return [
              updatedOrder,
              ...prevOrders,
            ].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
          }
        });

        // Also update filtered orders if applicable
        setFilteredOrders((prevFiltered) => {
          const existingIndex = prevFiltered.findIndex((o) => o._id === updatedOrder._id);
          
          if (existingIndex !== -1) {
            const updated = [...prevFiltered];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...updatedOrder,
            };
            return updated.sort(
              (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
            );
          } else {
            return [
              updatedOrder,
              ...prevFiltered,
            ].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
          }
        });

        // Show toast notification for status changes
        if (updatedOrder.order_status) {
          const statusMessages = {
            pending: "Your order is pending",
            confirmed: "Your order has been confirmed",
            shipping: "Your order is on the way!",
            delivered: "Your order has been delivered!",
            cancelled: "Your order has been cancelled",
          };
          const message = statusMessages[updatedOrder.order_status] || "Order status updated";
          showToast(message, "info");
        }
      }
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Orders Socket connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Orders Socket disconnected:", reason);
    });

    // Cleanup on unmount
    return () => {
      socket.off("connect");
      socket.off("orderUpdated");
      socket.off("connect_error");
      socket.off("disconnect");
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user, showToast]);

  const handleSearchAndFilter = useCallback(() => {
    let filtered = [...orders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        if (searchType === "phone") {
          return order.phone?.toLowerCase().includes(query);
        } else {
          return order.addressReceive?.toLowerCase().includes(query);
        }
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.order_status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, searchType, statusFilter]);

  useEffect(() => {
    handleSearchAndFilter();
    setCurrentPage(1);
  }, [handleSearchAndFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

  const getStatusBadge = (status, type = "order") => {
    const base =
      "px-3 py-1 rounded-full text-xs font-semibold border inline-block";
    if (type === "order") {
      switch (status?.toLowerCase()) {
        case "pending":
          return (
            <span className={`${base} bg-yellow-100 text-yellow-700 border-yellow-300`}>
              Pending
            </span>
          );
        case "confirmed":
          return (
            <span className={`${base} bg-blue-100 text-blue-700 border-blue-300`}>
              Confirmed
            </span>
          );
        case "shipping":
          return (
            <span className={`${base} bg-indigo-100 text-indigo-700 border-indigo-300`}>
              Shipping
            </span>
          );
        case "delivered":
          return (
            <span className={`${base} bg-green-100 text-green-700 border-green-300`}>
              Delivered
            </span>
          );
        case "cancelled":
          return (
            <span className={`${base} bg-red-100 text-red-700 border-red-300`}>
              Cancelled
            </span>
          );
        default:
          return (
            <span className={`${base} bg-gray-100 text-gray-600 border-gray-300`}>
              Unknown
            </span>
          );
      }
    } else {
      switch (status?.toLowerCase()) {
        case "unpaid":
          return (
            <span className={`${base} bg-orange-100 text-orange-700 border-orange-300`}>
              Unpaid
            </span>
          );
        case "paid":
          return (
            <span className={`${base} bg-green-100 text-green-700 border-green-300`}>
              Paid
            </span>
          );
        case "refunded":
          return (
            <span className={`${base} bg-purple-100 text-purple-700 border-purple-300`}>
              Refunded
            </span>
          );
        default:
          return (
            <span className={`${base} bg-gray-100 text-gray-600 border-gray-300`}>
              Unknown
            </span>
          );
      }
    }
  };

  if (isAuthLoading) {
    return <LoadingSpinner fullScreen text="Loading user data..." />;
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-md">
        <header className="mb-4">
          <h1 className="text-xl sm:text-2xl font-normal mb-2 m-0">My Orders</h1>
          <p className="text-sm text-gray-600 mb-4">
            View and manage your order history. Click on an order to see detailed information.
          </p>
        </header>

        <div className="mb-6 space-y-4">
          <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
            <legend className="text-sm sm:text-base font-semibold">Search & Filter</legend>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search by ${searchType}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 pl-10 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSearchType("phone")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                      searchType === "phone"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Phone
                  </button>
                  <button
                    onClick={() => setSearchType("address")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                      searchType === "address"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Address
                  </button>
                </div>

                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`px-3 py-1.5 border-2 border-gray-300 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${
                    showFilterPanel || statusFilter !== "all"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-900 hover:bg-gray-50 hover:border-blue-600"
                  } focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                    />
                  </svg>
                  Filter
                  {statusFilter !== "all" && (
                    <span className="bg-white text-gray-900 text-xs px-1.5 py-0.5 rounded-full">
                      {statusFilter}
                    </span>
                  )}
                </button>

                {(searchQuery || statusFilter !== "all") && (
                  <ProductButton
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setSearchType("phone");
                    }}
                  >
                    Clear
                  </ProductButton>
                )}
              </div>
            </div>

            {showFilterPanel && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <fieldset className="border-2 border-gray-300 rounded-xl p-3">
                  <legend className="text-sm font-semibold">Order Status</legend>
                  <div className="flex flex-wrap gap-2">
                    {["all", "pending", "confirmed", "shipping", "delivered", "cancelled"].map((status) => (
                      <label key={status} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="statusFilter"
                          value={status}
                          checked={statusFilter === status}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="mr-2 accent-amber-400"
                        />
                        <span className="text-sm capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}
          </fieldset>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <p className="text-sm text-gray-600">
            Showing {Math.min(startIndex + 1, filteredOrders.length)}–
            {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}{" "}
            orders
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center gap-4" role="status">
            <div className="text-gray-400">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            {orders.length === 0 ? (
              <>
                <p className="text-gray-500 italic text-lg">No orders found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Your orders will appear here once you make a purchase
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500 italic text-lg">
                  No orders match your search
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your search criteria or filters
                </p>
                <ProductButton
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSearchType("phone");
                  }}
                  className="text-blue-600"
                >
                  Clear Filters
                </ProductButton>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <article
                key={order._id}
                className="border-2 border-gray-300 rounded-xl p-4 sm:p-5 bg-white hover:shadow-md transition"
              >
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500">Order #{order._id}</p>
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(order.orderDate)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 text-sm">
                  <p>
                    <strong>Address: </strong>
                    {searchType === "address" && searchQuery ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: order.addressReceive?.replace(
                            new RegExp(`(${searchQuery})`, "gi"),
                            '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                          ),
                        }}
                      />
                    ) : (
                      <span>{order.addressReceive}</span>
                    )}
                  </p>
                  <p>
                    <strong>Phone: </strong>
                    {searchType === "phone" && searchQuery ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: order.phone?.replace(
                            new RegExp(`(${searchQuery})`, "gi"),
                            '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                          ),
                        }}
                      />
                    ) : (
                      <span>{order.phone}</span>
                    )}
                  </p>
                  <p>
                    <strong>Payment:</strong> {order.payment_method}
                  </p>
                  <p>
                    <strong>Total:</strong>{" "}
                    {order.finalPrice
                      ? order.finalPrice.toLocaleString() + "₫"
                      : "—"}
                  </p>
                  <p>
                    <strong>Order Status:</strong>{" "}
                    {getStatusBadge(order.order_status, "order")}
                  </p>
                  <p>
                    <strong>Payment Status:</strong>{" "}
                    {getStatusBadge(order.pay_status, "pay")}
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  {order.pay_status?.toLowerCase() === "paid" && (
                    <ProductButton
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/bills/${order._id}`)}
                      className="text-green-600"
                      title="View Bill"
                    >
                      <svg
                        className="w-4 h-4 inline mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      View Bill
                    </ProductButton>
                  )}
                  <ProductButton
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedOrderId(order._id)}
                    title="View Details"
                  >
                    <svg
                      className="w-4 h-4 inline mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View Details
                  </ProductButton>
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredOrders.length > itemsPerPage && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <ProductButton
                variant="default"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </ProductButton>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const shouldShow =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!shouldShow) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 py-1 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <ProductButton
                      key={page}
                      variant={page === currentPage ? "primary" : "default"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </ProductButton>
                  );
                })}
              </div>

              <ProductButton
                variant="default"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </ProductButton>
            </div>
          </div>
        )}
      </section>

      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};

export default Orders;