import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import Api from "../../common/SummaryAPI";
import OrderDetailsModal from "../../components/OrderDetails";
import LoadingSpinner, { LoadingSkeleton } from "../../components/LoadingSpinner";

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Mock data for testing rendering (commented out)
  /*
  const mockOrders = [
    {
      _id: "68f9051c946d7c3805019eb8",
      acc_id: { _id: "68cd38cf459615ba0cf0e88b", username: "admin", name: "Владимир Владимирович Путин", email: "admin@email.com", phone: "0932145678", address: "Moscow, Russian Federation", image: "https://res.cloudinary.com/dsevkup6t/image/upload/v1760718958/gash_app/mt4yu1jup7nbbllgzn2d.jpg" },
      addressReceive: "ABCAAAAA",
      name: "asssssssssss",
      phone: "0987654321",
      totalPrice: 123,
      discountAmount: 0,
      finalPrice: 123,
      order_status: "delivered",
      pay_status: "paid",
      payment_method: "VNPAY",
      refund_status: "not_applicable",
      refund_proof: "",
      orderDetails: [
        {
          feedback: { rating: null, content: "", created_at: null, updated_at: null, is_deleted: false },
          _id: "68f9051c946d7c3805019ebb",
          variant_id: {
            _id: "68f23443a93db4bdb4e456c3",
            productId: { _id: "68f045b9c4673c3193d1fc45", productName: "tessssst" },
            productColorId: { _id: "687ba933e54fd20023e1beee", color_name: "Black" },
            productSizeId: { _id: "687ba9f8e54fd20023e1bf07", size_name: "L" },
            variantImage: "https://res.cloudinary.com/dsevkup6t/image/upload/v1760703555/gash_app/cdibokrqsc9smgpcnc4r.webp"
          },
          UnitPrice: 123,
          Quantity: 1
        }
      ],
      orderDate: "2025-10-22T16:23:56.105Z",
      createdAt: "2025-10-22T16:23:56.107Z",
      updatedAt: "2025-10-22T16:30:53.623Z",
      __v: 1
    }
  ];
  */

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

        // Fetch detailed order data for each order
        const detailedOrders = await Promise.all(
          data.map(async (order) => {
            try {
              const detailedResponse = await Api.order.getOrder(order._id, token);
              const orderDetailsResponse = await Api.order.getAllOrderDetails(order._id, token);
              return {
                ...detailedResponse.data.data,
                orderDetails: Array.isArray(orderDetailsResponse.data) ? orderDetailsResponse.data : []
              };
            } catch (err) {
              return order;
            }
          })
        );

        const sorted = detailedOrders.sort(
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

  const handleSearchAndFilter = useCallback(() => {
    let filtered = [...orders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => {
        if (searchType === "phone") {
          return order.phone?.toLowerCase().includes(query);
        } else {
          return order.addressReceive?.toLowerCase().includes(query);
        }
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => 
        order.order_status?.toLowerCase() === statusFilter.toLowerCase()
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen bg-white py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-yellow-200">
        <h1 className="text-3xl font-bold text-yellow-600 text-center mb-8">
          My Orders
        </h1>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search by ${searchType}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSearchType("phone")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${searchType === "phone"
                  ? "bg-white text-yellow-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                Phone
              </button>
              <button
                onClick={() => setSearchType("address")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${searchType === "address"
                  ? "bg-white text-yellow-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                Address
              </button>
            </div>

            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${showFilterPanel || statusFilter !== "all"
                ? "bg-yellow-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filter
              {statusFilter !== "all" && (
                <span className="bg-white text-yellow-600 text-xs px-1.5 py-0.5 rounded-full">
                  {statusFilter}
                </span>
              )}
            </button>

            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSearchType("phone");
                }}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
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
              className="border border-yellow-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {orders.length === 0 ? (
              <>
                <p className="text-gray-500 italic text-lg">No orders found</p>
                <p className="text-gray-400 text-sm mt-2">Your orders will appear here once you make a purchase</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 italic text-lg">No orders match your search</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria or filters</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSearchType("phone");
                  }}
                  className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {currentOrders.map((order) => (
              <article
                key={order._id}
                className="border border-yellow-200 rounded-xl p-5 bg-white hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <div className="flex items-center gap-3">
                    {order.orderDetails?.length > 0 ? (
                      <>
                        <img
                          src={order.orderDetails[0]?.variant_id?.variantImage || "/placeholder.png"}
                          alt={order.orderDetails[0]?.variant_id?.productId?.productName || "Product"}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {order.orderDetails[0]?.variant_id?.productId?.productName || "Unknown Product"}
                          </p>
                          {order.orderDetails.length > 1 && (
                            <p className="text-xs text-gray-500">
                              + {order.orderDetails.length - 1} product{order.orderDetails.length > 2 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No items</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.orderDate)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 text-sm">
                  <p>
                    <strong>Address: </strong>
                    {searchType === "address" && searchQuery ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: order.addressReceive?.replace(
                            new RegExp(`(${searchQuery})`, 'gi'),
                            '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                          )
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
                            new RegExp(`(${searchQuery})`, 'gi'),
                            '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                          )
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
                  {order.pay_status?.toLowerCase() === 'paid' && (
                    <button
                      onClick={() => navigate(`/bills/${order._id}`)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition flex items-center gap-2"
                      title="View Bill"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Bill
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrderId(order._id)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition flex items-center gap-2"
                    title="View Details"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredOrders.length > itemsPerPage && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1 ${currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

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
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition ${page === currentPage
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-1 ${currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
                  }`}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

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