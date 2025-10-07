import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import axiosClient from "../common/axiosClient";
import OrderDetailsModal from "../components/OrderDetails";

const Orders = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchOrders = useCallback(
    async (query = "") => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let url = `/orders?acc_id=${user._id}`;
        if (query.trim()) {
          url = `/orders/search?acc_id=${user._id}&q=${encodeURIComponent(query)}`;
        }
        const res = await axiosClient.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : [];
        const sorted = data.sort(
          (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
        );
        setOrders(sorted);
      } catch (err) {
        setError(err.message);
        showToast("Failed to load orders", "error");
      } finally {
        setLoading(false);
      }
    },
    [user, showToast]
  );

  useEffect(() => {
    if (!isAuthLoading && user) fetchOrders();
  }, [isAuthLoading, user, fetchOrders]);

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
      switch (status) {
        case "pending":
          return (
            <span className={`${base} bg-yellow-100 text-yellow-700 border-yellow-300`}>
              Pending
            </span>
          );
        case "shipping":
          return (
            <span className={`${base} bg-blue-100 text-blue-700 border-blue-300`}>
              Shipping
            </span>
          );
        case "completed":
          return (
            <span className={`${base} bg-green-100 text-green-700 border-green-300`}>
              Completed
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
      // pay_status
      switch (status) {
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

  if (isAuthLoading)
    return <div className="text-center py-8 text-gray-600">Loading...</div>;

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-white py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-yellow-200">
        <h1 className="text-3xl font-bold text-yellow-600 text-center mb-8">
          My Orders
        </h1>

        {/* 🔍 Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrders(searchQuery);
          }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-sm px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          />
          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-5 py-2 rounded-lg transition"
          >
            Search
          </button>
        </form>

        {error && (
          <p className="text-red-600 text-center mb-4 font-medium">{error}</p>
        )}

        {loading ? (
          <p className="text-center text-gray-600">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-500 italic">No orders found</p>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article
                key={order._id}
                className="border border-yellow-200 rounded-xl p-5 bg-white hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <p className="text-sm text-gray-500">
                    <strong className="text-yellow-600">Order ID:</strong>{" "}
                    {order._id}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.orderDate)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 text-sm">
                  <p>
                    <strong>Address:</strong> {order.addressReceive}
                  </p>
                  <p>
                    <strong>Phone:</strong> {order.phone}
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

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setSelectedOrderId(order._id)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition"
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* 🟡 Order Details Modal */}
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