import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import emailjs from '@emailjs/browser';
import Button from '../../components/ui/Button';
import Form from '../../components/ui/Form';


// Initialize EmailJS with Public API Key
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

if (!publicKey) {
  console.error('EmailJS Public Key is missing. Please check .env file.');
} else {
  emailjs.init(publicKey);

}

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { requestSignupOTP } = React.useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleChange = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  const validateEmail = useCallback(() => {
    if (!email.trim()) return 'Please fill in all required fields';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Invalid email address';
    return '';
  }, [email]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const validationError = validateEmail();
      if (validationError) {
        showToast(validationError, 'error', 5000);
        emailRef.current?.focus();
        return;
      }

      setIsLoading(true);
      try {
        const response = await requestSignupOTP(email, 'forgot-password');
        const { otp } = response.data;

        const templateParams = {
          to_email: email.trim(),
          otp: otp,
        };

        if (!templateParams.to_email) {
          throw new Error('Recipient email is empty');
        }
        if (!templateParams.otp) {
          throw new Error('OTP is missing');
        }

        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          templateParams
        );

        showToast('OTP sent successfully', 'success', 3000);

        navigate('/otp-verification', {
          state: { email, type: 'forgot-password' },
        });
      } catch (err) {
        console.error('Error:', err.status, err.text || err.message);
        let errorMsg = '';
        if (err.status === 422) {
          errorMsg = 'Failed to send OTP: Invalid email configuration. Please check your email and try again.';
        } else if (err.response?.status === 404 || err.response?.data?.message?.includes('No account found')) {
          errorMsg = 'No account found with this email';
        } else if (err.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else {
          errorMsg = err.message || 'Failed to send OTP. Please try again.';
        }
        showToast(errorMsg, 'error', 5000);
        emailRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [email, requestSignupOTP, navigate, validateEmail, showToast]
  );

  const fields = [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      value: email,
      onChange: handleChange,
      placeholder: 'Enter your email',
      inputProps: {
        ref: emailRef
      }
    }
  ];

  return (
    <div className="page-container flex flex-col items-center justify-center w-full">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-sm shadow-sm border border-gray-200">
        <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-center text-gray-900">
          Reset Your Password
        </h1>

        <p className="text-sm text-gray-600 mb-4 sm:mb-5 text-center">
          Enter your email address to receive a password reset OTP.
        </p>

        <Form
          onSubmit={handleSubmit}
          fields={fields}
          submitText={isLoading ? 'Sending OTP...' : 'Continue'}
          isLoading={isLoading}
          aria-label="Forgot Password form"
        />

        <p className="text-center text-sm text-gray-600 mt-4 sm:mt-5">
          Remember your password?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors focus:outline-none rounded"
          >
            Sign In
          </Link>
        </p>
      </section>
    </div>
  );
};

export default ForgotPassword;
