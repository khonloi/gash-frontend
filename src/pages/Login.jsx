import React, { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "../hooks/useToast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { LOGIN_ERROR_MESSAGES, ERROR_TIMEOUT } from "../constants/constants";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState(""); // Only for input error highlighting
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const errorRef = useRef(null);
  const usernameRef = useRef(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  const from = location.state?.from || "/";

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const { username, password } = formData;
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      if (!trimmedUsername || !trimmedPassword) {
        setError(LOGIN_ERROR_MESSAGES.EMPTY_FIELDS);
        showToast(LOGIN_ERROR_MESSAGES.EMPTY_FIELDS, "error", ERROR_TIMEOUT);
        usernameRef.current?.focus();
        return;
      }
      if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        setError('Username must be between 3 and 30 characters.');
        showToast('Username must be between 3 and 30 characters.', "error", ERROR_TIMEOUT);
        usernameRef.current?.focus();
        return;
      }
      if (trimmedPassword.length < 8) {
        setError('Password must be at least 8 characters long.');
        showToast('Password must be at least 8 characters long.', "error", ERROR_TIMEOUT);
        usernameRef.current?.focus();
        return;
      }

      setIsLoading(true);
      try {
        await login(trimmedUsername, trimmedPassword);
        showToast('Login successful!', 'success', ERROR_TIMEOUT);
        navigate(from, { replace: true });
      } catch (err) {
        const errorMessage =
          err.response?.status === 401
            ? LOGIN_ERROR_MESSAGES.INVALID_CREDENTIALS
            : LOGIN_ERROR_MESSAGES.LOGIN_FAILED;
        setError(errorMessage);
        showToast(errorMessage, "error", ERROR_TIMEOUT);
        usernameRef.current?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [formData, login, navigate, from]
  );

  const handleGoogleSuccess = useCallback(
    async (credentialResponse) => {
      if (!credentialResponse.credential) {
        setError(LOGIN_ERROR_MESSAGES.GOOGLE_FAILED);
        showToast(LOGIN_ERROR_MESSAGES.GOOGLE_FAILED, "error", ERROR_TIMEOUT);
        return;
      }

      setIsLoading(true);
      try {
        await googleLogin(credentialResponse.credential);
        showToast('Login successful!', 'success', ERROR_TIMEOUT);
        navigate(from, { replace: true });
      } catch (err) {
        setError(LOGIN_ERROR_MESSAGES.GOOGLE_FAILED);
        showToast(LOGIN_ERROR_MESSAGES.GOOGLE_FAILED, "error", ERROR_TIMEOUT);
      } finally {
        setIsLoading(false);
      }
    },
    [googleLogin, navigate, from]
  );

  const handleGoogleError = useCallback(() => {
    setError(LOGIN_ERROR_MESSAGES.GOOGLE_FAILED);
    showToast(LOGIN_ERROR_MESSAGES.GOOGLE_FAILED, "error", ERROR_TIMEOUT);
  }, [showToast]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white flex items-center justify-center px-3 sm:px-0">
      <div className="w-full max-w-[360px] p-6 bg-white border-2 border-gray-300 rounded-xl shadow-md">
        <h1 className="text-2xl font-normal text-gray-900 mb-5 text-center">Sign In</h1>
        {error && (
          <div
            className="bg-red-50 text-red-600 border-2 border-red-200 rounded-lg p-3 mb-4 text-sm text-center flex items-center gap-2"
            role="alert"
            aria-live="assertive"
            ref={errorRef}
            tabIndex={-1}
            id="error-message"
          >
            <span className="text-lg" aria-hidden="true">⚠</span>
            {error}
          </div>
        )}
        <form
          className="flex flex-col"
          onSubmit={handleSubmit}
          role="form"
          aria-label="Sign in form"
          aria-describedby={error ? "error-message" : undefined}
        >
          <div className="mb-4">
            <label htmlFor="username" className="text-sm text-gray-900 mb-1 block">
              Username <span className="text-red-600">*</span>
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              ref={usernameRef}
              required
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 aria-invalid:border-red-500"
              aria-required="true"
              aria-invalid={!!error}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="text-sm text-gray-900 mb-1 block">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 aria-invalid:border-red-500"
              aria-required="true"
              aria-invalid={!!error}
            />
          </div>
          <div className="mb-4 text-right">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-orange-600 hover:underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Forgot Password?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full px-3 py-2.5 bg-yellow-400 border-2 border-yellow-600 rounded-xl text-sm font-semibold text-gray-900 hover:bg-yellow-300 hover:border-yellow-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            <span aria-live="polite">
              {isLoading ? "Signing In..." : "Sign In"}
            </span>
          </button>
        </form>
        <div className="my-5 text-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            size="large"
            width="100%"
            aria-label="Sign in with Google"
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-6">
          New to GASH?{" "}
          <Link to="/signup" className="text-blue-600 font-medium hover:text-orange-600 hover:underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Create your GASH account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;