import React, { useState, useContext, useCallback } from "react";
import { motion } from "framer-motion";
import Api from "../common/SummaryAPI";
import { useToast } from "../hooks/useToast";
import { AuthContext } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import ProductButton from "./ProductButton";

const ChangePasswordModal = ({ handleCancel }) => {
    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: "",
        repeatPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showPassword, setShowPassword] = useState({
        oldPassword: false,
        newPassword: false,
        repeatPassword: false,
    });

    const { user } = useContext(AuthContext);
    const { showToast } = useToast();

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    // Validate individual field
    const validateField = useCallback((name, value, currentFormData = form) => {
        switch (name) {
            case 'oldPassword': {
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                return null;
            }
            case 'newPassword': {
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                // Password validation: at least 8 characters and include three of four types
                if (value.length < 8) {
                    return 'Passwords must be at least 8 characters and include three of four types: uppercase, lowercase, number, or special';
                }
                const hasUpperCase = /[A-Z]/.test(value);
                const hasLowerCase = /[a-z]/.test(value);
                const hasNumber = /\d/.test(value);
                const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
                const characterTypesMet = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
                if (characterTypesMet < 3) {
                    return 'Passwords must be at least 8 characters and include three of four types: uppercase, lowercase, number, or special';
                }
                return null;
            }
            case 'repeatPassword':
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                if (value !== currentFormData.newPassword) {
                    return 'Repeated password does not match';
                }
                return null;
            default:
                return null;
        }
    }, [form]);

    // Validate form
    const validateForm = useCallback(() => {
        const errors = {};

        // Validate oldPassword
        const oldPasswordError = validateField('oldPassword', form.oldPassword);
        if (oldPasswordError) errors.oldPassword = oldPasswordError;

        // Validate newPassword
        const newPasswordError = validateField('newPassword', form.newPassword);
        if (newPasswordError) errors.newPassword = newPasswordError;

        // Validate repeatPassword
        const repeatPasswordError = validateField('repeatPassword', form.repeatPassword);
        if (repeatPasswordError) errors.repeatPassword = repeatPasswordError;

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [form, validateField]);

    // Handle field change with real-time validation
    const handleFieldChange = useCallback((field, value) => {
        setForm(prev => {
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
                // If changing newPassword, also revalidate repeatPassword
                if (field === 'newPassword') {
                    const repeatPasswordError = validateField('repeatPassword', updated.repeatPassword, updated);
                    if (repeatPasswordError) {
                        newErrors.repeatPassword = repeatPasswordError;
                    } else if (updated.repeatPassword) {
                        delete newErrors.repeatPassword;
                    }
                }
                return newErrors;
            });

            return updated;
        });
    }, [validateField]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Set loading immediately
        setLoading(true);

        // Validate form - this will set validationErrors
        if (!validateForm()) {
            // Show generic message since error messages are already displayed under each field
            showToast('Please check the input fields again', 'error');
            setLoading(false);
            return;
        }

        // Check if new password is different from old password
        if (form.oldPassword === form.newPassword) {
            setValidationErrors(prev => ({ ...prev, newPassword: 'New password must be different from old password' }));
            showToast('Please check the input fields again', 'error');
            setLoading(false);
            return;
        }

        try {
            await Api.accounts.changePassword(user._id, {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });
            showToast("Password changed successfully", "success", 2000);
            // Reset form
            setForm({
                oldPassword: "",
                newPassword: "",
                repeatPassword: "",
            });
            setValidationErrors({});
            handleCancel();
        } catch (err) {
            console.error("Change password error:", err.response || err.message);
            let errorMessage = "Failed to change password";

            // Handle API response errors
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            // Handle specific validation errors from backend
            if (err.response?.data?.message) {
                const backendMessage = errorMessage;
                if (backendMessage.includes('Please fill in all required fields') ||
                    backendMessage.toLowerCase().includes('fill in all required')) {
                    if (!form.oldPassword || !form.oldPassword.trim()) {
                        setValidationErrors(prev => ({ ...prev, oldPassword: 'Please fill in all required fields' }));
                    }
                    if (!form.newPassword || !form.newPassword.trim()) {
                        setValidationErrors(prev => ({ ...prev, newPassword: 'Please fill in all required fields' }));
                    }
                    if (!form.repeatPassword || !form.repeatPassword.trim()) {
                        setValidationErrors(prev => ({ ...prev, repeatPassword: 'Please fill in all required fields' }));
                    }
                    showToast("Please check the input fields again", "error");
                    setLoading(false);
                    return;
                } else if (backendMessage.includes('Current password is incorrect') ||
                    backendMessage.includes('Old password is incorrect')) {
                    setValidationErrors(prev => ({ ...prev, oldPassword: 'Old password is incorrect' }));
                    showToast("Please check the input fields again", "error");
                    setLoading(false);
                    return;
                } else if (backendMessage.includes('New password must be at least 8 characters') ||
                    backendMessage.includes('Password must include at least three') ||
                    backendMessage.includes('Passwords must be at least 8 characters')) {
                    setValidationErrors(prev => ({ ...prev, newPassword: 'Passwords must be at least 8 characters and include three of four types: uppercase, lowercase, number, or special' }));
                    showToast("Please check the input fields again", "error");
                    setLoading(false);
                    return;
                } else if (backendMessage.includes('New password must be different') ||
                    backendMessage.includes('same as old password')) {
                    setValidationErrors(prev => ({ ...prev, newPassword: 'New password must be different from old password' }));
                    showToast("Please check the input fields again", "error");
                    setLoading(false);
                    return;
                }
            }

            // Handle specific HTTP status codes
            if (err.response?.status === 401) {
                errorMessage = "You are not authorized to perform this action";
            } else if (err.response?.status === 403) {
                errorMessage = "Access denied";
            } else if (err.response?.status === 404) {
                errorMessage = "Service not available";
            } else if (err.response?.status >= 500) {
                errorMessage = "Server error. Please try again later.";
            }

            showToast(errorMessage, "error", 4000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 w-full max-w-md overflow-hidden flex flex-col"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-300 bg-gray-50">
                    <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
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
                <div className="p-6 lg:p-8 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {[
                            { label: "Current Password", key: "oldPassword" },
                            { label: "New Password", key: "newPassword" },
                            { label: "Confirm New Password", key: "repeatPassword" },
                        ].map((field) => (
                            <div key={field.key} className="relative">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    {field.label} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword[field.key] ? "text" : "password"}
                                        value={form[field.key]}
                                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                        className={`w-full pl-4 pr-11 py-3 bg-gray-50 border-2 rounded-xl transition-all outline-none ${validationErrors[field.key] ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-amber-400 focus:bg-white'}`}
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility(field.key)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword[field.key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {validationErrors[field.key] && (
                                    <p className="mt-1.5 text-xs font-bold text-red-500 uppercase tracking-wider">{validationErrors[field.key]}</p>
                                )}
                            </div>
                        ))}
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
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-2.5 min-w-[120px] justify-center"
                    >
                        {loading ? <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Updating...</span>
                        </div> : 'Update Password'}
                    </ProductButton>
                </div>
            </motion.div>
        </div>
    );
};

export default ChangePasswordModal;