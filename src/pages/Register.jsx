import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Api from '../common/SummaryAPI';
import ProductButton from '../components/ProductButton';

const Register = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: location.state?.formData?.username || '',
    name: location.state?.formData?.name || '',
    email: location.state?.email || '',
    phone: location.state?.formData?.phone || '',
    address: location.state?.formData?.address || '',
    gender: location.state?.formData?.gender || '',
    dob: location.state?.formData?.dob || '',
    password: location.state?.formData?.password || '',
    repeatPassword: location.state?.formData?.repeatPassword || '',
    role: 'user',
    acc_status: 'active',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [invalidFile, setInvalidFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = React.useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const usernameRef = useRef(null);

  useEffect(() => {
    if (!location.state?.email) {
      navigate('/signup');
    }
    usernameRef.current?.focus();
  }, [location.state, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file.", "error", 3000);
        setInvalidFile(true);
        setSelectedFile(null);
        setPreviewUrl("");
        return;
      }
      setInvalidFile(false);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setInvalidFile(false);
      setSelectedFile(null);
      setPreviewUrl("");
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validateForm = useCallback(() => {
    const username = formData.username.trim();
    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const address = formData.address.trim();
    const password = formData.password.trim();
    const repeatPassword = formData.repeatPassword.trim();

    console.log('🔍 Form validation:', {
      username: username.length,
      name: name.length,
      email: email,
      phone: phone,
      address: address.length,
      password: password.length,
      repeatPassword: repeatPassword.length,
      invalidFile
    });

    if (username.length < 3 || username.length > 30) return 'Username must be between 3 and 30 characters';
    if (name && name.length > 50) return 'Name cannot exceed 50 characters';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email address';
    if (phone && !/^\d{10}$/.test(phone)) return 'Phone number must be exactly 10 digits';
    if (address && address.length > 100) return 'Address cannot exceed 100 characters';
    
    // Password validation: at least 8 characters, at least 3 of 4 character types
    if (password.length < 8) return 'Password must be at least 8 characters long';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const characterTypesMet = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (characterTypesMet < 3) {
      return 'Password must include at least three of: uppercase letter, lowercase letter, number, special character';
    }
    
    if (password !== repeatPassword) return 'Passwords do not match';
    if (invalidFile) return 'Please select a valid image file';
    return '';
  }, [formData, invalidFile]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const validationError = validateForm();
      if (validationError) {
        showToast(validationError, 'error', 3000);
        usernameRef.current?.focus();
        return;
      }
      setIsLoading(true);

      try {
        // Skip image upload for now to debug register issue
        let imageUrl = '';
        if (selectedFile) {
          console.log('⚠️ Skipping image upload for debugging');
          // const uploadResponse = await Api.upload.image(selectedFile);
          // imageUrl = uploadResponse.data?.url;
          // if (!imageUrl) {
          //   throw new Error('Upload completed but server did not return URL');
          // }
          // showToast('Image uploaded successfully!', 'success', 2000);
        }

        // Filter out fields that backend doesn't expect
        const { repeatPassword, role, acc_status, ...filteredFormData } = formData;
        
        const signupData = {
          ...filteredFormData,
          image: imageUrl,
        };

        console.log('📝 Signup data being sent:', signupData);
        await signup(signupData);
        showToast('Account created successfully!', 'success', 2000);
        navigate('/');
      } catch (err) {
        console.error('❌ Register error details:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          config: err.config
        });
        
        let errorMessage = 'Failed to create account. Please try again.';
        if (err.response?.status === 400) {
          errorMessage = err.response.data.message || 'Invalid input data';
        } else if (err.response?.status === 409) {
          errorMessage = 'Username or email already exists';
        } else if (err.response?.data?.errors) {
          errorMessage = err.response.data.errors[0]?.msg || errorMessage;
        } else if (err.message === 'Upload completed but server did not return URL') {
          errorMessage = err.message;
        } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check if backend is running.';
        }
        showToast(errorMessage, 'error', 4000);
        usernameRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [formData, selectedFile, invalidFile, signup, navigate, validateForm, showToast]
  );

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto min-h-[calc(100vh-6rem)] p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-2xl shadow-md">
        <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-center text-gray-900">
          Complete Your Registration
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {[
            { id: 'username', label: 'Username', type: 'text', required: true, maxLength: 30 },
            { id: 'name', label: 'Full Name', type: 'text', required: true, maxLength: 50 },
            { id: 'email', label: 'Email', type: 'email', required: true, readOnly: true },
            { id: 'phone', label: 'Phone', type: 'text', required: true, maxLength: 10 },
            { id: 'address', label: 'Address', type: 'text', required: true, maxLength: 100 },
            { id: 'gender', label: 'Gender', type: 'select', required: false, options: ['Male', 'Female', 'Other'] },
            { id: 'dob', label: 'Date of Birth', type: 'date', required: false },
            { id: 'image', label: 'Profile Image (Optional)', type: 'file', required: false },
            { id: 'password', label: 'Password', type: 'password', required: true },
            { id: 'repeatPassword', label: 'Repeat Password', type: 'password', required: true },
          ].map(({ id, label, type, required, maxLength, readOnly, options }) => (
            <fieldset key={id} className="flex flex-col">
              <label htmlFor={id} className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
                {label} {required && <span className="text-red-600">*</span>}
              </label>
              {id === 'image' ? (
                <div className="flex flex-col gap-2">
                  <input
                    id="signup-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    aria-required={required}
                    aria-invalid={invalidFile}
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img src={previewUrl} alt="Preview" className="max-w-[120px] max-h-[120px] rounded-lg object-cover border-2 border-gray-300" />
                    </div>
                  )}
                </div>
              ) : type === 'select' ? (
                <select
                  id={id}
                  name={id}
                  value={formData[id]}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  aria-required={required}
                >
                  <option value="">Select {label}</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  type={type}
                  name={id}
                  value={formData[id]}
                  onChange={handleChange}
                  ref={id === 'username' ? usernameRef : null}
                  required={required}
                  maxLength={maxLength}
                  readOnly={readOnly}
                  className={`p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed ${readOnly ? 'bg-gray-100' : ''}`}
                  aria-required={required}
                />
              )}
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
            {isLoading ? 'Creating Account...' : 'Create your GASH account'}
          </ProductButton>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4 sm:mt-5">
          Already have an account?{' '}
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

export default Register;