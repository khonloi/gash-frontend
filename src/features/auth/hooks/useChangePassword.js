import { useState, useCallback, useContext } from 'react';
import Api from '../../../common/SummaryAPI';
import { useToast } from '../../../hooks/useToast';
import { AuthContext } from '../../../context/AuthContext';

export const useChangePassword = (onSuccess) => {
    const { user } = useContext(AuthContext);
    const { showToast } = useToast();

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

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const validateField = useCallback((name, value, currentFormData = form) => {
        switch (name) {
            case 'oldPassword': {
                if (!value || value.trim() === '') return 'Please fill in all required fields';
                return null;
            }
            case 'newPassword': {
                if (!value || value.trim() === '') return 'Please fill in all required fields';
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

    const validateForm = useCallback(() => {
        const errors = {};

        const oldPasswordError = validateField('oldPassword', form.oldPassword);
        if (oldPasswordError) errors.oldPassword = oldPasswordError;

        const newPasswordError = validateField('newPassword', form.newPassword);
        if (newPasswordError) errors.newPassword = newPasswordError;

        const repeatPasswordError = validateField('repeatPassword', form.repeatPassword);
        if (repeatPasswordError) errors.repeatPassword = repeatPasswordError;

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [form, validateField]);

    const handleFieldChange = useCallback((field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            const error = validateField(field, value, updated);

            setValidationErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                if (error) {
                    newErrors[field] = error;
                } else {
                    delete newErrors[field];
                }
                
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

        setLoading(true);

        if (!validateForm()) {
            showToast('Please check the input fields again', 'error');
            setLoading(false);
            return;
        }

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
            
            setForm({
                oldPassword: "",
                newPassword: "",
                repeatPassword: "",
            });
            setValidationErrors({});
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error("Change password error:", err.response || err.message);
            let errorMessage = "Failed to change password";

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

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

    return {
        form,
        loading,
        validationErrors,
        showPassword,
        handleFieldChange,
        togglePasswordVisibility,
        handleSubmit
    };
};
