import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ProductButton from '../components/ProductButton';

const ResetPassword = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    otp: location.state?.otp || '',
    newPassword: '',
    repeatPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = React.useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const passwordRef = useRef(null);

  useEffect(() => {
    if (!location.state?.email || !location.state?.otp) {
      navigate('/forgot-password');
    }
    passwordRef.current?.focus();
  }, [location.state, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validateForm = useCallback(() => {
    const newPassword = formData.newPassword.trim();
    const repeatPassword = formData.repeatPassword.trim();
    
    if (newPassword.length < 8) return 'Password must be at least 8 characters long';
    
    // Password validation: at least 3 of 4 character types
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    const characterTypesMet = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (characterTypesMet < 3) {
      return 'Password must include at least three of: uppercase letter, lowercase letter, number, special character';
    }
    
    if (newPassword !== repeatPassword) return 'Passwords do not match';
    return '';
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const validationError = validateForm();
      if (validationError) {
        showToast(validationError, 'error', 3000);
        passwordRef.current?.focus();
        return;
      }
      setIsLoading(true);
      try {
        await resetPassword({
          email: formData.email,
          newPassword: formData.newPassword,
        });
        showToast('Password reset successfully. You can now log in.', 'success', 3000);
        setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        let errorMessage = 'Failed to reset password. Please try again.';
        if (err.response?.status === 400) {
          errorMessage = err.response.data.message || 'Invalid input data';
        } else if (err.response?.status === 404) {
          errorMessage = err.response.data.message || 'No account found with this email';
        } else if (err.response?.data?.errors) {
          errorMessage = err.response.data.errors[0]?.msg || errorMessage;
        }
        showToast(errorMessage, 'error', 3000);
        passwordRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [formData, resetPassword, navigate, validateForm, showToast]
  );

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto min-h-[calc(100vh-6rem)] p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-md shadow-sm border border-gray-200">
        <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-center text-gray-900">
          Reset Your Password
        </h1>
        
        <p className="text-sm text-gray-600 mb-4 sm:mb-5 text-center">
          Enter a new password for {formData.email}
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5"
        >
          {[
            { id: 'newPassword', label: 'New Password', type: 'password', required: true },
            { id: 'repeatPassword', label: 'Repeat Password', type: 'password', required: true },
          ].map(({ id, label, type, required }) => (
            <fieldset key={id} className="flex flex-col">
              <label htmlFor={id} className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                {label} <span className="text-red-600">*</span>
              </label>
              <input
                id={id}
                type={type}
                name={id}
                value={formData[id]}
                onChange={handleChange}
                ref={id === 'newPassword' ? passwordRef : null}
                required={required}
                className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                aria-required={required}
              />
            </fieldset>
          ))}
          
          <ProductButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full"
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </ProductButton>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4 sm:mt-5">
          Remember your password?{' '}
          <Link 
            to="/login" 
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 rounded"
          >
            Sign In
          </Link>
        </p>
      </section>
    </div>
  );
};

export default ResetPassword;