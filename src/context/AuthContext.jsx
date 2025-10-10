import React, { createContext, useState, useEffect } from 'react';
import axiosClient from '../common/axiosClient';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleSessionExpired = () => {
    alert('Your session has expired. You will be logged out.');
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
  }, []);

  useEffect(() => {
    const interceptor = axiosClient.interceptors.response.use(
      (response) => response,
      (error) => {
        // Only trigger session expired if user is logged in (token exists)
        if (error.response?.status === 401 && localStorage.getItem('token')) {
          handleSessionExpired();
        }
        return Promise.reject(error);
      }
    );

    return () => axiosClient.interceptors.response.eject(interceptor);
  }, []);

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

      setTimeout(() => {
        handleSessionExpired();
      }, 24 * 60 * 60 * 1000); // 1 day

      navigate('/');
    } catch (error) {
      throw error;
    }
  };

  const googleLogin = async (token) => {
    try {
      const response = await axios.post('http://localhost:5000/auth/google-login', {
        token,
      });

      const { token: jwtToken, account } = response.data;
      const loginTime = Date.now().toString();

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(account));
      localStorage.setItem('loginTime', loginTime);
      setUser(account);

      setTimeout(() => {
        handleSessionExpired();
      }, 24 * 60 * 60 * 1000); // 1 day

      navigate('/');
    } catch (error) {
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
      return response;
    } catch (error) {
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
        return response;
      }

      if (type === 'register') {
        const response = await axiosClient.post('/auth/register/verify-otp', {
          email,
          otp,
        });
        return response;
      } else if (type === 'forgot-password') {
        const response = await axiosClient.post('/auth/forgot-password/verify-otp', {
          email,
          otp,
        });
        return response;
      }
    } catch (error) {
      throw error;
    }
  };

  const signup = async (formData) => {
    try {
      console.log('🚀 Sending signup request to backend:', formData);
      const response = await axiosClient.post('/auth/register', {
        ...formData,
      });
      console.log('✅ Backend response:', response.data);
      const { token, account } = response.data;
      const loginTime = Date.now().toString();

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(account));
      localStorage.setItem('loginTime', loginTime);
      setUser(account);

      setTimeout(() => {
        handleSessionExpired();
      }, 24 * 60 * 60 * 1000); // 1 day

      navigate('/');
    } catch (error) {
      console.error('❌ Signup error:', error.response?.data || error.message);
      throw error;
    }
  };

  const resetPassword = async ({ email, newPassword }) => {
    try {
      await axiosClient.post('/auth/forgot-password/reset', {
        email,
        newPassword,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    setUser(null);
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