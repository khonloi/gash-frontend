import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Api from '../common/SummaryAPI';
// import { useAuth } from '../context/AuthContext'; // Not used
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductFeedback = () => {
    const { id, variantId } = useParams();
    // const navigate = useNavigate(); // Removed as not used
    // const { user } = useAuth(); // Not used in this component
    const { showToast } = useToast();

    // State management
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbackStats, setFeedbackStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState(null);
    const [feedbacksToShow, setFeedbacksToShow] = useState(5);

    // Fetch product and variant details
    const fetchProductAndVariant = useCallback(async () => {
        setLoading(true);
        try {
            const [productResponse, variantsResponse] = await Promise.all([
                Api.products.getProduct(id),
                Api.products.getVariants(id),
            ]);

            setProduct(productResponse.data);
            const variants = variantsResponse.data || [];

            // Find the specific variant if variantId is provided
            if (variantId) {
                const variant = variants.find(v => v._id === variantId);
                if (variant) {
                    setSelectedVariant(variant);
                }
            }

            // If no specific variant, use the first available variant
            if (!variantId && variants.length > 0) {
                setSelectedVariant(variants[0]);
            }
        } catch (err) {
            showToast(err.message || "Failed to fetch product details", "error");
        } finally {
            setLoading(false);
        }
    }, [id, variantId, showToast]);

    // Fetch feedbacks for the selected variant
    const fetchFeedbacks = useCallback(async (variantId = null, page = 1, limit = 50) => {
        setFeedbackLoading(true);
        setFeedbackError(null);

        try {
            let feedbackResponse;
            if (variantId) {
                // Fetch feedbacks for specific variant with pagination
                feedbackResponse = await Api.feedback.getAllFeedback(variantId, page, limit);

                // Handle the exact API response structure
                if (feedbackResponse.data && feedbackResponse.data.feedbacks) {
                    // The backend already sorts feedbacks with current user first, then by date
                    // So we can use the feedbacks as they come from the API
                    setFeedbacks(feedbackResponse.data.feedbacks);
                    setFeedbackStats(feedbackResponse.data.statistics || null);

                    // Update product info if available
                    if (feedbackResponse.data.product) {
                        setProduct(prev => ({
                            ...prev,
                            pro_name: feedbackResponse.data.product.product_name,
                            total_variants: feedbackResponse.data.product.total_variants
                        }));
                    }
                } else if (feedbackResponse.data && Array.isArray(feedbackResponse.data)) {
                    setFeedbacks(feedbackResponse.data);
                    setFeedbackStats(null);
                } else {
                    setFeedbacks([]);
                    setFeedbackStats(null);
                }
            } else {
                // Fetch feedbacks for entire product
                feedbackResponse = await Api.products.getFeedbacks(id);
                setFeedbacks(Array.isArray(feedbackResponse.data) ? feedbackResponse.data : []);
                setFeedbackStats(null);
            }
        } catch (err) {
            console.error('Feedback fetch error:', err);
            if (err.status === 404) {
                setFeedbacks([]);
                setFeedbackStats(null);
            } else {
                setFeedbackError(err.message || "Failed to fetch feedback");
            }
        } finally {
            setFeedbackLoading(false);
        }
    }, [id]);

    // Load data on component mount
    useEffect(() => {
        fetchProductAndVariant();
    }, [fetchProductAndVariant]);

    // Fetch feedbacks when variant changes
    useEffect(() => {
        if (selectedVariant?._id) {
            fetchFeedbacks(selectedVariant._id);
        }
    }, [selectedVariant, fetchFeedbacks]);

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown Date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Unknown Date';
        }
    };

    // Format price helper
    const formatPrice = (price) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Handle variant selection
    const handleVariantSelect = (variant) => {
        setSelectedVariant(variant);
        setFeedbacksToShow(5); // Reset to show first 5 feedbacks
    };

    // Show more feedbacks
    const handleShowMore = () => {
        setFeedbacksToShow(prev => prev + 5);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
                    <Link
                        to="/products"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Variant Selection */}
                {product.variants && product.variants.length > 1 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Variant</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {product.variants.map((variant) => (
                                <button
                                    key={variant._id}
                                    onClick={() => handleVariantSelect(variant)}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${selectedVariant?._id === variant._id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-medium text-gray-900">
                                        {variant.color_id?.color_name} - {variant.size_id?.size_name}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {formatPrice(variant.price)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Feedback Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {product?.pro_name || 'Product'} Feedback
                        </h2>
                    </div>

                    {/* Loading State */}
                    {feedbackLoading && (
                        <div className="flex items-center justify-center py-12">
                            <LoadingSpinner size="medium" />
                        </div>
                    )}

                    {/* Error State */}
                    {feedbackError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <i className="lni lni-warning text-red-500 text-xl mr-3"></i>
                                <div>
                                    <h3 className="text-red-800 font-medium">Error Loading Feedback</h3>
                                    <p className="text-red-600 text-sm mt-1">{feedbackError}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => fetchFeedbacks(selectedVariant?._id)}
                                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* No Feedback State */}
                    {!feedbackLoading && !feedbackError && feedbacks.filter(feedback => !feedback.feedback?.is_deleted).length === 0 && (
                        <div className="text-center py-12">
                            <i className="lni lni-comments text-6xl text-gray-300 mb-4"></i>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
                            <p className="text-gray-600">
                                {selectedVariant
                                    ? `No feedback available for ${selectedVariant.color_id?.color_name} - ${selectedVariant.size_id?.size_name}`
                                    : "Please select a variant to view feedback"
                                }
                            </p>
                        </div>
                    )}

                    {/* Feedback Statistics */}
                    {!feedbackLoading && !feedbackError && feedbackStats && feedbacks.filter(feedback => !feedback.feedback?.is_deleted).length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex items-center mr-6">
                                        <span className="text-4xl font-bold text-yellow-600 mr-3">
                                            {feedbackStats.average_rating.toFixed(1)}
                                        </span>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    className={`w-6 h-6 ${i < Math.floor(feedbackStats.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-gray-700">
                                        <div className="text-lg font-semibold">
                                            Based on {feedbackStats.total_feedbacks} review{feedbackStats.total_feedbacks !== 1 ? 's' : ''}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {feedbackStats.total_ratings} with ratings
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-700 mb-2">Rating Distribution</div>
                                    <div className="flex space-x-2">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <div key={rating} className="flex flex-col items-center">
                                                <span className="text-xs text-gray-500 mb-1">{rating}</span>
                                                <div className="w-3 h-12 bg-gray-200 rounded">
                                                    <div
                                                        className="bg-yellow-400 rounded transition-all duration-500"
                                                        style={{
                                                            height: `${feedbackStats.rating_percentage[rating] || 0}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feedback List */}
                    {!feedbackLoading && !feedbackError && feedbacks.length > 0 && (
                        <>
                            {/* Note: Feedbacks are sorted by backend with current user's feedback first, then by date */}
                            <AnimatePresence>
                                <div className="space-y-6">
                                    {feedbacks
                                        .filter(feedback => !feedback.feedback?.is_deleted) // Filter out deleted feedbacks
                                        .slice(0, feedbacksToShow)
                                        .map((feedback) => (
                                            <div
                                                key={feedback._id}
                                                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
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
                                                                    className={`w-full h-full flex items-center justify-center text-white font-bold text-xl ${feedback.customer?.image ? 'hidden' : 'flex'}`}
                                                                >
                                                                    {feedback.customer?.username?.charAt(0).toUpperCase() || 'A'}
                                                                </div>
                                                            </div>
                                                            {/* Current user indicator */}
                                                            {feedback.customer?.is_current_user && (
                                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                    <i className="lni lni-check text-white text-xs"></i>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-semibold text-gray-900 text-lg">
                                                                    {feedback.customer?.username || "Anonymous"}
                                                                </div>
                                                                {feedback.customer?.is_current_user && (
                                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {feedback.customer?.name && (
                                                                <div className="text-sm text-gray-600">
                                                                    {feedback.customer.name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-500">
                                                            {feedback.order_date ? formatDate(feedback.order_date) : 'Unknown Date'}
                                                        </div>

                                                    </div>
                                                </div>

                                                {/* Rating Display */}
                                                {feedback.feedback?.has_rating && (
                                                    <div className="flex items-center mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg
                                                                        key={i}
                                                                        className={`w-6 h-6 ${i < feedback.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Feedback Content */}
                                                {feedback.feedback?.has_content && (
                                                    <div className="mb-4">
                                                        <p className="text-gray-800 text-lg leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-yellow-400">
                                                            {feedback.feedback.content}
                                                        </p>
                                                    </div>
                                                )}

                                            </div>
                                        ))}
                                </div>
                            </AnimatePresence>

                            {/* Show More Button */}
                            {feedbacks.filter(feedback => !feedback.feedback?.is_deleted).length > feedbacksToShow && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={handleShowMore}
                                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Show More Reviews
                                        <i className="lni lni-arrow-down ml-2"></i>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductFeedback;
