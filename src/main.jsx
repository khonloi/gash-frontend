import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { setupMocks } from './mock/setupMocks'
import { mockUser } from './mock/mockData'

// Demo Mode Initialization
const isDemoMode = import.meta.env.VITE_APP_USE_MOCK === 'true';
console.log("[GASH] Demo Mode Detection:", isDemoMode);

if (isDemoMode) {
  setupMocks();

  // Ensure a clean session for Demo Mode
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');

  if (!storedToken || !storedUser || JSON.parse(storedUser)._id !== mockUser._id) {
    console.log("[GASH Demo] Initializing fresh demo session...");
    localStorage.clear();
    localStorage.setItem('token', 'demo-token-12345');
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('loginTime', Date.now().toString());
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
