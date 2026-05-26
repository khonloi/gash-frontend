import React from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

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
  return (
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="max-w-md" zIndex="z-[120]">
      <Modal.Header showClose={true}>
        {title}
      </Modal.Header>
      <Modal.Body>
        <p className="text-gray-600 leading-relaxed text-sm sm:text-base m-0">
          {message}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          size="md"
          onClick={onCancel}
          aria-label={cancelText}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant}
          size="md"
          onClick={onConfirm}
          aria-label={confirmText}
        >
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;
