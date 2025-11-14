import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Api from '../common/SummaryAPI';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductButton from '../components/ProductButton';

const AllProductFeedback = () => {
  const { id } = useParams();
  const { showToast } = useToast();

  // State management
  const [product, setProduct] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbacksToShow, setFeedbacksToShow] = useState(5);
  // New filter states
  const [ratingFilter, setRatingFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');

  // Fetch product details
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const productResponse = await Api.newProducts.getById(id);
      setProduct(productResponse.data);
    } catch (err) {
      console.error('Product fetch error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch product details";
      if (err?.response?.status === 404) {
        setProduct(null);
      } else {
        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  // Fetch feedbacks for the entire product
  const fetchFeedbacks = useCallback(async (productId = null, page = 1, limit = 50) => {
    if (!productId) {
      setFeedbacks([]);
      setFeedbackLoading(false);
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError(null);

    try {
      const feedbackResponse = await Api.feedback.getAllFeedback(productId, page, limit);
      let feedbacksData = [];
      if (feedbackResponse.data) {
        if (feedbackResponse.data.feedbacks && Array.isArray(feedbackResponse.data.feedbacks)) {
          feedbacksData = feedbackResponse.data.feedbacks;
        } else if (Array.isArray(feedbackResponse.data)) {
          feedbacksData = feedbackResponse.data;
        } else if (feedbackResponse.data.data && Array.isArray(feedbackResponse.data.data)) {
          feedbacksData = feedbackResponse.data.data;
        }
      }

      const validFeedbacks = feedbacksData
        .filter(feedback => !feedback.feedback?.is_deleted)
        .sort((a, b) => {
          if (a.customer?.is_current_user && !b.customer?.is_current_user) return -1;
          if (!a.customer?.is_current_user && b.customer?.is_current_user) return 1;
          const dateA = new Date(a.feedback?.created_at || a.order_date || 0);
          const dateB = new Date(b.feedback?.created_at || b.order_date || 0);
          return dateB - dateA;
        });

      setFeedbacks(validFeedbacks);

      if (feedbackResponse.data?.statistics) {
        setFeedbackStats(feedbackResponse.data.statistics);
      }

      if (feedbackResponse.data?.product) {
        setProduct(prev => ({
          ...prev,
          name: feedbackResponse.data.product.product_name,
          pro_name: feedbackResponse.data.product.product_name,
          total_variants: feedbackResponse.data.product.total_variants
        }));
      }
    } catch (err) {
      console.error('Feedback fetch error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to load reviews";
      setFeedbackError(errorMessage);
      if (err?.response?.status === 404) {
        setFeedbacks([]);
        setFeedbackError(null);
      } else if (err?.response?.status !== 401) {
        showToast(errorMessage, "error", 3000);
      }
    } finally {
      setFeedbackLoading(false);
    }
  }, [showToast]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown Date';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return 'Unknown Date';
    }
  };

  // Extract unique colors and sizes for filter options
  const uniqueColors = [...new Set(feedbacks
    .filter(f => f.variant?.color)
    .map(f => f.variant.color))].sort();
  const uniqueSizes = [...new Set(feedbacks
    .filter(f => f.variant?.size)
    .map(f => f.variant.size))].sort();

  // Filter feedbacks based on selected filters
  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (!feedback.feedback?.is_deleted) {
      const matchesRating = ratingFilter ? feedback.feedback?.rating === parseInt(ratingFilter) : true;
      const matchesColor = colorFilter ? feedback.variant?.color === colorFilter : true;
      const matchesSize = sizeFilter ? feedback.variant?.size === sizeFilter : true;
      return matchesRating && matchesColor && matchesSize;
    }
    return false;
  });

  // Reset feedbacksToShow when filters change
  useEffect(() => {
    setFeedbacksToShow(5);
  }, [ratingFilter, colorFilter, sizeFilter]);

  // Load data on component mount
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [fetchProduct, id]);

  useEffect(() => {
    if (id) {
      fetchFeedbacks(id);
    }
  }, [id, fetchFeedbacks]);

  const handleShowMore = () => {
    setFeedbacksToShow(prev => prev + 5);
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Product ID</h2>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium border-2 border-blue-700 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

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
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium border-2 border-blue-700 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {product?.name || product?.pro_name || 'Product'} Feedback
            </h2>
            <Link
              to={`/product/${id}`}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium border-2 border-gray-700 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
            >
              <i className="lni lni-arrow-left mr-2"></i>
              Back to Product
            </Link>
          </div>

          {/* Filter UI */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 rounded-xl focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 focus:border-blue-600 transition-colors hover:bg-gray-50"
              >
                <option value="">All Ratings</option>
                {[1, 2, 3, 4, 5].map(rating => (
                  <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Color</label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 rounded-xl focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 focus:border-blue-600 transition-colors hover:bg-gray-50"
              >
                <option value="">All Colors</option>
                {uniqueColors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Size</label>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 rounded-xl focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 focus:border-blue-600 transition-colors hover:bg-gray-50"
              >
                <option value="">All Sizes</option>
                {uniqueSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {feedbackLoading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="medium" />
            </div>
          )}

          {feedbackError && (
            <div className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap" role="alert" tabIndex={0} aria-live="polite">
              <span className="text-lg" aria-hidden="true">⚠</span>
              {feedbackError}
              <ProductButton
                variant="secondary"
                size="sm"
                onClick={() => fetchFeedbacks(id)}
                aria-label="Retry loading feedback"
              >
                Retry
              </ProductButton>
            </div>
          )}

          {!feedbackLoading && !feedbackError && filteredFeedbacks.length === 0 && (
            <div className="text-center py-12">
              <i className="lni lni-comments text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Found</h3>
              <p className="text-gray-600">
                No feedback matches the selected filters.
              </p>
            </div>
          )}

          {!feedbackLoading && !feedbackError && feedbackStats && filteredFeedbacks.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 border-2 border-blue-200">
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

          {!feedbackLoading && !feedbackError && filteredFeedbacks.length > 0 && (
            <AnimatePresence>
              <div className="space-y-6">
                {filteredFeedbacks
                  .slice(0, feedbacksToShow)
                  .map((feedback) => (
                    <div
                      key={feedback._id}
                      className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 hover:shadow-sm border border-gray-200 transition-shadow duration-200"
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
                            {feedback.variant && (
                              <div className="text-sm text-gray-600 mt-1">
                                {feedback.variant.color} • {feedback.variant.size}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {feedback.feedback?.created_at
                              ? formatDate(feedback.feedback.created_at)
                              : feedback.order_date
                                ? formatDate(feedback.order_date)
                                : 'Unknown Date'}
                          </div>
                        </div>
                      </div>
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
                      {feedback.feedback?.has_content && (
                        <div className="mb-4">
                          <p 
                            className="text-gray-800 text-base sm:text-lg leading-relaxed bg-gray-50 p-4 rounded-xl border-l-4 border-yellow-400 break-words whitespace-pre-wrap max-w-full"
                            style={{ 
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere',
                              wordWrap: 'break-word'
                            }}
                          >
                            {feedback.feedback.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </AnimatePresence>)}
            {filteredFeedbacks.length > feedbacksToShow && (
              <div className="text-center mt-6 sm:mt-8">
                <ProductButton
                  variant="primary"
                  size="md"
                  onClick={handleShowMore}
                  className="inline-flex items-center"
                >
                  Show More Reviews
                  <i className="lni lni-arrow-down ml-2"></i>
                </ProductButton>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AllProductFeedback;