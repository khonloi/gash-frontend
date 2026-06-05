import React from "react";
import { useNavigate } from "react-router-dom";
import OrderDetailsModal from "../../features/orders/components/OrderDetails";
import OrderSuccessModal from "../../features/orders/components/OrderSuccessModal";
import Button from "../../components/ui/Button";
import { useOrders } from "../../features/orders/hooks/useOrders";
import ListLayout from "../../components/layout/ListLayout";

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
    formatPrice,
    itemsPerPage
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

  if (!isAuthLoading && !user) {
    navigate("/login");
    return null;
  }

  const renderOrder = (order) => {
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
  };

  return (
    <ListLayout
      title="My Orders"
      searchPlaceholder="Search by product name, order ID, or status..."
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      startIndex={startIndex}
      endIndex={endIndex}
      loading={loading}
      emptyIcon={
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
      }
      emptyStateTitle="No orders found"
      emptyStateMessage="Your orders will appear here once you make a purchase"
      noResultsTitle="No orders match your search"
      noResultsMessage="Try adjusting your search criteria or filters"
      totalItems={orders.length}
      filteredItems={filteredOrders}
      currentItems={currentOrders}
      renderItem={renderOrder}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      totalPages={totalPages}
      handlePageChange={handlePageChange}
      itemNamePlural="orders"
      isAuthLoading={isAuthLoading}
      authLoadingText="Loading user data..."
    >
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      <OrderSuccessModal open={!!vnpaySuccessInfo} info={{ ...vnpaySuccessInfo, message: undefined }} onClose={handleCloseVNPayModal} />
    </ListLayout>
  );
};

export default Orders;
