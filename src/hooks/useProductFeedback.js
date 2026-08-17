import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Api from '../common/SummaryAPI';

export const useProductFeedback = (productId, showToast) => {
  const { data: productData, isLoading: loading, error: productError } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const productResponse = await Api.products.getById(productId);
      return productResponse.data;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: feedbackResult, isLoading: feedbackLoading, error: feedbackErrorObj, refetch: fetchFeedbacks } = useQuery({
    queryKey: ['productFeedback', productId],
    queryFn: async () => {
      const feedbackResponse = await Api.feedback.getAllFeedback(productId);
      let feedbacksData = [];
      if (feedbackResponse.data?.feedbacks && Array.isArray(feedbackResponse.data.feedbacks)) {
        feedbacksData = feedbackResponse.data.feedbacks;
      } else if (Array.isArray(feedbackResponse.data)) {
        feedbacksData = feedbackResponse.data;
      } else if (feedbackResponse.data?.data && Array.isArray(feedbackResponse.data.data)) {
        feedbacksData = feedbackResponse.data.data;
      }

      const validFeedbacks = feedbacksData
        .filter(f => {
          if (!f || !f.feedback) return false;
          const hasRating = f.feedback?.rating !== null && f.feedback?.rating !== undefined && f.feedback.rating >= 1 && f.feedback.rating <= 5;
          const hasContent = f.feedback?.content && f.feedback.content.trim() !== '';
          return hasRating || hasContent;
        })
        .sort((a, b) => {
          if (a.customer?.is_current_user && !b.customer?.is_current_user) return -1;
          if (!a.customer?.is_current_user && b.customer?.is_current_user) return 1;
          return new Date(b.feedback?.createdAt || b.order_date) - new Date(a.feedback?.createdAt || a.order_date);
        });

      return {
        feedbacks: validFeedbacks,
        statistics: feedbackResponse.data?.statistics || null,
        productName: feedbackResponse.data?.product?.product_name || null,
      };
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });

  const [feedbacksToShow, setFeedbacksToShow] = useState(5);
  const [ratingFilter, setRatingFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');

  const product = productData || null;
  const feedbacks = useMemo(() => feedbackResult?.feedbacks || [], [feedbackResult?.feedbacks]);
  const feedbackStats = feedbackResult?.statistics || null;
  const feedbackError = feedbackErrorObj?.response?.data?.message || feedbackErrorObj?.message || (feedbackErrorObj ? "Failed to load reviews" : null);

  // Merge product name if feedback query returns it and product query doesn't have it
  const finalProduct = useMemo(() => {
    if (!product && feedbackResult?.productName) {
      return { name: feedbackResult.productName, pro_name: feedbackResult.productName };
    }
    if (product && feedbackResult?.productName) {
      return { ...product, name: feedbackResult.productName, pro_name: feedbackResult.productName };
    }
    return product;
  }, [product, feedbackResult?.productName]);

  const uniqueColors = useMemo(() => {
    return [...new Set(feedbacks.filter(f => f.variant?.color).map(f => f.variant.color))].sort();
  }, [feedbacks]);

  const uniqueSizes = useMemo(() => {
    return [...new Set(feedbacks.filter(f => f.variant?.size).map(f => f.variant.size))].sort();
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(feedback => {
      const matchesRating = ratingFilter ? feedback.feedback?.rating === parseInt(ratingFilter) : true;
      const matchesColor = colorFilter ? feedback.variant?.color === colorFilter : true;
      const matchesSize = sizeFilter ? feedback.variant?.size === sizeFilter : true;
      return matchesRating && matchesColor && matchesSize;
    });
  }, [feedbacks, ratingFilter, colorFilter, sizeFilter]);

  useEffect(() => {
    setFeedbacksToShow(5);
  }, [ratingFilter, colorFilter, sizeFilter]);

  useEffect(() => {
    if (productError && showToast) {
       const errorMessage = productError?.response?.data?.message || productError?.message || "Failed to fetch product details";
       if (productError?.response?.status !== 404) {
          showToast(errorMessage, "error");
       }
    }
  }, [productError, showToast]);

  useEffect(() => {
    if (feedbackErrorObj && showToast) {
       const errorMessage = feedbackErrorObj?.response?.data?.message || feedbackErrorObj?.message || "Failed to load reviews";
       if (feedbackErrorObj?.response?.status !== 404 && feedbackErrorObj?.response?.status !== 401) {
          showToast(errorMessage, "error", 3000);
       }
    }
  }, [feedbackErrorObj, showToast]);

  const handleShowMore = useCallback(() => {
    setFeedbacksToShow(prev => prev + 5);
  }, []);

  return {
    product: finalProduct,
    loading,
    feedbacks,
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
  };
};
