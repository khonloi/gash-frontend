import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import emailjs from '@emailjs/browser';
import ProductButton from '../components/ProductButton';
import '../styles/Signup.css';

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
          showToast(`OTP sent successfully!`, 'success', 5000);
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
    <div className="signup-container">
      <div className="signup-box">
        <h1 className="signup-title">Create Account</h1>
        {/* ...global toast handled by ToastProvider... */}
        <form
          className="signup-form"
          onSubmit={handleSubmit}
          aria-describedby={error ? 'error-message' : undefined}
          aria-label="Signup form"
        >
          <div className="signup-form-group">
            <label htmlFor="email" className="signup-form-label">
              Email <span className="signup-required-indicator">*</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              ref={emailRef}
              required
              className="signup-form-input"
              aria-required="true"
              aria-invalid={!!error}
              placeholder="Enter your email"
            />
          </div>
          <ProductButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full"
          >
            <span aria-live="polite">
              {isLoading ? 'Sending OTP...' : 'Continue'}
            </span>
          </ProductButton>
        </form>
        <p className="signup-login-prompt">
          Already have an account?{' '}
          <Link to="/login" className="signup-login-link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;