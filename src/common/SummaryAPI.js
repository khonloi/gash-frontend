import axiosClient from "./axiosClient";

const Api = {
  // ==== Upload ====
  upload: {
    image: (file) => {
      const formData = new FormData();
      formData.append("image", file);
      return axiosClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    multiple: (files) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });
      return axiosClient.post("/upload/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
  },

  // ==== Accounts ====
  accounts: {
    getProfile: (userId) => axiosClient.get(`/accounts/${userId}`),

    updateProfile: (userId, data) =>
      axiosClient.put(`/accounts/change-profile/${userId}`, data),

    changePassword: (userId, data) =>
      axiosClient.put(`/accounts/change-password/${userId}`, data),

    deleteAccount: (userId) => axiosClient.delete(`/accounts/${userId}`),

    softDeleteAccount: (userId) =>
      axiosClient.delete(`/accounts/soft/${userId}`),
  },

  // ==== Cart ====
  cart: {
    fetch: (userId, token) =>
      axiosClient.get(`/carts?acc_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    updateItem: (itemId, data, token) =>
      axiosClient.put(`/carts/${itemId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    removeItem: (itemId, token) =>
      axiosClient.delete(`/carts/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  // ==== Products ====
  products: {
    search: (query) => {
      const sanitizedQuery = query.trim().replace(/[<>]/g, "");
      return axiosClient.get("/products/search", {
        params: { q: sanitizedQuery },
      });
    },
  },

  // ==== Voucher ====
  voucher: {
    /**
     * Lấy tất cả voucher (dùng cho "Ví voucher")
     */
    getAll: () => axiosClient.get("/vouchers/get-all"),


    /**
     * Kiểm tra mã voucher thủ công (nhập tại trang thanh toán)
     * Nếu hợp lệ => trả về object voucher
     * Nếu không => throw error
     */
    validateCode: async (code) => {
  if (!code || !code.trim()) {
    throw new Error("Vui lòng nhập mã voucher.");
  }

  // Lấy danh sách voucher public từ backend (route user)
  const res = await axiosClient.get("/vouchers/get-all");
  const vouchers = res.data?.data || [];

  const found = vouchers.find(
    (v) =>
      v.code === code.toUpperCase() &&
      v.status === "active" &&
      new Date(v.endDate) >= new Date() &&
      v.usedCount < v.usageLimit
  );

  if (!found) throw new Error("Mã voucher không hợp lệ hoặc đã hết hạn.");

  return found;
},
  },
};

export default Api;
