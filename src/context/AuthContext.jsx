import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../common/axiosClient';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from './ToastContext'; // Import ToastContext

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext); // Get showToast

  const handleSessionExpired = () => {
    showToast('Your session has expired. You will be logged out.', 'error');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    setUser(null);
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const loginTime = localStorage.getItem('loginTime');

    if (token && storedUser && loginTime) {
      const currentTime = Date.now();
      const sessionDuration = 24 * 60 * 60 * 1000; // 1 day
      const timeElapsed = currentTime - parseInt(loginTime);

      if (timeElapsed >= sessionDuration) {
        handleSessionExpired();
      } else {
        setUser(JSON.parse(storedUser));
        const remainingTime = sessionDuration - timeElapsed;
        setTimeout(() => {
          handleSessionExpired();
        }, remainingTime);
      }
    }
  }, [showToast]);

  useEffect(() => {
    const interceptor = axiosClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && localStorage.getItem('token')) {
          handleSessionExpired();
        }
        return Promise.reject(error);
      }
    );

    return () => axiosClient.interceptors.response.eject(interceptor);
  }, [showToast]);

  const login = async (username, password) => {
    try {
      const response = await axiosClient.post('/auth/login', {
        username,
        password,
      });

      const { token, account } = response.data;
      const loginTime = Date.now().toString();

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(account));
      localStorage.setItem('loginTime', loginTime);
      setUser(account);

      showToast('Login successful!', 'success');

      setTimeout(() => {
        handleSessionExpired();
      }, 24 * 60 * 60 * 1000);

      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const googleLogin = async (token) => {
    try {
      const response = await axiosClient.post('/auth/google-login', {
        token,
      });

      const { token: jwtToken, account } = response.data;
      const loginTime = Date.now().toString();

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(account));
      localStorage.setItem('loginTime', loginTime);
      setUser(account);

      showToast('Google login successful!', 'success');

      setTimeout(() => {
        handleSessionExpired();
      }, 24 * 60 * 60 * 1000);

      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.message || 'Google login failed.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const requestSignupOTP = async (email, type = 'register') => {
    try {
      const endpoint =
        type === 'register'
          ? '/auth/register/request-otp'
          : '/auth/forgot-password/request-otp';
      const response = await axiosClient.post(endpoint, { email });
      showToast('OTP sent to your email.', 'info');
      return response;
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send OTP.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const verifyOTP = async (email, otp, formData, type, resend = false) => {
    try {
      if (resend) {
        const endpoint =
          type === 'register'
            ? '/auth/register/request-otp'
            : '/auth/forgot-password/request-otp';
        const response = await axiosClient.post(endpoint, { email });
        showToast('OTP resent successfully.', 'info');
        return response;
      }

      let response;
      if (type === 'register') {
        response = await axiosClient.post('/auth/register/verify-otp', { email, otp });
      } else if (type === 'forgot-password') {
        response = await axiosClient.post('/auth/forgot-password/verify-otp', { email, otp });
      }

      showToast('OTP verified successfully.', 'success');
      return response;
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid or expired OTP.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const signup = async (formData) => {
    try {
      console.log('Sending signup request to backend:', formData);
      const response = await axiosClient.post('/auth/register', { ...formData });
      console.log('Backend response:', response.data);

      const { token, account } = response.data;
      const loginTime = Date.now().toString();

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(account));
      localStorage.setItem('loginTime', loginTime);
      setUser(account);

      showToast('Account created successfully!', 'success');

      setTimeout(() => {
        handleSessionExpired();
      }, 24 * 60 * 60 * 1000);

      navigate('/');
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Signup failed. Please try again.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const resetPassword = async ({ email, newPassword }) => {
    try {
      await axiosClient.post('/auth/forgot-password/reset', {
        email,
        newPassword,
      });
      showToast('Password reset successfully!', 'success');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset password.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    setUser(null);
    showToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        googleLogin,
        requestSignupOTP,
        verifyOTP,
        signup,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};