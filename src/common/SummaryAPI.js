
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
  // accounts: {
  //   getProfile: (userId) => axiosClient.get(`/accounts/${userId}`),
  //   updateProfile: (userId, data) =>
  //     axiosClient.put(`/accounts/${userId}`, data),
  //   deleteAccount: (userId) => axiosClient.delete(`/accounts/${userId}`),
  //   softDeleteAccount: (userId) => axiosClient.delete(`/accounts/soft/${userId}`),
  // },

  accounts: {
    getProfile: (userId) => axiosClient.get(`/accounts/${userId}`),

    // update profile mới
    updateProfile: (userId, data) =>
      axiosClient.put(`/accounts/change-profile/${userId}`, data),

    // đổi mật khẩu mới
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
};

export default Api;
