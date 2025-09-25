import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export default axiosClient;
