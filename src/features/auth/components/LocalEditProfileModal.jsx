import React, { useState, useRef, useCallback } from "react";
import Modal from "../../../components/ui/Modal";
import Form from "../../../components/ui/Form";
import Button from "../../../components/ui/Button";
import { Tag, Phone, MapPin, Users, Calendar, Camera } from "lucide-react";
import { useToast } from "../../../hooks/useToast";

export default function LocalEditProfileModal({
  isOpen,
  formData,
  setFormData,
  previewUrl,
  handleFileChange,
  handleSubmit,
  handleCancel,
  selectedFile,
  profile,
  loading,
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});

  const validateField = useCallback((name, value, currentFormData = formData) => {
    switch (name) {
      case 'name': {
        if (!value || value.trim() === '') return 'Please fill in all required fields';
        const trimmedName = value.trim();
        if (trimmedName.length > 50) {
          return 'Name must be at most 50 characters';
        }
        if (!/^[\p{L}\s]+$/u.test(trimmedName)) {
          return 'Name must contain only letters and spaces';
        }
        return null;
      }
      case 'phone': {
        if (!value || value.trim() === '') return 'Please fill in all required fields';
        if (!/^\d{10}$/.test(value.trim())) {
          return 'Phone must be exactly 10 digits';
        }
        return null;
      }
      case 'address': {
        if (!value || value.trim() === '') return 'Please fill in all required fields';
        const trimmedAddress = value.trim();
        if (trimmedAddress.length > 200) {
          return 'Address must be at most 200 characters';
        }
        return null;
      }
      case 'dob': {
        if (!value || value.trim() === '') return 'Please fill in all required fields';
        return null;
      }
      case 'image': {
        const hasImage = Boolean(currentFormData.image?.trim() || selectedFile || profile?.image);
        if (!hasImage) return 'Please fill in all required fields';
        if (currentFormData.image?.trim() && !selectedFile) {
          const imageUrl = currentFormData.image.trim().toLowerCase();
          if (!imageUrl.match(/\.(png|jpg|jpeg)$/i) && !imageUrl.startsWith('data:image/')) {
            return 'Please select a valid image type';
          }
        }
        if (selectedFile) {
          const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
          if (!validTypes.includes(selectedFile.type.toLowerCase())) {
            return 'Please select a valid image type';
          }
        }
        return null;
      }
      default:
        return null;
    }
  }, [formData, selectedFile, profile]);

  const validateForm = useCallback(() => {
    const errors = {};
    const nameError = validateField('name', formData.name);
    if (nameError) errors.name = nameError;

    const phoneError = validateField('phone', formData.phone);
    if (phoneError) errors.phone = phoneError;

    const addressError = validateField('address', formData.address);
    if (addressError) errors.address = addressError;

    const dobError = validateField('dob', formData.dob);
    if (dobError) errors.dob = dobError;

    const imageError = validateField('image', formData.image);
    if (imageError) errors.image = imageError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      const error = validateField(field, value, updated);
      setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
      return updated;
    });
  }, [validateField, setFormData]);

  const handleSubmitWithValidation = useCallback((e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please check the input fields again', 'error');
      return;
    }
    handleSubmit(e);
  }, [validateForm, handleSubmit, showToast]);

  const editProfileColumns = [
    {
      className: "md:col-span-1 flex flex-col items-center justify-start pt-4",
      fields: [
        {
          name: "image",
          render: () => (
            <React.Fragment key="profile-image-upload">
              <div className="relative group">
                <div className={`w-28 h-28 rounded-full p-1 bg-white border-2 ${validationErrors.image ? 'border-red-500' : 'border-gray-300 shadow-sm'}`}>
                  <img
                    src={previewUrl || formData.image || "https://via.placeholder.com/128x128?text=User"}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/128x128?text=User"; }}
                  />
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-9 h-9 bg-amber-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg hover:bg-amber-600 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => {
                  handleFileChange(e);
                  if (e.target.files?.length > 0) {
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      delete next.image;
                      return next;
                    });
                  }
                }}
              />
              {validationErrors.image && (
                <p className="mt-2 text-xs font-bold text-red-500 uppercase tracking-wider text-center">{validationErrors.image}</p>
              )}
            </React.Fragment>
          )
        }
      ]
    },
    {
      className: "md:col-span-2 space-y-6",
      fields: [
        {
          name: "name",
          label: "Full Name",
          type: "text",
          required: true,
          value: formData.name ?? "",
          onChange: (e) => handleFieldChange("name", e.target.value),
          error: validationErrors.name,
          leftIcon: <Tag className="w-5 h-5" />
        },
        {
          name: "phone",
          label: "Phone Number",
          type: "text",
          required: true,
          value: formData.phone ?? "",
          onChange: (e) => handleFieldChange("phone", e.target.value),
          error: validationErrors.phone,
          leftIcon: <Phone className="w-5 h-5" />
        },
        {
          name: "address",
          label: "Address",
          type: "text",
          required: true,
          value: formData.address ?? "",
          onChange: (e) => handleFieldChange("address", e.target.value),
          error: validationErrors.address,
          leftIcon: <MapPin className="w-5 h-5" />
        },
        {
          name: "gender",
          label: "Gender",
          type: "select",
          value: formData.gender ?? "",
          onChange: (e) => handleFieldChange("gender", e.target.value),
          error: validationErrors.gender,
          placeholder: "Select Gender",
          options: ["Male", "Female", "Other"],
          leftIcon: <Users className="w-5 h-5" />
        },
        {
          name: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          value: formData.dob ?? "",
          onChange: (e) => handleFieldChange("dob", e.target.value),
          error: validationErrors.dob,
          leftIcon: <Calendar className="w-5 h-5" />
        }
      ]
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} maxWidth="max-w-3xl">
      <Modal.Header>Update Profile</Modal.Header>
      <Modal.Body>
        <Form
          onSubmit={handleSubmitWithValidation}
          columns={editProfileColumns}
          gridClassName="grid grid-cols-1 md:grid-cols-3 gap-6"
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
          onClick={handleSubmitWithValidation}
          disabled={loading}
          className="px-8 py-2.5 min-w-[120px] justify-center"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            'Save Changes'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
