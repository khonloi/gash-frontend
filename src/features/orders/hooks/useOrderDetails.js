import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../../../context/AuthContext";
import { SOCKET_URL } from "../../../common/axiosClient";
import Api from "../../../common/SummaryAPI";
import { useToast } from "../../../hooks/useToast";

export const useOrderDetails = (orderId) => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [existingFeedbacks, setExistingFeedbacks] = useState({});
    
    // Feedback loading states
    const [loadingStates, setLoadingStates] = useState({
        submitting: {},
        editing: {},
        deleting: {}
    });

    // VNPay countdown timer state
    const [timeLeft, setTimeLeft] = useState(null);
    const [isVNPayExpired, setIsVNPayExpired] = useState(false);

    const socketRef = useRef(null);

    // 🧭 Fetch order with all details
    const fetchOrderDetails = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await Api.order.getOrder(orderId, token);
            const orderData = response.data.data;
            setOrder(orderData);
        } catch (err) {
            showToast(err.message || "Failed to load order details", "error");
        } finally {
            setLoading(false);
        }
    }, [orderId, showToast]);

    // 🔍 Extract feedbacks from order data
    const extractFeedbacksFromOrder = useCallback(() => {
        if (!order?.orderDetails?.length) {
            setExistingFeedbacks({});
            return;
        }

        const feedbackMap = {};

        order.orderDetails.forEach((detail, index) => {
            const key = detail.variant?._id || `item_${index}`;

            if (!detail.feedback) return;

            const isDeleted = detail.feedback.isDeleted === true;
            const hasOriginalRating = detail.feedback.rating !== null && detail.feedback.rating !== undefined && detail.feedback.rating >= 1 && detail.feedback.rating <= 5;
            const hasOriginalContent = detail.feedback.content && detail.feedback.content.trim() !== '' && detail.feedback.content !== 'This feedback has been deleted by staff/admin';

            feedbackMap[key] = {
                rating: isDeleted ? null : detail.feedback.rating,
                content: isDeleted
                    ? 'This feedback has been deleted by staff/admin'
                    : detail.feedback.content || '',
                has_rating: !isDeleted && hasOriginalRating,
                has_content: !isDeleted ? hasOriginalContent : true,
                isDeleted: isDeleted,
                createdAt: detail.feedback.createdAt,
                updatedAt: detail.feedback.updatedAt
            };
        });

        setExistingFeedbacks(feedbackMap);
    }, [order?.orderDetails]);

    // Initial fetch
    useEffect(() => {
        if (orderId) fetchOrderDetails();
    }, [orderId, fetchOrderDetails]);

    // Update feedbacks when order changes
    useEffect(() => {
        if (order?.orderDetails) {
            extractFeedbacksFromOrder();
        }
    }, [order?.orderDetails, extractFeedbacksFromOrder]);

    // VNPay Timer Logic
    useEffect(() => {
        if (order?.paymentMethod === 'VNPAY' && order?.payStatus === 'unpaid' && order?.vnpay_expiry_time) {
            const expiryTime = new Date(order.vnpay_expiry_time);
            const now = new Date();

            if (expiryTime > now) {
                const initialTimeLeft = Math.floor((expiryTime - now) / 1000);
                setTimeLeft(initialTimeLeft);
                setIsVNPayExpired(false);

                const timer = setInterval(() => {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            setIsVNPayExpired(true);
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                return () => clearInterval(timer);
            } else {
                setTimeLeft(0);
                setIsVNPayExpired(true);
            }
        } else {
            setTimeLeft(null);
            setIsVNPayExpired(false);
        }
    }, [order]);

    // Socket.IO for real-time updates
    useEffect(() => {
        if (!user?._id || !orderId) return;

        if (!socketRef.current) {
            const token = localStorage.getItem("token");
            socketRef.current = io(SOCKET_URL, {
                transports: ["websocket", "polling"],
                auth: { token },
                withCredentials: true,
            });
        }

        const socket = socketRef.current;

        socket.on("connect", () => {
            socket.emit("userConnected", user._id);
            const token = localStorage.getItem("token");
            if (token) {
                socket.emit("authenticate", token);
            }
        });

        socket.on("orderUpdated", (payload) => {
            const updatedOrder = payload.order || payload;
            const orderUserId = payload.userId || updatedOrder.accountId?._id || updatedOrder.accountId;

            if (orderUserId && orderUserId.toString() === user._id.toString() && updatedOrder._id === orderId) {
                setOrder((prevOrder) => {
                    if (!prevOrder) return updatedOrder;

                    const hasPopulatedDetails = updatedOrder.orderDetails?.some(
                        (detail) => detail?.variantId?.productId?.productName
                    );

                    const preservedOrderDetails = hasPopulatedDetails
                        ? updatedOrder.orderDetails
                        : prevOrder.orderDetails;

                    return {
                        ...prevOrder,
                        ...updatedOrder,
                        orderDetails: preservedOrderDetails || updatedOrder.orderDetails || prevOrder.orderDetails,
                    };
                });
            }
        });

        return () => {
            socket.off("connect");
            socket.off("orderUpdated");
        };
    }, [user?._id, orderId]);

    // Cancel order
    const cancelOrder = async (reason) => {
        try {
            const token = localStorage.getItem("token");
            await Api.order.cancel(orderId, reason, token);
            showToast("Order cancelled successfully", "success");
            await fetchOrderDetails();
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message || "Failed to cancel order" };
        }
    };

    // Feedback actions
    const handleFeedbackAction = async (actionType, variantId, data = {}) => {
        const loadingKey = actionType === 'add' ? 'submitting' : (actionType === 'edit' ? 'editing' : 'deleting');
        
        setLoadingStates(prev => ({
            ...prev,
            [loadingKey]: { ...prev[loadingKey], [variantId]: true }
        }));

        const timeoutId = setTimeout(() => {
            setLoadingStates(prev => ({
                ...prev,
                [loadingKey]: { ...prev[loadingKey], [variantId]: false }
            }));
        }, 10000);

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token is missing");

            const actualVariantId = variantId.startsWith('item_') ? null : variantId;

            if (actionType === 'delete') {
                await Api.feedback.deleteFeedback(orderId, actualVariantId, token);
                showToast("Feedback deleted successfully", "success");
            } else {
                const { rating, comment } = data;
                if (!rating || rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");
                if (comment && comment.length > 500) throw new Error("Comment cannot exceed 500 characters");

                const feedbackData = {
                    rating: parseInt(rating),
                    content: comment ? comment.trim() : null
                };

                if (actionType === 'add') {
                    await Api.feedback.addFeedback(orderId, actualVariantId, feedbackData, token);
                    showToast("Feedback created successfully", "success");
                } else {
                    await Api.feedback.editFeedback(orderId, actualVariantId, feedbackData, token);
                    showToast("Feedback updated successfully", "success");
                }
            }

            await fetchOrderDetails();
            return { success: true };
        } catch (err) {
            let errorMessage = `Failed to ${actionType} feedback`;
            if (err.response?.data?.message) errorMessage = err.response.data.message;
            else if (err.response?.status === 500) errorMessage = "Server error - please try again later";
            else if (err.response?.status === 400) errorMessage = "Invalid request - please check your input";
            else if (err.response?.status === 404) errorMessage = "Order or product not found";
            else if (err.message) errorMessage = err.message;

            showToast(errorMessage, "error");
            return { success: false, error: errorMessage };
        } finally {
            clearTimeout(timeoutId);
            setLoadingStates(prev => ({
                ...prev,
                [loadingKey]: { ...prev[loadingKey], [variantId]: false }
            }));
        }
    };

    const submitFeedback = (variantId, comment, rating) => handleFeedbackAction('add', variantId, { comment, rating });
    const editFeedback = (variantId, comment, rating) => handleFeedbackAction('edit', variantId, { comment, rating });
    const deleteFeedback = (variantId) => handleFeedbackAction('delete', variantId);

    return {
        order,
        loading,
        existingFeedbacks,
        loadingStates,
        timeLeft,
        isVNPayExpired,
        fetchOrderDetails,
        cancelOrder,
        submitFeedback,
        editFeedback,
        deleteFeedback
    };
};
