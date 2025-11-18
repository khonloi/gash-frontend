import React from "react";
import ProductButton from "./ProductButton";

/**
 * ConfirmationModal - Reusable confirmation modal component
 * @param {boolean} isOpen - Whether the modal is open
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} variant - Button variant for confirm button: 'danger' or 'primary' (default: 'danger')
 * @param {function} onConfirm - Callback when confirm is clicked
 * @param {function} onCancel - Callback when cancel is clicked
 */
const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md mx-4">
        <h3 id="modal-title" className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
        <p id="modal-description" className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <ProductButton
            variant="secondary"
            size="md"
            onClick={onCancel}
            aria-label={cancelText}
          >
            {cancelText}
          </ProductButton>
          <ProductButton
            variant={variant}
            size="md"
            onClick={onConfirm}
            aria-label={confirmText}
          >
            {confirmText}
          </ProductButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

