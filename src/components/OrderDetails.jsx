import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import { useToast } from "../hooks/useToast";
import FeedbackForm from "./FeedbackForm";
import LoadingSpinner, { LoadingForm, LoadingButton } from "./LoadingSpinner";
import ImageModal from "./ImageModal";
import ProductButton from "./ProductButton";

const OrderDetailsModal = ({ orderId, onClose }) => {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [existingFeedbacks, setExistingFeedbacks] = useState({});
    const [editingFeedback, setEditingFeedback] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);
    const [loadingStates, setLoadingStates] = useState({
        submitting: {},
        editing: {},
        deleting: {}
    });

    // 🧭 Fetch order with all details
    const fetchOrderDetails = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await Api.order.getOrder(orderId, token);

            // The API returns the complete order data in response.data.data
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
        if (!order?.orderDetails?.length) return;

        const feedbackMap = {};

        // Extract feedbacks from orderDetails
        order.orderDetails.forEach((detail, index) => {
            // Use index as key when variant is null, or variant._id when available
            const key = detail.variant?._id || `item_${index}`;

            if (detail.feedback) {
                // Only include feedback if it has content or rating and is not deleted
                // Check the has_* flags to determine if feedback exists
                const hasContent = detail.feedback.has_content && detail.feedback.content && detail.feedback.content.trim() !== '';
                const hasRating = detail.feedback.has_rating && detail.feedback.rating && detail.feedback.rating > 0;

                if ((hasContent || hasRating) && !detail.feedback.is_deleted) {
                    feedbackMap[key] = detail.feedback;
                }
            }
        });

        setExistingFeedbacks(feedbackMap);
    }, [order?.orderDetails]);

    useEffect(() => {
        if (orderId) fetchOrderDetails();
    }, [orderId, fetchOrderDetails]);

    useEffect(() => {
        if (order?.orderDetails?.length > 0) {
            extractFeedbacksFromOrder();
        }
    }, [order?.orderDetails, extractFeedbacksFromOrder]);

    const formatPrice = (p) =>
        p?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    // Render existing feedback
    const renderExistingFeedback = (feedback, variantId) => {
        if (!feedback) return null;

        const isEditing = editingFeedback[variantId];

        return (
            <div className="mt-3 p-3 sm:p-4 bg-gray-50 border-2 border-gray-300 rounded-xl">
                {/* ===== Your Feedback Section ===== */}
                <div className="space-y-3">
                    {/* --- Your Feedback --- */}
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-black">Your Feedback</h4>
                        <div className="flex items-center gap-2">
                            {/* Edit & Delete buttons */}
                            <button
                                onClick={() => toggleEditFeedback(variantId)}
                                disabled={loadingStates.editing[variantId] || loadingStates.deleting[variantId]}
                                className={`p-1 rounded transition ${loadingStates.editing[variantId] || loadingStates.deleting[variantId]
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                                    }`}
                                title={isEditing ? 'Cancel Edit' : 'Edit Feedback'}
                            >
                                {loadingStates.editing[variantId] ? (
                                    <LoadingSpinner size="sm" color="blue" />
                                ) : isEditing ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414
               a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                )}
                            </button>

                            <button
                                onClick={() => handleDeleteFeedback(variantId)}
                                disabled={loadingStates.editing[variantId] || loadingStates.deleting[variantId]}
                                className={`p-1 rounded transition ${loadingStates.editing[variantId] || loadingStates.deleting[variantId]
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                    }`}
                                title="Delete Feedback"
                            >
                                {loadingStates.deleting[variantId] ? (
                                    <LoadingSpinner size="sm" color="red" />
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
             a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4
             a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* --- Rating --- */}
                    {feedback.has_rating && feedback.rating && feedback.rating > 0 && (
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 
            0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 
            2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 
            1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 
            0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292
            a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461
            a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                    )}
                </div>
                {feedback.has_content && feedback.content && feedback.content.trim() !== '' && (
                    <p className="text-gray-700 text-sm">{feedback.content}</p>
                )}

                {/* Edit Mode - Use same modal form as create */}
                {isEditing && (
                    <FeedbackForm
                        variantId={variantId}
                        onSubmit={handleEditFeedback}
                        initialRating={feedback.rating}
                        initialComment={feedback.content}
                        submitText="Update Feedback"
                        showForm={true}
                        onCancel={() => cancelEditFeedback(variantId)}
                        isSubmitting={loadingStates.editing[variantId]}
                    />
                )}
            </div>
        );
    };

    // Cancel order
    const handleCancelOrder = async () => {
        setConfirmAction(() => async () => {
            try {
                const token = localStorage.getItem("token");
                await Api.order.cancel(orderId, token);
                showToast("Order cancelled successfully!", "success");
                fetchOrderDetails();
                setShowConfirmModal(false);
            } catch {
                showToast("Failed to cancel order", "error");
            }
        });
        setConfirmMessage("Are you sure you want to cancel this order? This action cannot be undone.");
        setShowConfirmModal(true);
    };


    // Execute confirmed action
    const executeConfirmAction = async () => {
        if (confirmAction) {
            await confirmAction();
        }
    };

    // 📝 Send feedback
    const handleFeedback = async (variantId, comment, rating) => {
        setLoadingStates(prev => ({
            ...prev,
            submitting: { ...prev.submitting, [variantId]: true }
        }));

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            setLoadingStates(prev => ({
                ...prev,
                submitting: { ...prev.submitting, [variantId]: false }
            }));
        }, 10000); // 10 second timeout

        try {
            const token = localStorage.getItem("token");

            // Validate parameters before making API call
            if (!orderId) {
                throw new Error("Order ID is missing");
            }
            if (!variantId) {
                throw new Error("Variant ID is missing");
            }
            if (!token) {
                throw new Error("Authentication token is missing");
            }
            // Backend now requires rating to be mandatory
            if (!rating) {
                throw new Error("Rating is required");
            }
            if (rating < 1 || rating > 5) {
                throw new Error("Rating must be between 1 and 5");
            }
            if (comment && comment.length > 500) {
                throw new Error("Comment cannot exceed 500 characters");
            }

            const feedbackData = {
                rating: parseInt(rating),
                content: comment ? comment.trim() : null
            };

            // For items without variant, use the orderDetail index
            const actualVariantId = variantId.startsWith('item_') ? null : variantId;

            await Api.feedback.addFeedback(
                orderId,
                actualVariantId,
                feedbackData,
                token
            );

            // Show success message after API call succeeds
            showToast("Feedback created successfully!", "success");

            // Refresh order data to get updated feedback
            await fetchOrderDetails();
        } catch (err) {
            // Show more specific error message
            let errorMessage = "Failed to create feedback";

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 500) {
                errorMessage = "Server error - please try again later";
            } else if (err.response?.status === 400) {
                errorMessage = "Invalid request - please check your input";
            } else if (err.response?.status === 404) {
                errorMessage = "Order or product not found";
            } else if (err.message) {
                errorMessage = err.message;
            }

            showToast(errorMessage, "error");
        } finally {
            clearTimeout(timeoutId);
            setLoadingStates(prev => ({
                ...prev,
                submitting: { ...prev.submitting, [variantId]: false }
            }));
        }
    };

    // Edit feedback
    const handleEditFeedback = async (variantId, comment, rating) => {
        setLoadingStates(prev => ({
            ...prev,
            editing: { ...prev.editing, [variantId]: true }
        }));

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            setLoadingStates(prev => ({
                ...prev,
                editing: { ...prev.editing, [variantId]: false }
            }));
        }, 10000); // 10 second timeout

        try {
            const token = localStorage.getItem("token");

            // Validate parameters before making API call
            if (!orderId) {
                throw new Error("Order ID is missing");
            }
            if (!variantId) {
                throw new Error("Variant ID is missing");
            }
            if (!token) {
                throw new Error("Authentication token is missing");
            }
            // Backend now requires rating to be mandatory
            if (!rating) {
                throw new Error("Rating is required");
            }
            if (rating < 1 || rating > 5) {
                throw new Error("Rating must be between 1 and 5");
            }
            if (comment && comment.length > 500) {
                throw new Error("Comment cannot exceed 500 characters");
            }

            const feedbackData = {
                rating: parseInt(rating),
                content: comment ? comment.trim() : null
            };

            // For items without variant, use the orderDetail index
            const actualVariantId = variantId.startsWith('item_') ? null : variantId;

            await Api.feedback.editFeedback(
                orderId,
                actualVariantId,
                feedbackData,
                token
            );

            // Show success notification after API call succeeds
            showToast("Feedback updated successfully!", "success");

            // Refresh order data to get updated feedback
            await fetchOrderDetails();

            // Exit edit mode
            setEditingFeedback(prev => ({
                ...prev,
                [variantId]: false
            }));
        } catch (err) {
            // Show more specific error message
            let errorMessage = "Failed to update feedback";

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 500) {
                errorMessage = "Server error - please try again later";
            } else if (err.response?.status === 400) {
                errorMessage = "Invalid request - please check your input";
            } else if (err.response?.status === 404) {
                errorMessage = "Order or product not found";
            } else if (err.message) {
                errorMessage = err.message;
            }

            showToast(errorMessage, "error");
        } finally {
            clearTimeout(timeoutId);
            setLoadingStates(prev => ({
                ...prev,
                editing: { ...prev.editing, [variantId]: false }
            }));
        }
    };

    // 🎯 Toggle edit mode for feedback
    const toggleEditFeedback = (variantId) => {
        setEditingFeedback(prev => ({
            ...prev,
            [variantId]: !prev[variantId]
        }));
    };

    // 🚫 Cancel edit mode
    const cancelEditFeedback = (variantId) => {
        setEditingFeedback(prev => ({
            ...prev,
            [variantId]: false
        }));
    };

    // 🗑️ Delete feedback
    const handleDeleteFeedback = async (variantId) => {
        setConfirmAction(() => async () => {
            setLoadingStates(prev => ({
                ...prev,
                deleting: { ...prev.deleting, [variantId]: true }
            }));
            try {
                const token = localStorage.getItem("token");

                // Validate parameters before making API call
                if (!orderId) {
                    throw new Error("Order ID is missing");
                }
                if (!variantId) {
                    throw new Error("Variant ID is missing");
                }
                if (!token) {
                    throw new Error("Authentication token is missing");
                }

                // For items without variant, use the orderDetail index
                const actualVariantId = variantId.startsWith('item_') ? null : variantId;

                await Api.feedback.deleteFeedback(orderId, actualVariantId, token);

                // Show success message after API call succeeds
                showToast("Feedback deleted successfully!", "success");

                setShowConfirmModal(false);

                // Close OrderDetails modal after successful deletion
                onClose();
            } catch (err) {
                // Show more specific error message
                const errorMessage = err.response?.data?.message || err.message || "Failed to delete feedback";
                showToast(errorMessage, "error");
            } finally {
                setLoadingStates(prev => ({
                    ...prev,
                    deleting: { ...prev.deleting, [variantId]: false }
                }));
            }
        });
        setConfirmMessage("Are you sure you want to delete this feedback? This action cannot be undone.");
        setShowConfirmModal(true);
    };

    const getStatusBadge = (status, type = "order") => {
        const base =
            "px-3 py-1 rounded-full text-xs font-semibold border inline-block";

        // Debug logging

        if (type === "order") {
            // Clean the status string
            const cleanStatus = status?.toString().trim().toLowerCase();
            const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

            switch (cleanStatus) {
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
                            {capitalizeFirst(status || 'Unknown')}
                        </span>
                    );
            }
        } else if (type === "pay") {
            const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

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
                            {capitalizeFirst(status || 'Unknown')}
                        </span>
                    );
            }
        } else if (type === "refund") {
            const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

            switch (status?.toLowerCase()) {
                case "pending_refund":
                    return (
                        <span className={`${base} bg-yellow-100 text-yellow-700 border-yellow-300`}>
                            Pending Refund
                        </span>
                    );
                case "refunded":
                    return (
                        <span className={`${base} bg-green-100 text-green-700 border-green-300`}>
                            Refunded
                        </span>
                    );
                case "not_applicable":
                    return (
                        <span className={`${base} bg-gray-100 text-gray-600 border-gray-300`}>
                            Not Applicable
                        </span>
                    );
                default:
                    return (
                        <span className={`${base} bg-gray-100 text-gray-600 border-gray-300`}>
                            {capitalizeFirst(status || '')}
                        </span>
                    );
            }
        }
    };

    const [cancelFormData, setCancelFormData] = useState({
    cancelReason: "",
    customReason: ""
});
const [error, setError] = useState("");

const handleSubmitCancel = async () => {
    if (!cancelFormData.cancelReason) {
        setError("Please select a cancellation reason");
        return;
    }
    if (cancelFormData.cancelReason === "other" && !cancelFormData.customReason.trim()) {
        setError("Please provide a custom reason");
        return;
    }
    if (cancelFormData.cancelReason === "other" && cancelFormData.customReason.length > 500) {
        setError("Custom reason cannot exceed 500 characters");
        return;
    }
    try {
        const token = localStorage.getItem("token");
        const reason = cancelFormData.cancelReason === "other" 
            ? cancelFormData.customReason 
            : cancelFormData.cancelReason;
        console.log("Sending cancel request with reason:", reason); // Debug log
        await Api.order.cancel(orderId, reason, token);
        showToast("Order cancelled successfully!", "success");
        fetchOrderDetails();
        setShowConfirmModal(false);
    } catch (err) {
        console.error("Cancel error:", err.response?.data); // Log error details
        setError(err.message || "Failed to cancel order");
    }
};

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-3xl max-h-[85vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 rounded"
                >
                    ×
                </button>

                {loading ? (
                    <LoadingForm text="Loading order details..." height="h-64" size="lg" />
                ) : !order ? (
                    <div className="text-center py-12">
                        <div className="text-red-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <p className="text-red-500 text-lg font-medium">Order not found</p>
                        <p className="text-gray-400 text-sm mt-2">The order you're looking for doesn't exist or has been removed</p>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl sm:text-2xl font-normal text-gray-900">
                                Order #{order._id}
                            </h2>
                            {/* View Bill button in header - only show if order is paid */}
                            {order.pay_status?.toLowerCase() === 'paid' && (
                                <ProductButton
                                    variant="primary"
                                    size="md"
                                    onClick={() => {
                                        onClose(); // Close the modal first
                                        navigate(`/bills/${orderId}`); // Then navigate to bill
                                    }}
                                    title="View Bill"
                                    className="flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View Bill
                                </ProductButton>
                            )}
                        </div>

                        {/* Order Status */}
                        <div>
                                    <div className="flex items-center justify-between mb-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-gray-600 font-medium">Order Status:</span>
                                            {getStatusBadge(order.order_status, "order")}
                                            <span className="text-gray-600 font-medium ml-2">Payment:</span>
                                            {getStatusBadge(order.pay_status, "pay")}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            Order Date: {new Date(order.orderDate || order.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    {order.order_status?.toLowerCase() === "cancelled" && order.cancelReason && (
                                        <div className="flex items-center justify-between mb-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex items-center space-x-4">
                                                <span className="text-gray-600 font-medium">Cancel Reason:</span>
                                                <span className="text-gray-600">{order.cancelReason}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                        {/* Customer & Payment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl mb-6 border border-gray-200">
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Customer Information</h4>
                                <div className="space-y-1">
                                    <p className="text-gray-700">
                                        <span className="font-medium">Name:</span> {order.customer?.name || order.customer?.username}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Phone:</span> {order.phone}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Address:</span> {order.addressReceive}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl mb-6 border border-gray-200">
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Payment Information</h4>
                                <div className="space-y-1">
                                    <p className="text-gray-700">
                                        <span className="font-medium">Method:</span> {order.payment_method}
                                    </p>
                                    {order.voucher && (
                                        <p className="text-sm text-blue-600">
                                            <span className="font-medium">Voucher Applied:</span> {order.voucher.code}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="bg-gray-50 p-4 sm:p-5 rounded-xl mb-6 border border-gray-200">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Order Summary</h4>
                            <div className="space-y-2">
                                {order.summary && (
                                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                                        <span className="font-medium">Items:</span>
                                        <span>{order.summary.totalItems} item(s) • {order.summary.totalQuantity} quantity</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">Subtotal (before discount):</span>
                                    <span className="font-semibold text-gray-900">{formatPrice(order.totalPrice)}</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-green-600">
                                        <span className="font-medium">Discount Applied:</span>
                                        <span className="font-semibold">-{formatPrice(order.discountAmount)}</span>
                                    </div>
                                )}
                                <hr className="border-gray-300 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Total Amount to Pay:</span>
                                    <span className="text-xl font-bold text-red-600">{formatPrice(order.finalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Products */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                            {order.orderDetails && order.orderDetails.length > 0 ? (
                                order.orderDetails.map((d, index) => {
                                    // Create a unique key for feedback handling
                                    const feedbackKey = d.variant?._id || `item_${index}`;

                                    return (
                                        <div key={d._id} className="flex items-center space-x-3 p-3 sm:p-4 border-2 border-gray-300 rounded-xl">
                                            <img
                                                src={d.variant?.image || "/placeholder.png"}
                                                alt={d.variant?.product?.name || "Product"}
                                                className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setSelectedImage({
                                                    src: d.variant?.image || "/placeholder.png",
                                                    alt: d.variant?.product?.name || "Product"
                                                })}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {d.variant?.product?.name || "Product (Variant not available)"}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    <span className="font-medium">Color:</span> {d.variant?.color?.name || 'N/A'} |
                                                    <span className="font-medium"> Size:</span> {d.variant?.size?.name || 'N/A'} |
                                                    <span className="font-medium"> Quantity:</span> {d.quantity}
                                                </p>
                                                {order.order_status?.toLowerCase() === "delivered" && (
                                                    <div className="mt-2">
                                                        {existingFeedbacks[feedbackKey] ? (
                                                            renderExistingFeedback(existingFeedbacks[feedbackKey], feedbackKey)
                                                        ) : (
                                                            <FeedbackForm
                                                                variantId={feedbackKey}
                                                                onSubmit={handleFeedback}
                                                                isSubmitting={loadingStates.submitting[feedbackKey]}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">
                                                    <span className="font-medium">Unit Price:</span> {formatPrice(d.unitPrice)}
                                                </p>
                                                <p className="font-semibold text-red-600">
                                                    <span className="font-medium">Total:</span> {formatPrice(d.totalPrice)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No product details available</p>
                                    <p className="text-sm mt-2">Order total: {formatPrice(order.finalPrice)}</p>
                                </div>
                            )}
                        </div>

                        {/* Refund Status */}
                        {order.refund_status && order.refund_status !== "not_applicable" && (
                            <div className="mt-4 p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200">
                                <h4 className="font-semibold text-gray-700 mb-2">Refund Information</h4>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-600 font-medium">Status:</span>
                                    {getStatusBadge(order.refund_status, "refund")}
                                </div>
                                {order.refund_proof && (
                                    <div className="mt-3">
                                        <p className="font-semibold text-gray-700 mb-2">Refund Proof:</p>
                                        <img
                                            src={order.refund_proof}
                                            alt="Refund Proof"
                                            className="w-32 h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setSelectedImage({
                                                src: order.refund_proof,
                                                alt: "Refund Proof"
                                            })}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Order Feedback */}
                        {order.feedback_order && (
                            <div className="mt-4 p-4 sm:p-5 bg-blue-50 rounded-xl border border-blue-200">
                                <h4 className="font-semibold text-blue-700 mb-2">Order Feedback</h4>
                                <p className="text-gray-700">{order.feedback_order}</p>
                            </div>
                        )}

                        {(order.order_status?.toLowerCase() === "pending" ||
                            order.order_status?.toLowerCase() === "confirmed") && (
                                <ProductButton
                                    variant="danger"
                                    size="md"
                                    onClick={handleCancelOrder}
                                    className="mt-6"
                                >
                                    Cancel Order
                                </ProductButton>
                            )}
                    </div>
                )}
            </div>

            {/* Image Modal */}
            <ImageModal
                selectedImage={selectedImage}
                onClose={() => setSelectedImage(null)}
            />

            {/* Confirmation Modal */}
{showConfirmModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md p-4 sm:p-5 md:p-6"
            onClick={(e) => e.stopPropagation()} // Prevent clicks from closing the modal
        >
            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Cancel Order #{orderId}</h3>
                    <button
                        onClick={() => setShowConfirmModal(false)}
                        className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-md focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
                        aria-label="Close cancel modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="space-y-4">
                    <p className="text-sm font-medium text-gray-600">Select a reason for cancelling order:</p>
                    {['address', 'voucher', 'product', 'demand'].map((reason) => (
                        <div key={reason} className="flex items-center">
                            <input
                                type="radio"
                                id={reason}
                                name="cancelReason"
                                value={reason}
                                checked={cancelFormData.cancelReason === reason}
                                onChange={(e) => setCancelFormData({ ...cancelFormData, cancelReason: e.target.value })}
                                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                            />
                            <label htmlFor={reason} className="ml-2 text-sm text-gray-900">
                                {reason.charAt(0).toUpperCase() + reason.slice(1)}
                            </label>
                        </div>
                    ))}
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="other"
                            name="cancelReason"
                            value="other"
                            checked={cancelFormData.cancelReason === "other"}
                            onChange={(e) => setCancelFormData({ ...cancelFormData, cancelReason: e.target.value, customReason: "" })}
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                        />
                        <label htmlFor="other" className="ml-2 text-sm text-gray-900">Other</label>
                    </div>
                    {cancelFormData.cancelReason === "other" && (
                        <textarea
                            value={cancelFormData.customReason}
                            onChange={(e) => setCancelFormData({ ...cancelFormData, customReason: e.target.value })}
                            placeholder="Enter custom reason"
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
                            rows={3}
                        />
                    )}
                    {error && (
                        <div className="p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 justify-end mt-6">
                    <ProductButton
                        variant="secondary"
                        size="md"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        Cancel
                    </ProductButton>
                    <ProductButton
                        variant="danger"
                        size="md"
                        onClick={handleSubmitCancel}
                        disabled={!cancelFormData.cancelReason || (cancelFormData.cancelReason === "other" && !cancelFormData.customReason.trim())}
                        className="flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Confirm Cancel</span>
                    </ProductButton>
                </div>
            </div>
        </div>
    </div>
)}
        </div>
    );
};

export default OrderDetailsModal;
