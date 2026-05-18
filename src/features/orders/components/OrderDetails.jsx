import React, { useEffect, useState, useCallback, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderDetails } from "../hooks/useOrderDetails";
import { useToast } from "../../../hooks/useToast";
import FeedbackForm from "../../feedback/components/FeedbackForm";
import LoadingSpinner, { LoadingForm, LoadingButton } from "../../../components/ui/LoadingSpinner";
import ImageModal from "../../../components/ui/ImageModal";
import ProductButton from "../../../components/ui/ProductButton";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import OrderStatusCard from "./OrderStatusCard";
import VNPayCountdown from "./VNPayCountdown";
import OrderCustomerInfo from "./OrderCustomerInfo";
import OrderSummary from "./OrderSummary";
import OrderItemsList from "./OrderItemsList";
import { getStatusBadge } from "../utils/orderUtils";
const OrderDetailsModal = ({ orderId, onClose }) => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const {
        order,
        loading,
        existingFeedbacks,
        loadingStates,
        timeLeft,
        isVNPayExpired,
        cancelOrder,
        submitFeedback,
        editFeedback,
        deleteFeedback
    } = useOrderDetails(orderId);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showViewFeedbackModal, setShowViewFeedbackModal] = useState(false);
    const [showEditFeedbackModal, setShowEditFeedbackModal] = useState(false);
    const [showDeleteFeedbackConfirm, setShowDeleteFeedbackConfirm] = useState(false);
    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [selectedProductName, setSelectedProductName] = useState('');

    const formatPrice = (p) =>
        p?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    const handleCancelOrder = async () => {
        setShowConfirmModal(true);
    };

    const handleFeedback = async (variantId, comment, rating) => {
        const result = await submitFeedback(variantId, comment, rating);
        if (result.success) setShowEditFeedbackModal(false);
    };

    const handleEditFeedback = async (variantId, comment, rating) => {
        const result = await editFeedback(variantId, comment, rating);
        if (result.success) setShowEditFeedbackModal(false);
    };

    const handleViewFeedback = (variantId, productName) => {
        setSelectedVariantId(variantId);
        setSelectedProductName(productName);
        setShowViewFeedbackModal(true);
    };

    const handleEditFeedbackClick = (variantId, productName) => {
        setSelectedVariantId(variantId);
        setSelectedProductName(productName);
        setShowEditFeedbackModal(true);
    };

    const handleDeleteFeedback = useCallback(async () => {
        setShowDeleteFeedbackConfirm(false);
        const result = await deleteFeedback(selectedVariantId);
        if (result.success) setShowEditFeedbackModal(false);
    }, [deleteFeedback, selectedVariantId]);


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
        
        const reason = cancelFormData.cancelReason === "other"
            ? cancelFormData.customReason
            : cancelFormData.cancelReason;
            
        const result = await cancelOrder(reason);
        if (result.success) {
            setShowConfirmModal(false);
        } else {
            setError(result.error);
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
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors focus:outline-none rounded"
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
                            {order.payStatus?.toLowerCase() === 'paid' && (
                                <ProductButton
                                    variant="default"
                                    size="md"
                                    onClick={() => {
                                        onClose(); // Close the modal first
                                        navigate(`/bills/${orderId}`); // Then navigate to bill
                                    }}
                                    title="View Bill"
                                    className="text-green-600 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View Bill
                                </ProductButton>
                            )}
                        </div>

                        {/* Order Status Card */}
                        <OrderStatusCard order={order} />

                        {/* VNPay Payment Countdown */}
                        <VNPayCountdown order={order} timeLeft={timeLeft} isVNPayExpired={isVNPayExpired} />

                        {/* Customer & Payment Info */}
                        <OrderCustomerInfo order={order} />

                        {/* Price Summary */}
                        <OrderSummary order={order} formatPrice={formatPrice} />

                        {/* Products */}
                        <OrderItemsList 
                            order={order} 
                            formatPrice={formatPrice} 
                            setSelectedImage={setSelectedImage} 
                            existingFeedbacks={existingFeedbacks} 
                            handleViewFeedback={handleViewFeedback} 
                            handleEditFeedbackClick={handleEditFeedbackClick} 
                        />

                        {/* Refund Card */}
                        {order.refundStatus && order.refundStatus !== "not_applicable" && (
                            <div className="mt-6 bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 transition-shadow hover:shadow-sm">
                                <h4 className="font-semibold text-gray-700 mb-3">Refund Information</h4>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-gray-600 font-medium">Status:</span>
                                    {getStatusBadge(order.refundStatus, "refund")}
                                </div>
                                {order.refundProof && (
                                    <img
                                        src={order.refundProof}
                                        alt="Refund Proof"
                                        className="w-32 h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                                        onClick={() => setSelectedImage({ src: order.refundProof, alt: "Refund Proof" })}
                                    />
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

                        {(order.orderStatus?.toLowerCase() === "pending" ||
                            order.orderStatus?.toLowerCase() === "confirmed") && (
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

            {/* View Feedback Modal */}
            {showViewFeedbackModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
                    onClick={() => setShowViewFeedbackModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowViewFeedbackModal(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                        <h3 className="text-xl font-semibold mb-4">Feedback for {selectedProductName}</h3>
                        {existingFeedbacks[selectedVariantId] ? (
                            <div className="space-y-3">
                                {existingFeedbacks[selectedVariantId].has_rating && existingFeedbacks[selectedVariantId].rating > 0 && (
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-5 h-5 ${i < existingFeedbacks[selectedVariantId].rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                )}
                                {existingFeedbacks[selectedVariantId].has_content && existingFeedbacks[selectedVariantId].content?.trim() && (
                                    <p className="text-gray-700">{existingFeedbacks[selectedVariantId].content}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-600">No feedback provided yet.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Feedback Modal */}
            {showEditFeedbackModal && (
                <FeedbackForm
                    variantId={selectedVariantId}
                    onSubmit={existingFeedbacks[selectedVariantId] ? handleEditFeedback : handleFeedback}
                    initialRating={existingFeedbacks[selectedVariantId]?.rating || ''}
                    initialComment={existingFeedbacks[selectedVariantId]?.content || ''}
                    submitText={existingFeedbacks[selectedVariantId] ? 'Update Feedback' : 'Submit Feedback'}
                    showForm={true}
                    onCancel={() => setShowEditFeedbackModal(false)}
                    onDelete={handleDeleteFeedback}
                    isDeleting={loadingStates.deleting?.[selectedVariantId] || false}
                    showDeleteButton={!!existingFeedbacks[selectedVariantId]}
                    productName={selectedProductName}
                    existingFeedback={existingFeedbacks[selectedVariantId]}
                />
            )}

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
                                    className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-md focus:outline-none"
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
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none"
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