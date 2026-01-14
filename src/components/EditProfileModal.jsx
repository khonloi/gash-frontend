import React, { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useToast } from "../hooks/useToast";
import { Camera, User, Tag, Phone, MapPin, Users, Calendar } from "lucide-react";
import ProductButton from "./ProductButton";

const EditProfileModal = ({
  formData,
  setFormData,
  previewUrl,
  handleFileChange,
  handleSubmit,
  handleCancel,
  selectedFile,
  profile,
  loading,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Validate individual field
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
        // Check if image is PNG or JPG when it's a URL
        if (currentFormData.image?.trim() && !selectedFile) {
          const imageUrl = currentFormData.image.trim().toLowerCase();
          if (!imageUrl.match(/\.(png|jpg|jpeg)$/i) && !imageUrl.startsWith('data:image/')) {
            return 'Please select a valid image type';
          }
        }
        // Check file type when a file is selected
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

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};

    // Validate name
    const nameError = validateField('name', formData.name);
    if (nameError) errors.name = nameError;

    // Validate phone
    const phoneError = validateField('phone', formData.phone);
    if (phoneError) errors.phone = phoneError;

    // Validate address
    const addressError = validateField('address', formData.address);
    if (addressError) errors.address = addressError;

    // Validate dob
    const dobError = validateField('dob', formData.dob);
    if (dobError) errors.dob = dobError;

    // Validate image
    const imageError = validateField('image', formData.image);
    if (imageError) errors.image = imageError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  // Handle field change with real-time validation
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Validate the current field with updated formData
      const error = validateField(field, value, updated);

      // Update errors
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

  // Wrapper for handleSubmit with validation
  const handleSubmitWithValidation = useCallback((e) => {
    e.preventDefault();

    // Validate form - this will set validationErrors
    if (!validateForm()) {
      // Show generic message since error messages are already displayed under each field
      showToast('Please check the input fields again', 'error');
      return;
    }

    // Call parent handleSubmit if validation passes
    handleSubmit(e);
  }, [validateForm, handleSubmit, showToast]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-300 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-200"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8">
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
              <p className="mt-2 text-xs font-bold text-red-500 uppercase tracking-wider">{validationErrors.image}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitWithValidation} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {[
                { label: "Full Name", type: "text", key: "name", required: true, icon: Tag },
                { label: "Phone Number", type: "text", key: "phone", required: true, icon: Phone },
                { label: "Address", type: "text", key: "address", required: true, icon: MapPin },
                { label: "Gender", type: "select", key: "gender", options: ["Male", "Female", "Other"], icon: Users },
                { label: "Date of Birth", type: "date", key: "dob", required: true, icon: Calendar },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    {field.type === "select" ? (
                      <select
                        value={formData[field.key] ?? ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 bg-gray-50 border-2 rounded-xl transition-all outline-none appearance-none ${validationErrors[field.key] ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-amber-400 focus:bg-white'}`}
                      >
                        {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key] ?? ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 bg-gray-50 border-2 rounded-xl transition-all outline-none ${validationErrors[field.key] ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-amber-400 focus:bg-white'}`}
                      />
                    )}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <field.icon className="w-5 h-5" />
                    </div>
                  </div>
                  {validationErrors[field.key] && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 uppercase tracking-wider">{validationErrors[field.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-300 flex items-center justify-end gap-3">
          <ProductButton
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
            className="px-6 py-2.5"
          >
            Cancel
          </ProductButton>
          <ProductButton
            variant="primary"
            onClick={handleSubmitWithValidation}
            disabled={loading}
            className="px-8 py-2.5 min-w-[120px] justify-center"
          >
            {loading ? <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </div> : 'Save Changes'}
          </ProductButton>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
