import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../hooks/useToast';
import Api from '../../../common/SummaryAPI';

export const useProductFeedback = (productId) => {
    const { showToast } = useToast();

    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState(null);
    const [feedbackStats, setFeedbackStats] = useState(null);

    const fetchFeedbacks = useCallback(async (id = productId, page = 1, limit = 10) => {
        if (!id) {
            setFeedbacks([]);
            setFeedbackLoading(false);
            setFeedbackError(null);
            return;
        }

        setFeedbackLoading(true);
        setFeedbackError(null);

        try {
            // Fetch ALL feedbacks for the entire product (from all variants)
            const feedbackResponse = await Api.feedback.getAllFeedback(id, page, limit);

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

            // Include deleted feedbacks (they will show deletion message) and sort
            const validFeedbacks = feedbacksData
                .filter(feedback => {
                    if (!feedback || !feedback.feedback) return false;
                    // Filter out feedbacks with no rating and no content
                    const hasRating = feedback.feedback?.rating !== null && feedback.feedback?.rating !== undefined && feedback.feedback.rating >= 1 && feedback.feedback.rating <= 5;
                    const hasContent = feedback.feedback?.content && feedback.feedback.content.trim() !== '';
                    return hasRating || hasContent;
                })
                .sort((a, b) => {
                    // If one is current user and other is not, current user comes first
                    if (a.customer?.is_current_user && !b.customer?.is_current_user) {
                        return -1;
                    }
                    if (!a.customer?.is_current_user && b.customer?.is_current_user) {
                        return 1;
                    }

                    // If both are current user or both are not, sort by date (newest first)
                    const dateA = new Date(a.feedback?.createdAt || a.order_date || 0);
                    const dateB = new Date(b.feedback?.createdAt || b.order_date || 0);
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
    }, [productId, showToast]);

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

    return {
        feedbacks,
        feedbackLoading,
        feedbackError,
        feedbackStats,
        fetchFeedbacks,
        formatDate
    };
};
