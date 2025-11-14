import React, { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "../hooks/useToast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { LOGIN_ERROR_MESSAGES, ERROR_TIMEOUT } from "../constants/constants";
import ProductButton from "../components/ProductButton";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const usernameRef = useRef(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const from = location.state?.from || "/";

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const { username, password } = formData;
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();

      if (!trimmedUsername || !trimmedPassword) {
        showToast(LOGIN_ERROR_MESSAGES.EMPTY_FIELDS, "error", ERROR_TIMEOUT);
        usernameRef.current?.focus();
        return;
      }
      if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        showToast('Username must be between 3 and 30 characters.', "error", ERROR_TIMEOUT);
        usernameRef.current?.focus();
        return;
      }
      if (trimmedPassword.length < 8) {
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
        showToast(LOGIN_ERROR_MESSAGES.GOOGLE_FAILED, "error", ERROR_TIMEOUT);
        return;
      }

      setIsLoading(true);
      try {
        await googleLogin(credentialResponse.credential);
        showToast('Login successful!', 'success', ERROR_TIMEOUT);
        navigate(from, { replace: true });
      } catch (err) {
        showToast(LOGIN_ERROR_MESSAGES.GOOGLE_FAILED, "error", ERROR_TIMEOUT);
      } finally {
        setIsLoading(false);
      }
    },
    [googleLogin, navigate, from, showToast]
  );

  const handleGoogleError = useCallback(() => {
    showToast(LOGIN_ERROR_MESSAGES.GOOGLE_FAILED, "error", ERROR_TIMEOUT);
  }, [showToast]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto min-h-[calc(100vh-6rem)] p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-sm shadow-sm border border-gray-200">
        <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-center text-gray-900">
          Sign In
        </h1>

        <form
          onSubmit={handleSubmit}
          role="form"
          aria-label="Sign in form"
          className="space-y-4 sm:space-y-5"
        >
          <fieldset className="flex flex-col">
            <label htmlFor="username" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
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
              className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              aria-required="true"
              placeholder="Enter your username"
            />
          </fieldset>

          <fieldset className="flex flex-col">
            <label htmlFor="password" className="text-sm sm:text-base font-semibold mb-2 text-gray-900">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              aria-required="true"
              placeholder="Enter your password"
            />
          </fieldset>

          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 rounded"
            >
              Forgot Password?
            </Link>
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
              {isLoading ? "Signing In..." : "Sign In"}
            </span>
          </ProductButton>
        </form>

        <div className="mt-4 sm:mt-5">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            size="large"
            width="100%"
            aria-label="Sign in with Google"
          />
        </div>

        <p className="text-center text-sm text-gray-600 mt-4 sm:mt-5">
          New to GASH?{" "}
          <Link 
            to="/signup" 
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 rounded"
          >
            Create your GASH account
          </Link>
        </p>
      </section>
    </div>
  );
};

export default Login;