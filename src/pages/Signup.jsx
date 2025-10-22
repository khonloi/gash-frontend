import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import emailjs from '@emailjs/browser';

// Initialize EmailJS with Public API Key
const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

if (!emailJsPublicKey) {
  console.error('EmailJS Public Key is missing. Please check .env file.');
} else {
  emailjs.init(emailJsPublicKey);
  console.log('EmailJS initialized with Public Key:', emailJsPublicKey);
}

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    phone: '',
    address: '',
    password: '',
    repeatPassword: '',
    image: '',
    role: 'user',
    acc_status: 'active',
  });
  const [error, setError] = useState(''); // Only for input error highlighting
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { requestSignupOTP } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const emailRef = useRef(null);

  // Focus email input on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      // Only clear local error for input highlighting
    }
  }, [error]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log('Input Change:', { name, value });
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  }, []);

  // Validate email
  const validateEmail = useCallback(() => {
    const { email } = formData;
    if (!email.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email address';
    return '';
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const validationError = validateEmail();
      if (validationError) {
        setError(validationError);
        showToast(validationError, 'error', 5000);
        emailRef.current?.focus();
        return;
      }

      setIsLoading(true);
      try {
        // Log EmailJS configuration
        console.log('Public Key:', emailJsPublicKey);
        console.log('Service ID:', emailJsServiceId);
        console.log('Template ID:', emailJsTemplateId);
        console.log('formData.email:', formData.email);

        // Request OTP from backend
        const response = await requestSignupOTP(formData.email);
        const { otp } = response.data;
        console.log('Backend OTP Response:', response.data);

        // Validate and prepare template parameters
        const templateParams = {
          to_email: formData.email.trim(),
          otp: otp,
        };
        console.log('Template Params:', templateParams);

        if (!templateParams.to_email) {
          throw new Error('Recipient email is empty');
        }
        if (!templateParams.otp) {
          throw new Error('OTP is missing');
        }

        // For development: Skip EmailJS and show OTP in console
        if (!emailJsPublicKey || emailJsPublicKey === 'your_emailjs_public_key_here') {
          console.log('📧 OTP for development:', otp);
          showToast(`OTP sent successfully! Check console for OTP: ${otp}`, 'success', 5000);
        } else {
          // Send OTP email via EmailJS
          const emailjsResponse = await emailjs.send(
            emailJsServiceId,
            emailJsTemplateId,
            templateParams
          );
          console.log('EmailJS Success:', emailjsResponse);
          showToast('OTP sent successfully!', 'success', 3000);
        }
        
        navigate('/otp-verification', {
          state: { email: formData.email, type: 'register', formData },
        });
      } catch (err) {
        console.error('Error:', err.status, err.text || err.message);
        let errorMsg = '';
        if (err.status === 422) {
          errorMsg = 'Failed to send OTP: Invalid email configuration. Please check your email and try again.';
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else {
          errorMsg = err.message || 'Failed to send OTP. Please try again.';
        }
        setError(errorMsg);
        showToast(errorMsg, 'error', 5000);
        emailRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [formData, requestSignupOTP, navigate, validateEmail]
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white flex items-center justify-center px-4 sm:px-0">
      <div className="w-full max-w-[360px] p-6 bg-white border-2 border-gray-300 rounded-lg shadow-md">
        <h1 className="text-2xl font-normal text-gray-900 mb-5 text-center">Create Account</h1>
        {error && (
          <div
            className="bg-red-50 text-red-600 border-2 border-red-200 rounded-lg p-3 mb-4 text-sm text-center flex items-center gap-2"
            role="alert"
            aria-live="assertive"
            id="error-message"
          >
            <span className="text-lg" aria-hidden="true">⚠</span>
            {error}
          </div>
        )}
        <form
          className="flex flex-col"
          onSubmit={handleSubmit}
          aria-describedby={error ? 'error-message' : undefined}
          aria-label="Signup form"
        >
          <div className="mb-4">
            <label htmlFor="email" className="text-sm text-gray-900 mb-1 block">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              ref={emailRef}
              required
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 placeholder-opacity-70 hover:bg-gray-50 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 aria-invalid:border-red-500"
              aria-required="true"
              aria-invalid={!!error}
              placeholder="Enter your email"
            />
          </div>
          <button
            type="submit"
            className="w-full px-3 py-2.5 bg-yellow-400 border-2 border-yellow-600 rounded-xl text-sm font-semibold text-gray-900 hover:bg-yellow-300 hover:border-yellow-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            <span aria-live="polite">
              {isLoading ? 'Sending OTP...' : 'Continue'}
            </span>
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:text-orange-600 hover:underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;