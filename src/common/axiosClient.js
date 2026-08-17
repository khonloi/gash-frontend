import axios from "axios";
import { getSocket } from "./socketManager";
import { storage } from "../utils/storage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
    ? "http://localhost:5000"
    : "https://gash-be.onrender.com");

// Debug once at runtime to verify which URL is used in each env
if (typeof window !== "undefined") {
  window.__GASH_API_LOGGED__ ||= false;
  if (!window.__GASH_API_LOGGED__) {
    window.__GASH_API_LOGGED__ = true;
    if (import.meta.env.DEV) {
      console.info("[GASH] API_BASE_URL:", API_BASE_URL, "host:", window.location.hostname);
    }
  }
}

// Export SOCKET_URL for use in other files
export const SOCKET_URL = API_BASE_URL;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

// Automatically attach JWT token from storage if present
axiosClient.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor for consistent error messages
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    let fallbackMessage = "An unexpected error occurred. Please try again.";

    if (error.code === 'ECONNABORTED') {
      fallbackMessage = "Request timed out. Please try again.";
    } else if (!error.response) {
      fallbackMessage = "Failed to connect to server. Please check your network connection.";
    } else if (status === 401) {
      fallbackMessage = "Unauthorized access - please log in";
    } else if (status === 403) {
      fallbackMessage = "Forbidden - you do not have permission";
    } else if (status === 404) {
      fallbackMessage = "Resource not found";
    } else if (status >= 500) {
      fallbackMessage = "Server error - please try again later";
    }

    const message = serverMessage || fallbackMessage;
    return Promise.reject({ ...error, message, status });
  }
);

// Socket client singleton access
export const createSocket = (options = {}) => {
  return getSocket(options);
};

export default axiosClient;
