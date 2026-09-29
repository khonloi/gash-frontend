import { setTokenRefreshHandler } from './apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthTokens } from '@/types/user';
import { ApiResponse } from '@/types/api';

let refreshPromise: Promise<string | null> | null = null;

function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000/api/v1'
    );
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
}

/**
 * Refreshes the auth token via a direct HTTP POST without going through apiClient
 * to avoid circular dependency and recursive 401 loops.
 * Deduplicates concurrent refresh attempts into a single inflight promise.
 */
export async function refreshAuthToken(): Promise<string | null> {
  const authState = useAuthStore.getState();
  const refreshTokenStr = authState.refreshToken;

  if (!refreshTokenStr) {
    authState.clearAuth();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const baseUrl = getApiBaseUrl().replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: refreshTokenStr }),
        });

        if (!res.ok) {
          throw new Error(`Token refresh failed with status ${res.status}`);
        }

        const json: ApiResponse<{ tokens: AuthTokens }> = await res.json();
        const tokens = json?.data?.tokens;

        if (tokens?.accessToken) {
          authState.setTokens(tokens);
          return tokens.accessToken;
        }

        throw new Error('Malformed token response from refresh endpoint');
      } catch (error) {
        console.warn('Authentication token refresh failed:', error);
        authState.clearAuth();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

/**
 * Initializes and registers the token refresh handler with the apiClient.
 */
export function setupTokenRefresher(): void {
  setTokenRefreshHandler(refreshAuthToken);
}

// Auto-register upon import
setupTokenRefresher();
