import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import { useToast } from "../hooks/useToast";
import LoadingSpinner from "./LoadingSpinner";
import ProductButton from "./ProductButton";
import ConfirmationModal from "./ConfirmationModal";

const FeedbackDetailsModal = ({ feedback, orderId, onClose, onUpdate }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [editingFeedback, setEditingFeedback] = useState(null);
  const [creatingFeedback, setCreatingFeedback] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    editing: false,
    creating: false,
    deleting: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatPrice = (p) =>
    p?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // Render star rating
  const renderStars = (rating) => {
    if (!rating || rating < 1) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Check if feedback exists (include deleted feedbacks so they can be displayed)
  const hasFeedback = feedback?.feedback && (
    (feedback.feedback.content && feedback.feedback.content.trim() !== '') ||
    (feedback.feedback.rating && feedback.feedback.rating > 0) ||
    feedback.feedback.has_content === true ||
    feedback.feedback.has_rating === true
  );
  
  // Check if feedback is deleted by staff/admin
  const isDeletedByStaff = feedback?.feedback?.isDeleted === true;

  // Create feedback
  const handleCreateFeedback = useCallback(async (variantId, comment, rating) => {
    setLoadingStates(prev => ({ ...prev, creating: true }));

    const timeoutId = setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, creating: false }));
    }, 10000);

    try {
      const token = localStorage.getItem("token");

      if (!orderId) {
        throw new Error("Order ID is missing");
      }
      if (!variantId) {
        throw new Error("Variant ID is missing");
      }
      if (!token) {
        throw new Error("Authentication token is missing");
      }
      if (!rating) {
        throw new Error("Rating is required");
      }
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }
      if (comment && comment.trim()) {
        const trimmedComment = comment.trim();
        if (trimmedComment.length < 10) {
          throw new Error("Comment must be between 10 and 10.000 characters");
        }
        if (trimmedComment.length > 10000) {
          throw new Error("Comment must be between 10 and 10.000 characters");
        }
      }

      const feedbackData = {
        rating: parseInt(rating),
        content: comment ? comment.trim() : null
      };

      const actualVariantId = variantId.startsWith('item_') ? null : variantId;

      await Api.feedback.addFeedback(
        orderId,
        actualVariantId,
        feedbackData,
        token
      );

      showToast("Feedback created successfully", "success");
      setCreatingFeedback(false);
      onUpdate?.();
    } catch (err) {
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
      setLoadingStates(prev => ({ ...prev, creating: false }));
    }
  }, [orderId, showToast, onUpdate]);

  // Edit feedback
  const handleEditFeedback = useCallback(async (variantId, comment, rating) => {
    setLoadingStates(prev => ({ ...prev, editing: true }));

    const timeoutId = setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, editing: false }));
    }, 10000);

    try {
      const token = localStorage.getItem("token");

      if (!orderId) {
        throw new Error("Order ID is missing");
      }
      if (!variantId) {
        throw new Error("Variant ID is missing");
      }
      if (!token) {
        throw new Error("Authentication token is missing");
      }
      if (!rating) {
        throw new Error("Rating is required");
      }
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }
      if (comment && comment.trim()) {
        const trimmedComment = comment.trim();
        if (trimmedComment.length < 10) {
          throw new Error("Comment must be between 10 and 10.000 characters");
        }
        if (trimmedComment.length > 10000) {
          throw new Error("Comment must be between 10 and 10.000 characters");
        }
      }

      const feedbackData = {
        rating: parseInt(rating),
        content: comment ? comment.trim() : null
      };

      const actualVariantId = variantId.startsWith('item_') ? null : variantId;

      await Api.feedback.editFeedback(
        orderId,
        actualVariantId,
        feedbackData,
        token
      );

      showToast("Feedback updated successfully", "success");
      setEditingFeedback(null);
      onUpdate?.();
    } catch (err) {
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
      setLoadingStates(prev => ({ ...prev, editing: false }));
    }
  }, [orderId, showToast, onUpdate]);

  // Delete feedback
  const handleDeleteFeedback = useCallback(async () => {
    setShowDeleteConfirm(false);
    setLoadingStates(prev => ({ ...prev, deleting: true }));

    try {
      const token = localStorage.getItem("token");

      if (!orderId) {
        throw new Error("Order ID is missing");
      }
      if (!feedback.variantId) {
        throw new Error("Variant ID is missing");
      }
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const actualVariantId = feedback.variantId.startsWith('item_') ? null : feedback.variantId;

      await Api.feedback.deleteFeedback(orderId, actualVariantId, token);

      showToast("Feedback deleted successfully", "success");
      onUpdate?.();
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete feedback";
      showToast(errorMessage, "error");
    } finally {
      setLoadingStates(prev => ({ ...prev, deleting: false }));
    }
  }, [orderId, feedback.variantId, showToast, onUpdate, onClose]);

  const { feedback: feedbackData, productName, productImage, color, size, quantity, unitPrice, totalPrice, orderDate } = feedback || {};

  // Initialize creating feedback state if no feedback exists
  React.useEffect(() => {
    if (!hasFeedback && creatingFeedback === null) {
      setCreatingFeedback({ rating: 5, comment: "" });
    }
  }, [hasFeedback, creatingFeedback]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-3xl max-h-[90vh] relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 z-10"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                {hasFeedback ? "Feedback Details" : "Create Feedback"}
              </h2>
            </div>

            {/* Product & Order Information */}
            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl mb-6 border border-gray-200">
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Product & Order Information</h4>
              <div className="flex gap-4">
                <img
                  src={productImage}
                  alt={productName}
                  className="w-20 h-20 object-cover rounded-lg border"
                  onError={(e) => {
                    e.target.src = "/placeholder.png";
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">
                    {productName}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Color:</span> {color} |{" "}
                    <span className="font-medium">Size:</span> {size} |{" "}
                    <span className="font-medium">Quantity:</span> {quantity}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Unit Price:</span> {formatPrice(unitPrice)}
                  </p>
                  <p className="text-sm font-semibold text-red-600 mb-1">
                    <span className="font-medium">Total:</span> {formatPrice(totalPrice)}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Order ID:</span> {orderId}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Order Date:</span>{" "}
                      {new Date(orderDate).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Your Feedback</h4>
                {hasFeedback && !editingFeedback && !isDeletedByStaff && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingFeedback({
                        rating: feedbackData?.rating || 5,
                        comment: feedbackData?.content || ""
                      })}
                      disabled={loadingStates.deleting}
                      className={`p-1 rounded transition ${
                        loadingStates.deleting
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                      }`}
                      title="Edit Feedback"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={loadingStates.deleting}
                      className={`p-1 rounded transition ${
                        loadingStates.deleting
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                      }`}
                      title="Delete Feedback"
                    >
                      {loadingStates.deleting ? (
                        <LoadingSpinner size="sm" color="red" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {hasFeedback && editingFeedback === null && !creatingFeedback ? (
                <div className="space-y-3">
                  {/* Rating */}
                  {(feedbackData?.has_rating || feedbackData?.rating) && feedbackData?.rating && feedbackData.rating > 0 && (
                    <div className="flex items-center gap-2">
                      {renderStars(feedbackData.rating)}
                      <span className="text-sm text-gray-600">
                        {feedbackData.rating}/5
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  {isDeletedByStaff ? (
                    <p className="text-gray-500 text-sm italic whitespace-pre-wrap">
                      {feedbackData?.content || 'This feedback has been deleted by staff/admin'}
                    </p>
                  ) : feedbackData?.content && feedbackData.content.trim() !== '' ? (
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {feedbackData.content}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No comment provided</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center mb-4">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          if (hasFeedback) {
                            setEditingFeedback({
                              rating: r,
                              comment: editingFeedback?.comment || feedbackData?.content || ""
                            });
                          } else {
                            setCreatingFeedback({
                              rating: r,
                              comment: creatingFeedback?.comment || ""
                            });
                          }
                        }}
                        className="focus:outline-none"
                      >
                        <svg
                          className={`w-6 h-6 transition-transform ${
                            (hasFeedback 
                              ? (editingFeedback?.rating || feedbackData?.rating || 0)
                              : (creatingFeedback?.rating || 0)
                            ) >= r
                              ? "fill-yellow-400 text-yellow-400 scale-110"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder="Share your thoughts about this product... (Optional)"
                    value={hasFeedback 
                      ? (editingFeedback?.comment || feedbackData?.content || "")
                      : (creatingFeedback?.comment || "")
                    }
                    onChange={(e) => {
                      if (hasFeedback) {
                        setEditingFeedback({
                          ...editingFeedback,
                          rating: editingFeedback?.rating || feedbackData?.rating || 5,
                          comment: e.target.value,
                        });
                      } else {
                        setCreatingFeedback({
                          ...creatingFeedback,
                          rating: creatingFeedback?.rating || 5,
                          comment: e.target.value,
                        });
                      }
                    }}
                    className="w-full border-2 border-gray-300 rounded-xl p-3 mb-4 resize-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition outline-none"
                    rows={4}
                  />

                  <div className="flex justify-end space-x-3">
                    <ProductButton
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        if (hasFeedback) {
                          setEditingFeedback(null);
                        } else {
                          setCreatingFeedback({ rating: 5, comment: "" });
                        }
                      }}
                    >
                      Cancel
                    </ProductButton>

                    <ProductButton
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => {
                        const rating = hasFeedback
                          ? (editingFeedback?.rating || feedbackData?.rating || 5)
                          : (creatingFeedback?.rating || 5);
                        const comment = hasFeedback
                          ? (editingFeedback?.comment || feedbackData?.content || "")
                          : (creatingFeedback?.comment || "");
                        
                        if (hasFeedback) {
                          handleEditFeedback(
                            feedback.variantId || `item_${feedback.orderDetail?._id || 0}`,
                            comment,
                            rating
                          );
                        } else {
                          handleCreateFeedback(
                            feedback?.variantId || `item_${feedback?.orderDetail?._id || 0}`,
                            comment,
                            rating
                          );
                        }
                      }}
                      disabled={hasFeedback ? loadingStates.editing : loadingStates.creating}
                    >
                      {hasFeedback 
                        ? (loadingStates.editing ? "Updating..." : "Update Feedback")
                        : (loadingStates.creating ? "Creating..." : "Create Feedback")
                      }
                    </ProductButton>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 border-t shrink-0 border-gray-200">
            <ProductButton
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Close
            </ProductButton>
            <ProductButton
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                navigate(`/orders`);
              }}
            >
              View Order
            </ProductButton>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {hasFeedback && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Delete Feedback"
          message="Are you sure you want to delete this feedback? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDeleteFeedback}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
};

export default FeedbackDetailsModal;

