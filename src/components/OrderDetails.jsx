import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import { useToast } from "../components/Toast";
import FeedbackForm from "./FeedbackForm";
import LoadingSpinner, { LoadingForm, LoadingButton } from "./LoadingSpinner";
import ImageModal from "./ImageModal";

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

            // The new API returns the complete order data in response.data.data
            const orderData = response.data.data || response.data;

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
        order.orderDetails.forEach(detail => {
            if (detail.variant?._id && detail.feedback) {
                // Only include feedback if it has content or rating and is not deleted
                if ((detail.feedback.content || detail.feedback.rating) && !detail.feedback.is_deleted) {
                    feedbackMap[detail.variant._id] = detail.feedback;
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
            <div className="mt-3 p-3 bg-grey border border-black rounded-lg">
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
                    {feedback.rating && (
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
                {feedback.content && (
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
                showToast("Order canceled successfully", "success");
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
            if (comment && comment.trim() === '') {
                throw new Error("Comment cannot be empty");
            }
            if (comment && comment.length > 500) {
                throw new Error("Comment cannot exceed 500 characters");
            }

            const feedbackData = {
                rating: parseInt(rating)
            };
            if (comment && comment.trim()) {
                feedbackData.content = comment.trim();
            }

            await Api.feedback.addFeedback(
                orderId,
                variantId,
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
            if (comment && comment.trim() === '') {
                throw new Error("Comment cannot be empty");
            }
            if (comment && comment.length > 500) {
                throw new Error("Comment cannot exceed 500 characters");
            }

            const feedbackData = {
                rating: parseInt(rating)
            };
            if (comment && comment.trim()) {
                feedbackData.content = comment.trim();
            }

            await Api.feedback.editFeedback(
                orderId,
                variantId,
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


                await Api.feedback.deleteFeedback(orderId, variantId, token);

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

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto relative animate-fadeIn border-t-4 border-yellow-400"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-yellow-600 text-2xl font-bold"
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
                            <h2 className="text-2xl font-bold text-yellow-600">
                                Order #{order._id}
                            </h2>
                            {/* View Bill button in header - only show if order is paid */}
                            {(order.pay_status?.toLowerCase() === 'paid' || order.paymentStatus?.toLowerCase() === 'paid') && (
                                <button
                                    onClick={() => {
                                        onClose(); // Close the modal first
                                        navigate(`/bills/${orderId}`); // Then navigate to bill
                                    }}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition flex items-center gap-2"
                                    title="View Bill"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View Bill
                                </button>
                            )}
                        </div>

                        {/* Order Status */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
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

                        {/* Customer & Payment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                                <h4 className="font-semibold text-blue-800 mb-2">Customer Information</h4>
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
                            <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                                <h4 className="font-semibold text-green-800 mb-2">Payment Information</h4>
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
                        <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                            <h4 className="font-semibold text-yellow-800 mb-3">Order Summary</h4>
                            <div className="space-y-2">
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
                                    <span className="text-xl font-bold text-yellow-600">{formatPrice(order.finalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Products */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                            {order.orderDetails && order.orderDetails.length > 0 ? (
                                order.orderDetails.map((d) => (
                                    <div key={d._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                        <img
                                            src={d.variant?.product?.image || "/placeholder.png"}
                                            alt={d.variant?.product?.name}
                                            className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setSelectedImage({
                                                src: d.variant?.product?.image || "/placeholder.png",
                                                alt: d.variant?.product?.name
                                            })}
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{d.variant?.product?.name}</p>
                                            <p className="text-sm text-gray-500">
                                                <span className="font-medium">Color:</span> {d.variant?.color?.name || 'N/A'} |
                                                <span className="font-medium"> Size:</span> {d.variant?.size?.name || 'N/A'} |
                                                <span className="font-medium"> Quantity:</span> {d.quantity}
                                            </p>
                                            {order.order_status?.toLowerCase() === "delivered" && (
                                                <div className="mt-2">
                                                    {existingFeedbacks[d.variant?._id] ? (
                                                        renderExistingFeedback(existingFeedbacks[d.variant._id], d.variant._id)
                                                    ) : (
                                                        <FeedbackForm
                                                            variantId={d.variant?._id}
                                                            onSubmit={handleFeedback}
                                                            isSubmitting={loadingStates.submitting[d.variant?._id]}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">
                                                <span className="font-medium">Unit Price:</span> {formatPrice(d.unitPrice)}
                                            </p>
                                            <p className="font-semibold text-yellow-600">
                                                <span className="font-medium">Total:</span> {formatPrice(d.totalPrice)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No product details available</p>
                                    <p className="text-sm mt-2">Order total: {formatPrice(order.finalPrice)}</p>
                                </div>
                            )}
                        </div>

                        {/* Refund Status */}
                        {order.refund_status && order.refund_status !== "not_applicable" && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
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
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-blue-700 mb-2">Order Feedback</h4>
                                <p className="text-gray-700">{order.feedback_order}</p>
                            </div>
                        )}

                        {(order.order_status?.toLowerCase() === "pending" ||
                            order.order_status?.toLowerCase() === "confirmed") && (
                                <LoadingButton
                                    className="mt-6 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg transition font-medium"
                                    onClick={handleCancelOrder}
                                >
                                    Cancel Order
                                </LoadingButton>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Confirmation Required</h3>
                            <p className="text-sm text-gray-500 mb-6">{confirmMessage}</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeConfirmAction}
                                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailsModal;
