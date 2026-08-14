import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { mockUser } from './mock/mockData';
import { storage } from './utils/storage';

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
      <App />
    </React.StrictMode>,
  );
};

initApp();
