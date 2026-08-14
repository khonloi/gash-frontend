import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";
import Api from "../../../common/SummaryAPI";
import { getSocket, registerUserSocket } from "../../../common/socketManager";
import { formatPrice, formatDate } from "../../../utils/formatters";

export const useOrders = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [vnpaySuccessInfo, setVnpaySuccessInfo] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchOrders = useCallback(
    async () => {
      if (!user?._id) {
        showToast("No user ID available", "error");
        return;
      }
      setLoading(true);
      try {
        const response = await Api.order.getOrders(user._id);
        const data = response.data.data || [];

        if (!Array.isArray(data)) {
          showToast("Invalid API response format", "error");
          setOrders([]);
          setFilteredOrders([]);
          setLoading(false);
          return;
        }

        const sorted = data.sort(
          (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
        );
        setOrders(sorted);
        setFilteredOrders(sorted);
      } catch {
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

  useEffect(() => {
    const params = window.location.search;
    if (params && params.includes('vnp_')) {
      const fetchPaymentResult = async () => {
        try {
          const response = await Api.order.vnpayReturn(params);
          const data = response.data;
          if (data.success && data.data && data.data.code === '00') {
            setVnpaySuccessInfo({
              status: 'success',
              message: data.message || 'Your order will be promptly prepared and sent to you.!',
              orderId: data.data?.orderId || data.orderId || '',
              amount: data.data?.amount || data.amount || '',
              paymentMethod: data.data?.paymentMethod || 'VNPay',
            });
          } else {
            setVnpaySuccessInfo({
              status: 'failed',
              message: data.message || 'Payment failed. Please try again.',
              orderId: data.data?.orderId || data.orderId || '',
              amount: data.data?.amount || data.amount || '',
              paymentMethod: 'VNPay',
            });
          }
        } catch {
          setVnpaySuccessInfo({
            status: 'failed',
            message: 'Payment verification failed. Please check your order status.',
            orderId: '',
            amount: '',
            paymentMethod: 'VNPay',
          });
        }
      };
      fetchPaymentResult();
      navigate(window.location.pathname, { replace: true });
    }
  }, [isAuthLoading, user, navigate]);

  useEffect(() => {
    if (!user?._id) return;

    registerUserSocket(user._id);
    const socket = getSocket();

    const handleOrderUpdated = (payload) => {
      const updatedOrder = payload.order || payload;
      const orderUserId = payload.userId || updatedOrder.accountId?._id || updatedOrder.accountId;

      if (orderUserId && orderUserId.toString() === user._id.toString()) {
        setOrders((prevOrders) => {
          const existingIndex = prevOrders.findIndex((o) => o._id === updatedOrder._id);

          if (existingIndex !== -1) {
            const existingOrder = prevOrders[existingIndex];
            const updated = [...prevOrders];

            const hasPopulatedDetails = updatedOrder.orderDetails?.some(
              (detail) => detail?.variantId?.productId?.productName
            );

            const preservedOrderDetails = hasPopulatedDetails
              ? updatedOrder.orderDetails
              : existingOrder.orderDetails;

            updated[existingIndex] = {
              ...existingOrder,
              ...updatedOrder,
              orderDetails: preservedOrderDetails || updatedOrder.orderDetails || existingOrder.orderDetails,
            };
            return updated.sort(
              (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
            );
          } else {
            return [
              updatedOrder,
              ...prevOrders,
            ].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
          }
        });

        setFilteredOrders((prevFiltered) => {
          const existingIndex = prevFiltered.findIndex((o) => o._id === updatedOrder._id);

          if (existingIndex !== -1) {
            const existingOrder = prevFiltered[existingIndex];
            const updated = [...prevFiltered];

            const hasPopulatedDetails = updatedOrder.orderDetails?.some(
              (detail) => detail?.variantId?.productId?.productName
            );

            const preservedOrderDetails = hasPopulatedDetails
              ? updatedOrder.orderDetails
              : existingOrder.orderDetails;

            updated[existingIndex] = {
              ...existingOrder,
              ...updatedOrder,
              orderDetails: preservedOrderDetails || updatedOrder.orderDetails || existingOrder.orderDetails,
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

        if (updatedOrder.orderStatus) {
          const statusMessages = {
            pending: "Your order is pending",
            confirmed: "Your order has been confirmed",
            shipping: "Your order is on the way!",
            delivered: "Your order has been delivered!",
            cancelled: "Your order has been cancelled",
          };
          const message = statusMessages[updatedOrder.orderStatus] || "Order status updated";
          showToast(message, "info");
        }
      }
    };

    socket.on("orderUpdated", handleOrderUpdated);

    return () => {
      socket.off("orderUpdated", handleOrderUpdated);
    };
  }, [user, showToast]);

  const handleSearchAndFilter = useCallback(() => {
    let filtered = [...orders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        if (order._id?.toLowerCase().includes(query)) {
          return true;
        }

        if (order.orderStatus?.toLowerCase().includes(query)) {
          return true;
        }

        if (order.payStatus?.toLowerCase().includes(query)) {
          return true;
        }

        if (order.orderDetails && order.orderDetails.length > 0) {
          const hasMatchingProduct = order.orderDetails.some((detail) => {
            const productName = detail.variantId?.productId?.productName;
            return productName?.toLowerCase().includes(query);
          });
          if (hasMatchingProduct) {
            return true;
          }
        }

        return false;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery]);

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

  const handleCloseVNPayModal = () => {
    setVnpaySuccessInfo(null);
    if (user?._id) {
      fetchOrders();
    }
  };

  return {
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
    setVnpaySuccessInfo,
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    currentOrders,
    handlePageChange,
    handleCloseVNPayModal,
    formatDate,
    formatPrice
  };
};
