import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";
import Api from "../../../common/SummaryAPI";

export const useFeedback = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const { showToast } = useToast();

  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [eligibleItems, setEligibleItems] = useState([]);
  const [filteredEligibleItems, setFilteredEligibleItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Extract feedbacks from orders
  const extractFeedbacksFromOrders = useCallback((orders) => {
    const feedbackList = [];

    orders.forEach((order) => {
      if (order.orderDetails && Array.isArray(order.orderDetails)) {
        order.orderDetails.forEach((detail, index) => {
          // Check for feedback in multiple possible locations
          const feedback = detail.feedback || detail.feedbackId || null;

          if (feedback) {
            // Handle both object and ID reference
            const feedbackObj = typeof feedback === 'object' ? feedback : null;

            if (feedbackObj) {
              // Check for actual content/rating
              const hasContent = feedbackObj.content && feedbackObj.content.trim() !== '';
              const hasRating = feedbackObj.rating !== null && feedbackObj.rating !== undefined && feedbackObj.rating >= 1 && feedbackObj.rating <= 5;
              // Also check has_* flags if they exist
              const hasContentFlag = feedbackObj.has_content === true;
              const hasRatingFlag = feedbackObj.has_rating === true;

              // Include feedback ONLY if it has content OR rating (checking both direct values and flags)
              // Filter out feedbacks with no rating and no content
              // Include deleted feedbacks so they can be shown with deletion message (but only if they have rating or content)
              if ((hasContent || hasRating || hasContentFlag || hasRatingFlag)) {
                // Note: getUserOrdersService returns variantId (not variant) with populated productId
                // But getOrder returns variant, so we need to handle both
                const variantId = detail.variantId?._id || detail.variant?._id || detail.variantId || detail.variant || null;
                const variantKey = variantId || `item_${index}`;

                // Try multiple paths for product information
                const productName =
                  detail.variantId?.productId?.productName ||
                  detail.variantId?.productId?.name ||
                  detail.variant?.productId?.productName ||
                  detail.variant?.product?.name ||
                  detail.variant?.productId?.name ||
                  "Product (Variant not available)";

                const productImage =
                  detail.variantId?.variantImage ||
                  detail.variantId?.image ||
                  detail.variant?.variantImage ||
                  detail.variant?.image ||
                  "/placeholder.png";

                const color =
                  detail.variantId?.productColorId?.productColorName ||
                  detail.variantId?.color?.name ||
                  detail.variant?.productColorId?.productColorName ||
                  detail.variant?.color?.name ||
                  "N/A";

                const size =
                  detail.variantId?.productSizeId?.productSizeName ||
                  detail.variantId?.size?.name ||
                  detail.variant?.productSizeId?.productSizeName ||
                  detail.variant?.size?.name ||
                  "N/A";

                feedbackList.push({
                  _id: `${order._id}_${variantKey}`,
                  orderId: order._id,
                  orderDate: order.orderDate || order.createdAt,
                  orderStatus: order.orderStatus,
                  variant: detail.variantId || detail.variant,
                  variantId: variantId,
                  feedback: feedbackObj,
                  orderDetail: detail,
                  productName,
                  productImage,
                  color,
                  size,
                  quantity: detail.quantity,
                  unitPrice: detail.unitPrice || detail.unitPrice,
                  totalPrice: detail.totalPrice || detail.TotalPrice,
                });
              }
            }
          }
        });
      }
    });

    // Sort by order date (newest first)
    return feedbackList.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  }, []);

  // Extract eligible items (delivered orders without feedback)
  const extractEligibleItems = useCallback((orders) => {
    const eligibleList = [];

    orders.forEach((order) => {
      // Only process delivered orders
      if (order.orderStatus?.toLowerCase() !== 'delivered') {
        return;
      }

      if (order.orderDetails && Array.isArray(order.orderDetails)) {
        order.orderDetails.forEach((detail, index) => {
          // Check if feedback exists
          const feedback = detail.feedback || detail.feedbackId || null;
          const feedbackObj = typeof feedback === 'object' ? feedback : null;

          // Check if feedback exists and is valid (must have rating or content)
          let hasValidFeedback = false;
          if (feedbackObj) {
            const hasContent = feedbackObj.content && feedbackObj.content.trim() !== '';
            const hasRating = feedbackObj.rating !== null && feedbackObj.rating !== undefined && feedbackObj.rating >= 1 && feedbackObj.rating <= 5;
            const hasContentFlag = feedbackObj.has_content === true;
            const hasRatingFlag = feedbackObj.has_rating === true;

            // Only consider valid if it has rating OR content
            hasValidFeedback = (hasContent || hasRating || hasContentFlag || hasRatingFlag);
          }

          // If no valid feedback exists, this item is eligible
          if (!hasValidFeedback) {
            const variantId = detail.variantId?._id || detail.variant?._id || detail.variantId || detail.variant || null;
            const variantKey = variantId || `item_${index}`;

            // Try multiple paths for product information
            const productName =
              detail.variantId?.productId?.productName ||
              detail.variantId?.productId?.name ||
              detail.variant?.productId?.productName ||
              detail.variant?.product?.name ||
              detail.variant?.productId?.name ||
              "Product (Variant not available)";

            const productImage =
              detail.variantId?.variantImage ||
              detail.variantId?.image ||
              detail.variant?.variantImage ||
              detail.variant?.image ||
              "/placeholder.png";

            const color =
              detail.variantId?.productColorId?.productColorName ||
              detail.variantId?.color?.name ||
              detail.variant?.productColorId?.productColorName ||
              detail.variant?.color?.name ||
              "N/A";

            const size =
              detail.variantId?.productSizeId?.productSizeName ||
              detail.variantId?.size?.name ||
              detail.variant?.productSizeId?.productSizeName ||
              detail.variant?.size?.name ||
              "N/A";

            eligibleList.push({
              _id: `${order._id}_${variantKey}`,
              orderId: order._id,
              orderDate: order.orderDate || order.createdAt,
              orderStatus: order.orderStatus,
              variant: detail.variantId || detail.variant,
              variantId: variantId,
              orderDetail: detail,
              productName,
              productImage,
              color,
              size,
              quantity: detail.quantity,
              unitPrice: detail.unitPrice || detail.unitPrice,
              totalPrice: detail.totalPrice || detail.TotalPrice,
            });
          }
        });
      }
    });

    // Sort by order date (newest first)
    return eligibleList.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  }, []);

  const fetchFeedbacks = useCallback(
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
          setFeedbacks([]);
          setFilteredFeedbacks([]);
          setLoading(false);
          return;
        }

        // Extract feedbacks from all orders
        const feedbackList = extractFeedbacksFromOrders(data);

        // Extract eligible items (delivered orders without feedback)
        const eligibleList = extractEligibleItems(data);

        setFeedbacks(feedbackList);
        setFilteredFeedbacks(feedbackList);
        setEligibleItems(eligibleList);
        setFilteredEligibleItems(eligibleList);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
        showToast("Failed to load feedbacks", "error");
        setFeedbacks([]);
        setFilteredFeedbacks([]);
      } finally {
        setLoading(false);
      }
    },
    [user, showToast, extractFeedbacksFromOrders, extractEligibleItems]
  );

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchFeedbacks();
    }
  }, [isAuthLoading, user, fetchFeedbacks]);

  const handleSearchAndFilter = useCallback(() => {
    let filtered = [...feedbacks];
    let filteredEligible = [...eligibleItems];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((feedback) => {
        // Search by Product Name
        if (feedback.productName?.toLowerCase().includes(query)) {
          return true;
        }

        // Search by Feedback Content
        if (feedback.feedback?.content?.toLowerCase().includes(query)) {
          return true;
        }

        // Search by Order ID
        if (feedback.orderId?.toLowerCase().includes(query)) {
          return true;
        }

        return false;
      });

      filteredEligible = filteredEligible.filter((item) => {
        // Search by Product Name
        if (item.productName?.toLowerCase().includes(query)) {
          return true;
        }

        // Search by Order ID
        if (item.orderId?.toLowerCase().includes(query)) {
          return true;
        }

        return false;
      });
    }

    setFilteredFeedbacks(filtered);
    setFilteredEligibleItems(filteredEligible);
  }, [feedbacks, eligibleItems, searchQuery]);

  useEffect(() => {
    handleSearchAndFilter();
    setCurrentPage(1);
  }, [handleSearchAndFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const displayItems = showEligibleOnly ? filteredEligibleItems : filteredFeedbacks;
  const totalPages = Math.ceil(displayItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = displayItems.slice(startIndex, endIndex);

  return {
    user,
    isAuthLoading,
    feedbacks,
    filteredFeedbacks,
    eligibleItems,
    filteredEligibleItems,
    loading,
    searchQuery,
    setSearchQuery,
    selectedFeedback,
    setSelectedFeedback,
    selectedOrderId,
    setSelectedOrderId,
    showEligibleOnly,
    setShowEligibleOnly,
    currentPage,
    itemsPerPage,
    fetchFeedbacks,
    handlePageChange,
    formatDate,
    displayItems,
    totalPages,
    startIndex,
    endIndex,
    currentItems
  };
};
