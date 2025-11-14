// src/components/FeedbackForm.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import ProductButton from "./ProductButton";

const FeedbackForm = ({
    variantId,
    onSubmit,
    initialRating = 5,
    initialComment = "",
    submitText = "Submit Review",
    showForm = false,
    onCancel,
}) => {
    const [open, setOpen] = useState(showForm);
    const [comment, setComment] = useState(initialComment);
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);

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
                <ProductButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setOpen(true)}
                    className="mt-2"
                >
                    Write a Review
                </ProductButton>
            )}

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-t-4 border-yellow-500 relative"
                        >
                            <h3 className="text-xl font-semibold text-yellow-700 mb-3 text-center">
                                {initialComment ? "Edit Your Review" : "Product Feedback"}
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <div className="flex justify-center mb-4">
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
                                                size={30}
                                                className={`transition-transform ${(hoverRating || rating) >= r
                                                    ? "fill-yellow-400 text-yellow-400 scale-110"
                                                    : "text-gray-300"
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    placeholder="Share your thoughts about this product... (Optional)"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full border rounded-xl p-3 mb-4 resize-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition outline-none"
                                    rows={4}
                                />

                                <div className="flex justify-end space-x-3">
                                    <ProductButton
                                        type="button"
                                        variant="secondary"
                                        size="md"
                                        onClick={() => {
                                            setOpen(false);
                                            onCancel?.();
                                        }}
                                    >
                                        Cancel
                                    </ProductButton>

                                    <ProductButton
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                    >
                                        {submitText}
                                    </ProductButton>
                                </div>
                            </form>

                            {/* Close Button */}
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    onCancel?.();
                                }}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                            >
                                ✕
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FeedbackForm;
