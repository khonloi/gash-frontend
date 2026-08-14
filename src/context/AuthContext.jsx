import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import axiosClient from '../common/axiosClient';
import { useNavigate } from 'react-router-dom';
import { ToastContext } from './ToastContext';
import { disconnectSocket } from '../common/socketManager';
import { storage } from '../utils/storage';

export const AuthContext = createContext();

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const sessionTimerRef = useRef(null);

  const clearSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const handleForcedLogout = useCallback((message) => {
    clearSessionTimer();
    disconnectSocket();
    showToast(message, 'error');
    storage.clearAuthSession();
    setUser(null);
    navigate('/login');
  }, [clearSessionTimer, navigate, showToast]);

  const isDemoMode = import.meta.env.VITE_APP_USE_MOCK === 'true';

  const startSessionTimer = useCallback((loginTimeMs) => {
    clearSessionTimer();
    if (isDemoMode) return;

    const currentTime = Date.now();
    const timeElapsed = currentTime - loginTimeMs;

    if (timeElapsed >= SESSION_DURATION) {
      handleForcedLogout('Your session has expired. You will be logged out.');
    } else {
      const remainingTime = SESSION_DURATION - timeElapsed;
      sessionTimerRef.current = setTimeout(() => {
        handleForcedLogout('Your session has expired. You will be logged out.');
      }, remainingTime);
    }
  }, [clearSessionTimer, handleForcedLogout, isDemoMode]);

  // Initial session hydration on mount
  useEffect(() => {
    const token = storage.getToken();
    const storedUser = storage.getStoredUser();
    const loginTime = storage.getLoginTime();

    if (token && storedUser) {
      try {
        setUser(storedUser);

        if (loginTime) {
          startSessionTimer(parseInt(loginTime, 10));
        }
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        storage.clearAuthSession();
      }
    }
    setIsAuthLoading(false);

    return () => clearSessionTimer();
  }, [startSessionTimer, clearSessionTimer]);

  // Axios response interceptor to handle session expiry or suspension
  useEffect(() => {
    const interceptor = axiosClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const msg = error.response.data?.message || '';
          if (status === 401 || (status === 403 && msg.includes('inactive'))) {
            if (storage.getToken()) {
              const logoutMessage = status === 401
                ? 'Your session has expired or token is invalid. You will be logged out.'
                : 'Your account has been suspended or deactivated. You will be logged out.';
              handleForcedLogout(logoutMessage);
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axiosClient.interceptors.response.eject(interceptor);
  }, [handleForcedLogout]);

  // Polling to check account status every 1 minute
  useEffect(() => {
    let interval;
    if (user && !isDemoMode) {
      interval = setInterval(async () => {
        try {
          await axiosClient.get('/auth/check-status');
        } catch {
          // Interceptor will handle logout if 401 / 403
        }
      }, 60000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, isDemoMode]);

  const saveAuthSession = useCallback((token, account) => {
    const loginTime = Date.now();
    storage.setToken(token);
    storage.setStoredUser(account);
    storage.setLoginTime(loginTime);
    setUser(account);
    startSessionTimer(loginTime);
  }, [startSessionTimer]);

  const login = async (username, password) => {
    try {
      const response = await axiosClient.post('/auth/login', {
        username,
        password,
      });

      const { token, account } = response.data;
      saveAuthSession(token, account);
      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const googleLogin = async (token) => {
    try {
      const response = await axiosClient.post('/auth/google-login', { token });
      const { token: jwtToken, account } = response.data;
      saveAuthSession(jwtToken, account);
      showToast('Google logged in successfully', 'success');
      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Google login failed.';
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
      const msg = error.response?.data?.message || error.message || 'Failed to send OTP.';
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
        showToast('OTP resent successfully', 'info');
        return response;
      }

      let response;
      if (type === 'register') {
        response = await axiosClient.post('/auth/register/verify-otp', { email, otp });
      } else if (type === 'forgot-password') {
        response = await axiosClient.post('/auth/forgot-password/verify-otp', { email, otp });
      }

      showToast('OTP verified successfully', 'success');
      return response;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Invalid or expired OTP.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const signup = async (formData) => {
    try {
      const response = await axiosClient.post('/auth/register', { ...formData });
      const { token, account } = response.data;
      saveAuthSession(token, account);
      showToast('Account created successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message);
      const msg = error.response?.data?.message || error.message || 'Signup failed. Please try again.';
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
      showToast('Password reset successfully', 'success');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to reset password.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const passkeyLogin = async (username) => {
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');

      // Step 1: Get authentication options from server
      const response = await axiosClient.post('/passkeys/auth/generate', { username });
      const { options } = response.data;

      // Step 2: Start authentication with browser
      const authenticationResponse = await startAuthentication(options);

      // Step 3: Verify authentication with server
      const verifyResponse = await axiosClient.post('/passkeys/auth/verify', {
        username,
        ...authenticationResponse,
        challenge: options.challenge,
      });

      const { token, account } = verifyResponse.data;
      saveAuthSession(token, account);
      showToast('Passkey logged in successfully', 'success');
      navigate('/');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Passkey login failed. Please try again.';
      showToast(msg, 'error');
      throw error;
    }
  };

  const logout = () => {
    if (isDemoMode) {
      showToast("This page is running in demo mode. To fully explore the project, please clone it and run it locally.", 'info');
      return;
    }

    clearSessionTimer();
    disconnectSocket();
    storage.clearAuthSession();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthLoading,
        login,
        googleLogin,
        passkeyLogin,
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