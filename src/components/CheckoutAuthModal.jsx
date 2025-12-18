import React, { useState, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Api from '../common/SummaryAPI';
import { startAuthentication } from '@simplewebauthn/browser';
import { GoogleLogin } from '@react-oauth/google';
import ProductButton from './ProductButton';

const CheckoutAuthModal = ({ open, onClose, onAuthenticated, user, passkeys = [] }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMethod, setAuthMethod] = useState(null); // 'password', 'google', 'passkey'
  const { googleLogin } = useContext(AuthContext);
  const { showToast } = useToast();

  const isGoogleUser = user?.googleId;
  const hasPasskeys = passkeys && passkeys.length > 0;
  const hasPassword = !isGoogleUser; // Regular users have passwords

  const handlePasswordAuth = useCallback(async () => {
    if (!password.trim()) {
      showToast('Please enter your password', 'error', 3000);
      return;
    }

    setIsAuthenticating(true);
    setAuthMethod('password');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please log in again', 'error', 3000);
        return;
      }

      const response = await Api.auth.verifyPassword(password, token);
      if (response.data.verified) {
        showToast('Authentication successful', 'success', 2000);
        onAuthenticated();
        onClose();
      } else {
        showToast('Invalid password', 'error', 3000);
      }
    } catch (err) {
      console.error('Password authentication error:', err);
      const errorMsg = err.response?.data?.message || 'Authentication failed';
      showToast(errorMsg, 'error', 3000);
    } finally {
      setIsAuthenticating(false);
      setAuthMethod(null);
      setPassword('');
    }
  }, [password, showToast, onAuthenticated, onClose]);

  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    if (!credentialResponse.credential) {
      showToast('Google authentication failed', 'error', 3000);
      setIsAuthenticating(false);
      setAuthMethod(null);
      return;
    }

    setIsAuthenticating(true);
    setAuthMethod('google');
    try {
      await googleLogin(credentialResponse.credential);
      showToast('Google authentication successful', 'success', 2000);
      onAuthenticated();
      onClose();
    } catch (err) {
      console.error('Google authentication error:', err);
      showToast('Google authentication failed', 'error', 3000);
    } finally {
      setIsAuthenticating(false);
      setAuthMethod(null);
    }
  }, [googleLogin, showToast, onAuthenticated, onClose]);

  const handleGoogleError = useCallback(() => {
    showToast('Google authentication failed', 'error', 3000);
    setIsAuthenticating(false);
    setAuthMethod(null);
  }, [showToast]);

  const handlePasskeyAuth = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthMethod('passkey');
    try {
      // Generate authentication options
      const authResponse = await Api.passkeys.generateAuthenticationOptions(user.username);
      const { options, challenge } = authResponse.data;

      // Start authentication
      const authenticationResponse = await startAuthentication(options);

      // Verify authentication
      const verifyData = {
        id: authenticationResponse.id,
        rawId: authenticationResponse.rawId,
        response: authenticationResponse.response,
        type: authenticationResponse.type,
        challenge: challenge,
        username: user.username,
      };

      await Api.passkeys.verifyAuthentication(verifyData);
      showToast('Passkey authentication successful', 'success', 2000);
      onAuthenticated();
      onClose();
    } catch (err) {
      console.error('Passkey authentication error:', err);
      const errorMsg = err.response?.data?.message || 'Passkey authentication failed';
      showToast(errorMsg, 'error', 3000);
    } finally {
      setIsAuthenticating(false);
      setAuthMethod(null);
    }
  }, [user, showToast, onAuthenticated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Authenticate to Place Order</h3>
        <p className="text-sm text-gray-600 mb-6">
          Please authenticate to confirm your order. Choose your preferred method:
        </p>

        <div className="space-y-3">
          {/* Password Authentication */}
          {hasPassword && (
            <div className="space-y-2">
              <label htmlFor="checkout-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="checkout-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isAuthenticating) {
                    handlePasswordAuth();
                  }
                }}
                placeholder="Enter your password"
                className="w-full p-3 border-2 border-gray-300 rounded-md bg-white text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAuthenticating}
              />
              <ProductButton
                variant="primary"
                size="md"
                onClick={handlePasswordAuth}
                disabled={isAuthenticating || !password.trim()}
                className="w-full"
              >
                {isAuthenticating && authMethod === 'password' ? 'Verifying...' : 'Authenticate with Password'}
              </ProductButton>
            </div>
          )}

          {/* Google Authentication */}
          {isGoogleUser && (
            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                size="large"
                width="100%"
                disabled={isAuthenticating}
                aria-label="Authenticate with Google"
              />
            </div>
          )}

          {/* Passkey/Passkey Authentication */}
          {hasPasskeys && (
            <ProductButton
              variant="secondary"
              size="md"
              onClick={handlePasskeyAuth}
              disabled={isAuthenticating}
              className="w-full"
            >
              {isAuthenticating && authMethod === 'passkey' ? 'Authenticating...' : 'Authenticate with Passkeys'}
            </ProductButton>
          )}

          {/* Cancel Button */}
          <ProductButton
            variant="default"
            size="md"
            onClick={onClose}
            disabled={isAuthenticating}
            className="w-full"
          >
            Cancel
          </ProductButton>
        </div>
      </div>
    </div>
  );
};

export default CheckoutAuthModal;

