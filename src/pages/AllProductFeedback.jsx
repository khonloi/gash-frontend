import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useProductFeedback } from '../hooks/useProductFeedback';
import LoadingSpinner, { LoadingSkeleton } from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { formatDate } from '../utils/formatters';

const AllProductFeedback = () => {
  const { id } = useParams();
  const { showToast } = useToast();

  const {
    product,
    loading,
    filteredFeedbacks,
    feedbackStats,
    feedbackLoading,
    feedbackError,
    feedbacksToShow,
    ratingFilter,
    setRatingFilter,
    colorFilter,
    setColorFilter,
    sizeFilter,
    setSizeFilter,
    uniqueColors,
    uniqueSizes,
    handleShowMore,
    fetchFeedbacks
  } = useProductFeedback(id, showToast);

  if (!id || loading || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {loading ? <LoadingSpinner size="large" /> : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
            <Link to="/products" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium border-2 border-blue-700">
              Back to Products
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-5xl shadow-sm border border-gray-200">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg sm:text-2xl font-normal m-0">
              {product?.name || product?.pro_name || 'Product'} Feedback
            </h1>
            <Link
              to={`/product/${id}`}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium border-2 border-gray-700 focus:outline-none text-sm"
            >
              Back to Product
            </Link>
          </div>
        </header>

        {/* Filters */}
        <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4 mb-6">
          <legend className="text-xs sm:text-base font-semibold px-2">Filters</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 hover:border-blue-600 focus:outline-none">
              <option value="">All Ratings</option>
              {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
            </select>
            <select value={colorFilter} onChange={e => setColorFilter(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 hover:border-blue-600 focus:outline-none">
              <option value="">All Colors</option>
              {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 hover:border-blue-600 focus:outline-none">
              <option value="">All Sizes</option>
              {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </fieldset>

        {/* Loading / Error / Empty */}
        {feedbackLoading && <LoadingSkeleton count={3} />}
        {feedbackError && (
          <div className="text-center text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-4 flex flex-col items-center gap-3">
            <span className="text-lg">Warning</span> {feedbackError}
            <Button variant="secondary" size="sm" onClick={() => fetchFeedbacks(id)}>Retry</Button>
          </div>
        )}
        {!feedbackLoading && !feedbackError && filteredFeedbacks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-lg italic">No Feedback Found</p>
            <p className="text-sm">No feedback matches the selected filters.</p>
          </div>
        )}

        {/* Stats */}
        {feedbackStats && filteredFeedbacks.length > 0 && (
          <div className="bg-white border-2 border-gray-300 rounded-xl p-5 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-600">{feedbackStats.average_rating.toFixed(1)}</div>
                  <div className="flex justify-center sm:justify-start mt-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-6 h-6 ${i < Math.round(feedbackStats.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-semibold">Based on {feedbackStats.total_feedbacks} review{feedbackStats.total_feedbacks !== 1 ? 's' : ''}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{feedbackStats.total_ratings} rated</div>
                </div>
              </div>
              <div className="flex gap-3">
                {[5, 4, 3, 2, 1].map(r => (
                  <div key={r} className="text-center">
                    <span className="text-xs text-gray-500">{r}</span>
                    <div className="w-3 h-16 bg-gray-200 rounded mt-1">
                      <div className="w-full rounded bg-yellow-400" style={{ height: `${feedbackStats.rating_percentage?.[r] || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feedback List */}
        {filteredFeedbacks.length > 0 && (
          <>
            <div className="mb-4 text-xs sm:text-sm text-gray-600">
              Showing 1–{Math.min(feedbacksToShow, filteredFeedbacks.length)} of {filteredFeedbacks.length} feedback{filteredFeedbacks.length !== 1 ? 's' : ''}
            </div>

            <div className="space-y-4">
              {filteredFeedbacks.slice(0, feedbacksToShow).map(feedback => {
                const userImg = feedback.customer?.image || null;
                const variantLabel = `${feedback.variant?.color || 'N/A'} • ${feedback.variant?.size || 'N/A'}`;
                const dateStr = formatDate(feedback.feedback?.createdAt || feedback.order_date);

                return (
                  <article
                    key={feedback._id}
                    className="bg-white border-2 border-gray-300 rounded-xl p-4 sm:p-5 flex flex-col gap-4 transition-shadow hover:shadow-sm"
                  >
                    {/* Top half: Grouped info */}
                    <div className="flex gap-4">
                      {/* User Avatar */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          {userImg ? (
                            <img
                              src={userImg}
                              alt={feedback.customer?.username || 'User'}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-xl">
                              {(feedback.customer?.username?.[0]?.toUpperCase() || 'A')}
                            </span>
                          )}
                        </div>
                        {feedback.customer?.is_current_user && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>

                      {/* Info group */}
                      <div className="flex-1 flex flex-col justify-center gap-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-gray-900 m-0 text-sm sm:text-base">{variantLabel}</p>
                          <span className="text-xs sm:text-sm text-gray-500">{dateStr}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-semibold text-gray-900">
                              {feedback.customer?.username || 'Anonymous'}
                            </span>
                            {feedback.customer?.is_current_user && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">You</span>
                            )}
                          </div>
                          {/* Rating */}
                          {feedback.feedback?.rating > 0 && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-5 h-5 ${i < feedback.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom half: Review content */}
                    <div className="mt-2">
                      {feedback.feedback?.content?.trim() ? (
                        <p className={`text-xs sm:text-sm leading-relaxed m-0 ${feedback.feedback?.isDeleted ? 'text-gray-500 italic' : 'text-gray-700'}`}>
                          {feedback.feedback.content}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-400 italic m-0">No comment provided</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Show More */}
            {filteredFeedbacks.length > feedbacksToShow && (
              <div className="text-center mt-8">
                <Button variant="default" size="md" onClick={handleShowMore}>
                  Show More Reviews
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default AllProductFeedback;
