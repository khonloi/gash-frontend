// src/components/FeedbackForm.jsx
import React, { useState } from "react";

const FeedbackForm = ({ variantId, onSubmit }) => {
    const [open, setOpen] = useState(false);
    const [comment, setComment] = useState("");
    const [rating, setRating] = useState(5);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="mt-2 text-sm text-yellow-600 hover:underline"
            >
                Write a review
            </button>

            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60]">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-96 animate-fadeIn border-t-4 border-yellow-400">
                        <h3 className="text-lg font-semibold text-yellow-700 mb-3">
                            Product Feedback
                        </h3>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSubmit(variantId, comment, rating);
                                setOpen(false);
                                setComment("");
                                setRating(5);
                            }}
                        >
                            <textarea
                                placeholder="Share your thoughts about this product..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                                className="w-full border rounded-lg p-2 mb-3 resize-none focus:ring-2 focus:ring-yellow-400"
                                rows={4}
                            />

                            <div className="flex items-center justify-between mb-4">
                                <label className="text-gray-700 font-medium">
                                    Rating:
                                </label>
                                <select
                                    value={rating}
                                    onChange={(e) => setRating(Number(e.target.value))}
                                    className="border rounded-md p-1 focus:ring-2 focus:ring-yellow-400"
                                >
                                    {[5, 4, 3, 2, 1].map((r) => (
                                        <option key={r} value={r}>
                                            {r} ★
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 font-medium"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackForm;
