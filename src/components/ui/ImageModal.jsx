import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * ImageModal - Reusable full-screen image viewer component with escape key closure and scroll lock
 * @param {object} selectedImage - The active image object with { src, alt } (null when closed)
 * @param {function} onClose - Close handler callback
 */
const ImageModal = ({ selectedImage, onClose }) => {
  useEffect(() => {
    if (!selectedImage) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    // Lock scroll when open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [selectedImage, onClose]);

  return (
    <AnimatePresence>
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-[120] p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all border border-transparent hover:border-white/20 focus:outline-none"
              aria-label="Close image preview"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt || "Image preview"}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border-2 border-white/10"
            />
            {selectedImage.alt && (
              <div className="mt-4 text-center">
                <p className="text-white text-sm font-medium bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/15 inline-block shadow-lg">
                  {selectedImage.alt}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageModal;
