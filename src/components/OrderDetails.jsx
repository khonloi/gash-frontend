import React, { useEffect, useState, useCallback } from "react";
import Api from "../common/SummaryAPI";
import { useToast } from "../components/Toast";
import FeedbackForm from "./FeedbackForm";
import LoadingSpinner, { LoadingForm, LoadingButton } from "./LoadingSpinner";

const OrderDetailsModal = ({ orderId, onClose }) => {
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [existingFeedbacks, setExistingFeedbacks] = useState({});
    const [editingFeedback, setEditingFeedback] = useState({});
    const [loadingStates, setLoadingStates] = useState({
        feedbacks: false,
        submitting: {},
        editing: {},
        deleting: {}
    });

    // 🧭 Fetch order + details
    const fetchOrderDetails = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const [orderRes, detailsRes] = await Promise.all([
                Api.order.getOrder(orderId, token),
                Api.order.getOrderDetails(orderId, token),
            ]);
            setOrder(orderRes.data);
            setDetails(detailsRes.data || []);
        } catch (err) {
            showToast(err.message || "Failed to load order details", "error");
        } finally {
            setLoading(false);
        }
    }, [orderId, showToast]);

    // Fetch existing feedback for a product variant
    const fetchExistingFeedback = useCallback(async (variantId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await Api.feedback.getUserFeedback(orderId, variantId, token);
            // Extract feedback from the nested response structure
            return response.data.feedback || response.data.orderDetail?.feedback;
        } catch {
            // If no feedback exists, API might return 404, which is fine
            return null;
        }
    }, [orderId]);

    // 🔍 Fetch all existing feedbacks for order products
    const fetchAllExistingFeedbacks = useCallback(async () => {
        if (!details.length) return;

        setLoadingStates(prev => ({ ...prev, feedbacks: true }));
        try {
            const feedbackPromises = details.map(async (detail) => {
                if (detail.variant_id?._id) {
                    const feedback = await fetchExistingFeedback(detail.variant_id._id);
                    return { variantId: detail.variant_id._id, feedback };
                }
                return null;
            });

            const feedbackResults = await Promise.all(feedbackPromises);
            const feedbackMap = {};

            feedbackResults.forEach(result => {
                if (result && result.feedback) {
                    feedbackMap[result.variantId] = result.feedback;
                }
            });

            setExistingFeedbacks(feedbackMap);
        } finally {
            setLoadingStates(prev => ({ ...prev, feedbacks: false }));
        }
    }, [details, fetchExistingFeedback]);

    useEffect(() => {
        if (orderId) fetchOrderDetails();
    }, [orderId, fetchOrderDetails]);

    useEffect(() => {
        if (details.length > 0) {
            fetchAllExistingFeedbacks();
        }
    }, [details, fetchAllExistingFeedbacks]);

    const formatPrice = (p) =>
        p?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    // Render existing feedback
    const renderExistingFeedback = (feedback, variantId) => {
        if (!feedback) return null;

        const isEditing = editingFeedback[variantId];

        return (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                {/* ===== Your Feedback Section ===== */}
                <div className="space-y-3">
                    {/* --- Your Feedback --- */}
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-green-700">Your Feedback</h4>
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
        console.log('handleFeedback called:', { variantId, comment, rating });
        setLoadingStates(prev => ({
            ...prev,
            submitting: { ...prev.submitting, [variantId]: true }
        }));

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.log('Feedback timeout, resetting loading state');
            setLoadingStates(prev => ({
                ...prev,
                submitting: { ...prev.submitting, [variantId]: false }
            }));
        }, 10000); // 10 second timeout

        try {
            const token = localStorage.getItem("token");
            const response = await Api.feedback.addFeedback(
                orderId,
                variantId,
                {
                    content: comment,
                    rating: parseInt(rating),
                },
                token
            );
            showToast("Feedback created successfully!", "success");

            // Extract feedback from response and update state immediately
            const newFeedback = response.data.feedback || response.data.orderDetail?.feedback;
            if (newFeedback) {
                setExistingFeedbacks(prev => ({
                    ...prev,
                    [variantId]: newFeedback
                }));
            }
        } catch (err) {
            console.error("Feedback error:", err);
            showToast("Failed to create feedback", "error");
        } finally {
            clearTimeout(timeoutId);
            console.log('handleFeedback completed, resetting loading state');
            setLoadingStates(prev => ({
                ...prev,
                submitting: { ...prev.submitting, [variantId]: false }
            }));
        }
    };

    // Edit feedback
    const handleEditFeedback = async (variantId, comment, rating) => {
        console.log('handleEditFeedback called:', { variantId, comment, rating });
        setLoadingStates(prev => ({
            ...prev,
            editing: { ...prev.editing, [variantId]: true }
        }));

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.log('Edit feedback timeout, resetting loading state');
            setLoadingStates(prev => ({
                ...prev,
                editing: { ...prev.editing, [variantId]: false }
            }));
        }, 10000); // 10 second timeout

        try {
            const token = localStorage.getItem("token");
            const response = await Api.feedback.editFeedback(
                orderId,
                variantId,
                {
                    content: comment,
                    rating: parseInt(rating),
                },
                token
            );

            // Show success notification in top-right corner
            showToast("Feedback updated successfully!", "success");

            // Extract feedback from response and update state immediately
            const updatedFeedback = response.data.feedback || response.data.orderDetail?.feedback;
            if (updatedFeedback) {
                setExistingFeedbacks(prev => ({
                    ...prev,
                    [variantId]: updatedFeedback
                }));
                // Exit edit mode
                setEditingFeedback(prev => ({
                    ...prev,
                    [variantId]: false
                }));
            }
        } catch (err) {
            console.error("Edit feedback error:", err);
            showToast("Failed to update feedback", "error");
        } finally {
            clearTimeout(timeoutId);
            console.log('handleEditFeedback completed, resetting loading state');
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
                await Api.feedback.deleteFeedback(orderId, variantId, token);
                showToast("Feedback deleted successfully!", "success");

                // Remove feedback from state
                setExistingFeedbacks(prev => {
                    const newFeedbacks = { ...prev };
                    delete newFeedbacks[variantId];
                    return newFeedbacks;
                });

                // Refresh order details to get updated data
                await fetchOrderDetails();

                // Refresh existing feedbacks for all products
                await fetchAllExistingFeedbacks();

                setShowConfirmModal(false);
            } catch (err) {
                console.error("Delete feedback error:", err);
                showToast("Failed to delete feedback", "error");
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
        console.log("getStatusBadge called with:", { status, type, lowerStatus: status?.toLowerCase() });

        if (type === "order") {
            // Clean the status string
            const cleanStatus = status?.toString().trim().toLowerCase();
            console.log("Clean status:", cleanStatus);

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
                            Unknown ({status})
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
                        <h2 className="text-2xl font-bold text-yellow-600 mb-4">
                            Order #{order._id}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 mb-6">
                            <p>
                                <strong>Order Status:</strong> {getStatusBadge(order.order_status, "order")}
                                <span className="text-xs text-gray-500 ml-2">({order.order_status})</span>
                            </p>
                            <p>
                                <strong>Payment Status:</strong> {getStatusBadge(order.pay_status, "pay")}
                            </p>
                            <p>
                                <strong>Customer:</strong> {order.acc_id?.name || order.acc_id?.username}
                            </p>
                            <p>
                                <strong>Address:</strong> {order.addressReceive}
                            </p>
                            <p>
                                <strong>Phone:</strong> {order.phone}
                            </p>
                            <p>
                                <strong>Payment Method:</strong> {order.payment_method}
                            </p>
                            <p>
                                <strong>Order Date:</strong> {new Date(order.orderDate || order.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                            <p>
                                <strong>Total Price:</strong>{" "}
                                <span className="text-yellow-700 font-semibold">
                                    {formatPrice(order.totalPrice)}
                                </span>
                            </p>
                            {order.discountAmount > 0 && (
                                <p>
                                    <strong>Discount:</strong>{" "}
                                    <span className="text-green-600 font-semibold">
                                        -{formatPrice(order.discountAmount)}
                                    </span>
                                </p>
                            )}
                            <p>
                                <strong>Final Price:</strong>{" "}
                                <span className="text-yellow-700 font-semibold text-lg">
                                    {formatPrice(order.finalPrice)}
                                </span>
                            </p>
                        </div>

                        <h3 className="text-xl font-semibold text-yellow-700 mb-3">
                            Products
                        </h3>

                        {details.length > 0 ? (
                            <div className="space-y-4">
                                {details.map((d) => (
                                    <div
                                        key={d._id}
                                        className="flex items-center justify-between border rounded-lg p-3 hover:shadow-md transition"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <img
                                                src={
                                                    d.variant_id?.pro_id?.fullImageURL ||
                                                    d.variant_id?.pro_id?.imageURL ||
                                                    "/placeholder.png"
                                                }
                                                alt={d.variant_id?.pro_id?.pro_name}
                                                className="w-20 h-20 object-cover rounded-md border"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {d.variant_id?.pro_id?.pro_name}
                                                </p>
                                                <p className="text-gray-500 text-sm">
                                                    Color: {d.variant_id?.color_id?.color_name} | Size:{" "}
                                                    {d.variant_id?.size_id?.size_name}
                                                </p>
                                                <p className="text-gray-500 text-sm">
                                                    Quantity: {d.Quantity}
                                                </p>
                                                <p className="text-yellow-700 font-semibold">
                                                    Price: {formatPrice(d.UnitPrice)}
                                                </p>
                                                {order.order_status?.toLowerCase() === "delivered" && (
                                                    <>
                                                        {loadingStates.feedbacks ? (
                                                            <LoadingForm
                                                                text="Loading feedback..."
                                                                height="h-20"
                                                                className="mt-3"
                                                                size="sm"
                                                            />
                                                        ) : existingFeedbacks[d.variant_id?._id] ? (
                                                            renderExistingFeedback(existingFeedbacks[d.variant_id._id], d.variant_id._id)
                                                        ) : (
                                                            <FeedbackForm
                                                                variantId={d.variant_id?._id}
                                                                onSubmit={handleFeedback}
                                                                isSubmitting={loadingStates.submitting[d.variant_id?._id]}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <p className="font-semibold text-yellow-600 text-right w-32">
                                            {formatPrice(d.UnitPrice * d.Quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No product details available</p>
                                <p className="text-sm mt-2">Order total: {formatPrice(order.finalPrice)}</p>
                            </div>
                        )}

                        {/* Refund Status */}
                        {order.refund_status && order.refund_status !== "not_applicable" && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold text-gray-700 mb-2">Refund Information</h4>
                                <p><strong>Status:</strong> {order.refund_status}</p>
                                {order.refund_proof && (
                                    <p><strong>Proof:</strong> {order.refund_proof}</p>
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
