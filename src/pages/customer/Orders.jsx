import React from "react";
import { useNavigate } from "react-router-dom";
import OrderDetailsModal from "../../features/orders/components/OrderDetails";
import OrderSuccessModal from "../../features/orders/components/OrderSuccessModal";
import LoadingSpinner, { LoadingSkeleton } from "../../components/ui/LoadingSpinner";
import Button from "../../components/ui/Button";
import { useOrders } from "../../features/orders/hooks/useOrders";

const Orders = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthLoading,
    orders,
    filteredOrders,
    loading,
    searchQuery,
    setSearchQuery,
    selectedOrderId,
    setSelectedOrderId,
    vnpaySuccessInfo,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    currentOrders,
    handlePageChange,
    handleCloseVNPayModal,
    formatDate,
    formatPrice
  } = useOrders();

  const getStatusBadge = (status, type = "order") => {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium";
    if (type === "order") {
      switch (status?.toLowerCase()) {
        case "pending":
          return (
            <span className={`${base} bg-yellow-100 text-yellow-800`}>
              Pending
            </span>
          );
        case "confirmed":
          return (
            <span className={`${base} bg-blue-100 text-blue-800`}>
              Confirmed
            </span>
          );
        case "shipping":
          return (
            <span className={`${base} bg-indigo-100 text-indigo-800`}>
              Shipping
            </span>
          );
        case "delivered":
          return (
            <span className={`${base} bg-green-100 text-green-800`}>
              Delivered
            </span>
          );
        case "cancelled":
          return (
            <span className={`${base} bg-red-100 text-red-800`}>
              Cancelled
            </span>
          );
        default:
          return (
            <span className={`${base} bg-gray-100 text-gray-800`}>
              Unknown
            </span>
          );
      }
    } else {
      switch (status?.toLowerCase()) {
        case "unpaid":
          return (
            <span className={`${base} bg-orange-100 text-orange-800`}>
              Unpaid
            </span>
          );
        case "paid":
          return (
            <span className={`${base} bg-green-100 text-green-800`}>
              Paid
            </span>
          );
        case "refunded":
          return (
            <span className={`${base} bg-purple-100 text-purple-800`}>
              Refunded
            </span>
          );
        default:
          return (
            <span className={`${base} bg-gray-100 text-gray-800`}>
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
    <div className="page-container page-container-centered">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-5xl shadow-sm border border-gray-200">
        <header className="mb-4">
          <h1 className="text-xl sm:text-2xl font-normal mb-2 m-0">My Orders</h1>
        </header>

        <div className="mb-6 space-y-4">
          <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
            <legend className="text-sm sm:text-base font-semibold m-0">Search</legend>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <fieldset className="flex flex-col">
                  <div className="relative">
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search by product name, order ID, or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-3 pl-10 border-2 border-gray-300 rounded-md bg-white text-xs sm:text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
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
                </fieldset>
              </div>

              {searchQuery && (
                <div className="flex items-end">
                  <Button
                    variant="default"
                    size="md"
                    onClick={() => {
                      setSearchQuery("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </fieldset>
        </div>

        <div className="mb-6">
          <p className="text-xs sm:text-sm text-gray-600">
            Showing {Math.min(startIndex + 1, filteredOrders.length)}–
            {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}{" "}
            orders
          </p>
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
                <p className="text-gray-500 italic text-base sm:text-lg">No orders found</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">
                  Your orders will appear here once you make a purchase
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-500 italic text-base sm:text-lg">
                  No orders match your search
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">
                  Try adjusting your search criteria or filters
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                  }}
                  className="text-blue-600"
                >
                  Clear Search
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentOrders.map((order) => {
              // Get first product from orderDetails
              // Note: getUserOrdersService returns variantId (not variant) with populated productId
              const firstProduct = order.orderDetails?.[0];
              const productImage = firstProduct?.variantId?.variantImage || "/placeholder.png";
              const productName = firstProduct?.variantId?.productId?.productName || "Product (Variant not available)";

              return (
                <article
                  key={order._id}
                  className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row gap-4 transition-shadow hover:shadow-sm border border-gray-200 focus-within:shadow-sm"
                  tabIndex={0}
                  aria-label={`Order: ${order._id}`}
                >
                  <div className="flex items-stretch gap-6 flex-1">
                    {/* Product Image */}
                    {firstProduct && (
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-20 sm:w-24 aspect-square object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src = "/placeholder.png";
                        }}
                      />
                    )}

                    {/* Order Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base sm:text-lg font-semibold text-gray-900 m-0 line-clamp-2">
                          {productName || "Order"}
                        </p>
                        {order.orderDetails?.length > 1 && (
                          <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            +{order.orderDetails.length - 1} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm text-gray-600 m-0">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <span className="text-gray-400">•</span>
                        <p className="text-xs sm:text-sm text-gray-600 m-0">
                          {formatDate(order.orderDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap mt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getStatusBadge(order.orderStatus, "order")}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Payment:</span>
                          {getStatusBadge(order.payStatus, "pay")}
                        </div>
                      </div>

                      <p className="text-base font-semibold text-red-600 m-0 mt-1">
                        Total: {formatPrice(order.finalPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-center sm:justify-center gap-3 sm:gap-4">
                    {order.payStatus?.toLowerCase() === "paid" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/bills/${order._id}`)}
                        className="text-green-600"
                        title="View Bill"
                      >
                        View Bill
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedOrderId(order._id)}
                      title="View Details"
                    >
                      View Details
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {filteredOrders.length > itemsPerPage && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <Button
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
              </Button>

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
                    <Button
                      key={page}
                      variant={page === currentPage ? "primary" : "default"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
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
              </Button>
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

      <OrderSuccessModal open={!!vnpaySuccessInfo} info={{ ...vnpaySuccessInfo, message: undefined }} onClose={handleCloseVNPayModal} />
    </div>
  );
};

export default Orders;
