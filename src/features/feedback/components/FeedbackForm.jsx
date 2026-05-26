// src/components/FeedbackForm.jsx
import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import ConfirmationModal from "../../orders/components/ConfirmationModal";
import Modal from "../../../components/ui/Modal";
import TextArea from "../../../components/ui/TextArea";
import Form from "../../../components/ui/Form";


const FeedbackForm = ({
    variantId,
    onSubmit,
    initialRating = 5,
    initialComment = "",
    submitText = "Submit Review",
    showForm = false,
    onCancel,
    onDelete,
    isDeleting = false,
    showDeleteButton = false,
    productName = "",
    existingFeedback = null,
}) => {
    const [open, setOpen] = useState(showForm);
    const [comment, setComment] = useState(initialComment);
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const feedbackFields = existingFeedback?.isDeleted || initialComment === 'This feedback has been deleted by staff/admin' ? [
        {
            name: 'deleted-notice',
            render: () => (
                <div key="deleted-notice" className="py-8 text-center">
                    <p className="text-gray-600 italic text-base">
                        This feedback has been deleted by staff/admin
                    </p>
                </div>
            )
        }
    ] : [
        {
            name: 'rating',
            render: () => (
                <div key="star-rating" className="flex justify-center mb-6">
                    {[1, 2, 3, 4, 5].map((r) => (
                        <button
                            key={r}
                            type="button"
                            onMouseEnter={() => setHoverRating(r)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(r)}
                            className="focus:outline-none"
                        >
                            <Star
                                size={32}
                                className={`transition-transform ${
                                    (hoverRating || rating) >= r
                                        ? "fill-yellow-400 text-yellow-400 scale-110"
                                        : "text-gray-300"
                                }`}
                            />
                        </button>
                    ))}
                </div>
            )
        },
        {
            name: 'comment',
            type: 'textarea',
            value: comment,
            onChange: (e) => setComment(e.target.value),
            placeholder: 'Share your thoughts about this product... (Optional)',
            inputProps: {
                rows: 4
            }
        }
    ];

    // Sync open state with showForm prop
    useEffect(() => {
        setOpen(showForm);
    }, [showForm]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate that rating is selected
        if (!rating || rating < 1) {
            alert("Please select a rating before submitting.");
            return;
        }

        onSubmit(variantId, comment, rating);
        setOpen(false);
        setComment(initialComment);
        setRating(initialRating);
    };

    return (
        <>
            {!showForm && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setOpen(true)}
                    className="mt-2"
                >
                    Write a Review
                </Button>
            )}

            <Modal
                isOpen={open}
                onClose={() => {
                    setOpen(false);
                    onCancel?.();
                }}
                maxWidth="max-w-md"
                zIndex="z-[60]"
            >
                <Modal.Header>
                    <div className="flex items-center gap-2">
                        <span>Feedback for {productName || "Product"}</span>
                        {showDeleteButton && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isDeleting}
                                className={`p-2 rounded-lg transition ${
                                    isDeleting
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-red-600 hover:bg-red-50'
                                }`}
                                title="Delete Feedback"
                            >
                                {isDeleting ? (
                                    <LoadingSpinner size="sm" color="red" />
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                </Modal.Header>

                <Modal.Body>
                    <Form
                        onSubmit={handleSubmit}
                        fields={feedbackFields}
                        showSubmitButton={false}
                    />
                </Modal.Body>

                    {!existingFeedback?.isDeleted && initialComment !== 'This feedback has been deleted by staff/admin' && (
                        <Modal.Footer>
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                onClick={() => {
                                    setOpen(false);
                                    onCancel?.();
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={!rating || rating < 1}
                            >
                                {submitText}
                            </Button>
                        </Modal.Footer>
                    )}
            </Modal>

            {/* Delete Feedback Confirmation Modal */}
            {showDeleteButton && (
                <ConfirmationModal
                    isOpen={showDeleteConfirm}
                    title="Delete Feedback"
                    message="Are you sure you want to delete this feedback? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="danger"
                    onConfirm={() => {
                        setShowDeleteConfirm(false);
                        onDelete?.();
                    }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </>
    );
};

export default FeedbackForm;

