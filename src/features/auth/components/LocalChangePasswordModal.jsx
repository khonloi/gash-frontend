import React from "react";
import Modal from "../../../components/ui/Modal";
import Form from "../../../components/ui/Form";
import Button from "../../../components/ui/Button";
import { useChangePassword } from "../hooks/useChangePassword";

export default function LocalChangePasswordModal({ isOpen, handleCancel }) {
  const {
    form,
    loading,
    validationErrors,
    handleFieldChange,
    handleSubmit
  } = useChangePassword(handleCancel);

  const changePasswordFields = [
    {
      name: "oldPassword",
      label: "Current Password",
      type: "password",
      required: true,
      value: form.oldPassword,
      onChange: (e) => handleFieldChange("oldPassword", e.target.value),
      error: validationErrors.oldPassword,
      placeholder: "Enter current password",
    },
    {
      name: "newPassword",
      label: "New Password",
      type: "password",
      required: true,
      value: form.newPassword,
      onChange: (e) => handleFieldChange("newPassword", e.target.value),
      error: validationErrors.newPassword,
      placeholder: "Enter new password",
    },
    {
      name: "repeatPassword",
      label: "Confirm New Password",
      type: "password",
      required: true,
      value: form.repeatPassword,
      onChange: (e) => handleFieldChange("repeatPassword", e.target.value),
      error: validationErrors.repeatPassword,
      placeholder: "Enter confirm new password",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <Modal.Header>Change Password</Modal.Header>
      <Modal.Body>
        <Form
          onSubmit={handleSubmit}
          fields={changePasswordFields}
          fieldsClassName="space-y-6"
          showSubmitButton={false}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-2.5"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-2.5 min-w-[120px] justify-center"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Updating...</span>
            </div>
          ) : (
            'Update Password'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
