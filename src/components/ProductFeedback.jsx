import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Api from '../common/SummaryAPI';
import LoadingForm from './LoadingSpinner';

const ProductFeedback = ({ productId }) => {
    const { showToast } = useToast();

    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState(null);
    const [feedbackStats, setFeedbackStats] = useState(null);

    const fetchFeedbacks = useCallback(async (productId = null, page = 1, limit = 10) => {
        if (!productId) {
            setFeedbacks([]);
            setFeedbackLoading(false);
            setFeedbackError(null);
            return;
        }

        setFeedbackLoading(true);
        setFeedbackError(null);

        try {
            // Fetch ALL feedbacks for the entire product (from all variants)
            // This shows all reviews regardless of which variant they belong to
            const feedbackResponse = await Api.feedback.getAllFeedback(productId, page, limit);

            // Handle different response structures
            let feedbacksData = [];
            if (feedbackResponse?.data) {
                if (feedbackResponse.data.feedbacks && Array.isArray(feedbackResponse.data.feedbacks)) {
                    feedbacksData = feedbackResponse.data.feedbacks;
                } else if (Array.isArray(feedbackResponse.data)) {
                    feedbacksData = feedbackResponse.data;
                } else if (feedbackResponse.data.data && Array.isArray(feedbackResponse.data.data)) {
                    feedbacksData = feedbackResponse.data.data;
                }
            }

            // Filter out deleted feedbacks and sort: current user first, then by date (newest first)
            const validFeedbacks = feedbacksData
                .filter(feedback => feedback && !feedback.feedback?.is_deleted)
                .sort((a, b) => {
                    // If one is current user and other is not, current user comes first
                    if (a.customer?.is_current_user && !b.customer?.is_current_user) {
                        return -1;
                    }
                    if (!a.customer?.is_current_user && b.customer?.is_current_user) {
                        return 1;
                    }

                    // If both are current user or both are not, sort by date (newest first)
                    const dateA = new Date(a.feedback?.created_at || a.order_date || 0);
                    const dateB = new Date(b.feedback?.created_at || b.order_date || 0);
                    return dateB - dateA;
                });

            setFeedbacks(validFeedbacks);

            // Set statistics if available
            if (feedbackResponse?.data?.statistics) {
                setFeedbackStats(feedbackResponse.data.statistics);
            } else {
                setFeedbackStats(null);
            }
        } catch (err) {
            console.error('Feedback fetch error:', err);
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to load reviews";
            setFeedbackError(errorMessage);

            if (err?.status === 404) {
                setFeedbacks([]);
                setFeedbackError(null); // Don't show error for no feedbacks
            } else if (err?.status !== 401) {
                // Don't show toast for 401 (unauthorized) as it's handled globally
                showToast(errorMessage, "error", 3000);
            }
        } finally {
            setFeedbackLoading(false);
        }
    }, [showToast]);

    // Fetch feedbacks when productId changes
    useEffect(() => {
        if (productId) {
            fetchFeedbacks(productId);
        }
    }, [productId, fetchFeedbacks]);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return "Unknown Date";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Unknown Date";

            // Format as DD/MM/YYYY HH:MM (Vietnamese standard)
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');

            return `${day}/${month}/${year} ${hours}:${minutes}`;
        } catch {
            return "Unknown Date";
        }
    }, []);

    // Early return if no productId (after all hooks)
    if (!productId) {
        return (
            <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 border-t-2 border-gray-300 w-full px-0 sm:px-2">
                <div className="text-center py-8">
                    <p className="text-gray-500">No product ID provided</p>
                </div>
            </div>
        );
    }

    if (feedbackLoading) {
        return (
            <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 border-t-2 border-gray-300 w-full px-0 sm:px-2">
                <LoadingForm
                    text="Loading reviews..."
                    height="h-32"
                    className="mb-6"
                    size="lg"
                />
            </div>
        );
    }

    if (feedbackError) {
        return (
            <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 border-t-2 border-gray-300 w-full px-0 sm:px-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <i className="lni lni-warning text-red-500 text-xl mr-3"></i>
                        <div>
                            <h3 className="text-red-800 font-medium">Error Loading Reviews</h3>
                            <p className="text-red-600 text-sm mt-1">{feedbackError}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchFeedbacks(productId)}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (feedbacks.length === 0) {
        return (
            <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 border-t-2 border-gray-300 w-full px-0 sm:px-2">
                <div className="text-center py-12">
                    <div className="mb-6">
                        <i className="lni lni-comments text-6xl text-gray-300 mb-4"></i>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                        <p className="text-gray-500 text-sm">
                            Be the first to review this product
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 sm:mt-5 md:mt-6 pt-4 sm:pt-5 border-t-2 border-gray-300 w-full px-0 sm:px-2">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Product Reviews</h3>
                    <div className="flex items-center gap-4">
                        {feedbackStats?.average_rating && (
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-500">Average:</span>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`w-3 h-3 ${i < Math.round(feedbackStats.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                    <span className="text-sm font-medium text-gray-700">
                                        {feedbackStats.average_rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        )}
                        <span className="text-sm text-gray-500">
                            {feedbackStats?.total_feedbacks || feedbacks.length} review{(feedbackStats?.total_feedbacks || feedbacks.length) !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {feedbacks.slice(0, 3).map((feedback) => {
                    if (!feedback || !feedback._id) return null;

                    return (
                        <div key={feedback._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                        {feedback.customer?.image ? (
                                            <img
                                                src={feedback.customer.image}
                                                alt={feedback.customer?.username || 'User'}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-full h-full flex items-center justify-center text-white font-bold ${feedback.customer?.image ? 'hidden' : 'flex'}`}
                                        >
                                            {feedback.customer?.username?.charAt(0).toUpperCase() || 'A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {feedback.customer?.username || "Anonymous"}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {feedback.feedback?.created_at
                                                ? formatDate(feedback.feedback.created_at)
                                                : feedback.order_date
                                                    ? formatDate(feedback.order_date)
                                                    : 'Unknown Date'}
                                        </div>
                                        {feedback.variant && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                {feedback.variant.color} • {feedback.variant.size}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {feedback.feedback?.has_rating && feedback.feedback?.rating && (
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-4 h-4 ${i < feedback.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                        <span className="text-sm text-gray-600 ml-1">
                                            ({feedback.feedback.rating}/5)
                                        </span>
                                    </div>
                                )}
                            </div>
                            {feedback.feedback?.has_content && feedback.feedback?.content && (
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    "{feedback.feedback.content}"
                                </p>
                            )}

                            {!feedback.feedback?.has_content && !feedback.feedback?.has_rating && (
                                <p className="text-gray-500 text-sm italic">
                                    No review provided
                                </p>
                            )}
                        </div>
                    );
                })}

                {/* View All Feedback Button - only show if more than 3 feedbacks */}
                {feedbacks.length > 3 && (
                    <div className="text-center mt-6">
                        <Link
                            to={`/product/${productId}/all-feedback`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <i className="lni lni-comments mr-2"></i>
                            View All Feedback
                            <i className="lni lni-arrow-right ml-2"></i>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductFeedback;
