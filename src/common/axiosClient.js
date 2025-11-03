import axios from "axios";
import { io } from "socket.io-client";
// Prefer env; fallback: localhost in dev, https://gash-pi.vercel.app in production
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
    ? "http://localhost:5000"
    : "https://gash-pi.vercel.app");

// Debug once at runtime to verify which URL is used in each env
if (typeof window !== "undefined") {
  // Only log once per load
  (window.__GASH_API_LOGGED__ ||= false);
  if (!window.__GASH_API_LOGGED__) {
    window.__GASH_API_LOGGED__ = true;
    // Intentionally concise log for production diagnosis
    console.info("[GASH] API_BASE_URL:", API_BASE_URL, "host:", window.location.hostname);
  }
}

// Export SOCKET_URL for use in other files
export const SOCKET_URL = API_BASE_URL;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Tự động gắn token nếu có
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // hoặc lấy từ Redux/Context
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const message = status === 401 ? 'Unauthorized access - please log in' :
      status === 404 ? 'Resource not found' :
        status >= 500 ? 'Server error - please try again later' :
          'Network error - please check your connection';
    return Promise.reject({ ...error, message });
  }
);

// Socket client logic merged here
export const createSocket = (auth = {}) => {
  return io(SOCKET_URL, { auth });
};

export default axiosClient;
