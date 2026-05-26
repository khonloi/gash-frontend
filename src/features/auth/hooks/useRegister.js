import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../hooks/useToast';
import Api from '../../../common/SummaryAPI';

export const useRegister = () => {
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
    accountStatus: 'active',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [invalidFile, setInvalidFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const usernameRef = useRef(null);

  useEffect(() => {
    if (!location.state?.email) {
      navigate('/signup');
    }
    usernameRef.current?.focus();
  }, [location.state, navigate]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        showToast("Profile Image must be a PNG or JPG image URL", "error", 3000);
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
  }, [showToast]);

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

    // Check required fields
    if (!username || !name || !email || !phone || !address || !password || !repeatPassword) {
      return 'Please fill in all required fields';
    }

    if (username.length < 5 || username.length > 30) return 'Username must be between 5 and 30 characters';
    if (name.length < 1 || name.length > 50) return 'Fullname must be between 1 and 50 characters';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email address';
    if (!/^\d{10}$/.test(phone)) return 'Phone must be exactly 10 digits';
    if (address.length > 200) return 'Address must be at most 200 characters';

    // Password validation: at least 8 characters, at least 3 of 4 character types
    if (password.length < 8) {
      return 'Passwords must be at least 8 characters and include three of four types: uppercase, lowercase, number, or special';
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const characterTypesMet = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;

    if (characterTypesMet < 3) {
      return 'Passwords must be at least 8 characters and include three of four types: uppercase, lowercase, number, or special';
    }

    if (password !== repeatPassword) return 'Repeat password does not match';
    if (invalidFile) return 'Profile Image must be a PNG or JPG image URL';
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
          // const uploadResponse = await Api.upload.image(selectedFile);
          // imageUrl = uploadResponse.data?.url;
          // if (!imageUrl) {
          //   throw new Error('Upload completed but server did not return URL');
          // }
          // showToast('Image uploaded successfully', 'success', 2000);
        }

        // Filter out fields that backend doesn't expect
        const { ...filteredFormData } = formData;

        const signupData = {
          ...filteredFormData,
          image: imageUrl,
        };

        await signup(signupData);
        showToast('Register successfully', 'success', 2000);

        navigate('/');
      } catch (err) {
        console.error('Register error details:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          config: err.config
        });

        let errorMessage = 'Failed to create account. Please try again.';
        if (err.response?.status === 400) {
          errorMessage = err.response.data.message || 'Invalid input data';
        } else if (err.response?.status === 409) {
          errorMessage = 'Username already exists';
        } else if (err.response?.data?.errors) {
          errorMessage = err.response.data.errors[0]?.msg || errorMessage;
        } else if (err.message === 'Upload completed but server did not return URL') {
          errorMessage = err.message;
        } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error') || !err.response) {
          errorMessage = 'Failed to register. Please try again later.';
        }
        showToast(errorMessage, 'error', 4000);
        usernameRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [formData, selectedFile, invalidFile, signup, navigate, validateForm, showToast]
  );

  return {
    formData,
    isLoading,
    invalidFile,
    previewUrl,
    usernameRef,
    handleChange,
    handleFileChange,
    handleSubmit
  };
};
