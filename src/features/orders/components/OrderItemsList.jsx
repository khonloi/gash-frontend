import React from 'react';
import Button from '../../../components/ui/Button';

const OrderItemsList = ({ 
    order, 
    formatPrice, 
    setSelectedImage, 
    existingFeedbacks, 
    handleViewFeedback, 
    handleEditFeedbackClick 
}) => {
    return (
        <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
            {order.orderDetails && order.orderDetails.length > 0 ? (
                order.orderDetails.map((d, index) => {
                    const feedbackKey = d.variant?._id || `item_${index}`;
                    const stockQuantity = d.variant?.stockQuantity ?? 0;
                    const isOutOfStock = stockQuantity <= 0;
                    const isDiscontinued =
                        d.variant?.variantStatus === "discontinued" ||
                        d.variant?.product?.productStatus === "discontinued";
                        
                    return (
                        <article
                            key={d._id}
                            className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 mb-4 last:mb-0 flex flex-col sm:flex-row gap-4 transition-shadow hover:shadow-sm border border-gray-200 focus-within:shadow-sm"
                            tabIndex={0}
                            aria-label={`Order Item: ${d.variant?.product?.name || "Product"}`}
                        >
                            <div className="flex items-stretch gap-6 flex-1">
                                {/* Image */}
                                <img
                                    src={d.variant?.image || "/placeholder.png"}
                                    alt={d.variant?.product?.name || "Product"}
                                    className="w-20 sm:w-24 aspect-square object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() =>
                                        setSelectedImage({
                                            src: d.variant?.image || "/placeholder.png",
                                            alt: d.variant?.product?.name || "Product",
                                        })
                                    }
                                />
                                {/* Product Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-base sm:text-lg font-semibold text-gray-900 m-0 line-clamp-2">
                                            {d.variant?.product?.name || "Product"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm text-gray-600 m-0">
                                            Color: {d.variant?.color?.name || "N/A"}  -  Size: {d.variant?.size?.name || "N/A"}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-600 m-0">Unit Price: {formatPrice(d.unitPrice)}</p>
                                    <p className="text-base font-semibold text-red-600 m-0 mt-1">Total: {formatPrice(d.totalPrice)}</p>
                                </div>
                            </div>
                            {/* Quantity and Feedback Buttons */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-center gap-3 sm:gap-4">
                                <div className="flex items-center justify-center">
                                    <div className="px-4 py-2 bg-gray-100 rounded-lg text-center min-w-20">
                                        <span className="text-sm text-gray-600">Quantity</span>
                                        <p className="text-lg font-semibold text-gray-900">{d.quantity}</p>
                                    </div>
                                </div>
                                {/* Feedback Buttons – Only if Delivered */}
                                {order.orderStatus?.toLowerCase() === "delivered" && (
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleViewFeedback(feedbackKey, d.variant?.product?.name || "Product")}
                                            className="flex items-center gap-2 text-green-600"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                            View Feedback
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleEditFeedbackClick(feedbackKey, d.variant?.product?.name || "Product")}
                                            className="flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                            {existingFeedbacks[feedbackKey] ? "Edit Feedback" : "Add Feedback"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p>No items in this order</p>
                </div>
            )}
        </div>
    );
};

export default OrderItemsList;

