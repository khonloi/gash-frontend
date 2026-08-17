import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './index.css';
import { mockUser } from './mock/mockData';
import { storage } from './utils/storage';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Demo Mode Initialization
const isDemoMode = import.meta.env.VITE_APP_USE_MOCK === 'true';

const initApp = async () => {
  if (isDemoMode) {
    try {
      const { setupMocks } = await import('./mock/setupMocks');
      setupMocks();

      // Ensure a clean session for Demo Mode
      const storedUser = storage.getStoredUser();
      const storedToken = storage.getToken();

      // Check if we need to hydrate the demo user
      if (!storedToken || !storedUser || storedUser._id !== mockUser._id) {
        storage.clear();
        storage.setToken('demo-token-12345');
        storage.setStoredUser(mockUser);
        storage.setLoginTime(Date.now().toString());
      }
    } catch (error) {
      console.error("[GASH] Failed to load mock setup:", error);
    }
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
};

initApp();
