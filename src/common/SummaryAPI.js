// src/api/Api.js
import axiosClient from "./axiosClient";

const Api = {
  // ==== Utils ====
  utils: {
    fetchWithRetry: async (url, options = {}, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await axiosClient(url, options);
          return response.data;
        } catch (error) {
          if (i === retries - 1) throw error;
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, i))
          );
        }
      }
    },
  },

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
    addItem: (cartItem, token) =>
      axiosClient.post("/carts", cartItem, {
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
    batchRemove: (ids, token) =>
      axiosClient.delete(`/carts/batch`, {
        data: { ids },
        headers: { Authorization: `Bearer ${token}` },
      }),
    clearCart: async (userId, token) => {
      const res = await axiosClient.get(`/carts?acc_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = Array.isArray(res.data) ? res.data : [];
      await Promise.all(
        items.map((item) =>
          axiosClient.delete(`/carts/${item._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      return true;
    },
  },

  // ==== Favorites ====
  favorites: {
    fetch: (token) =>
      axiosClient.get("/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    add: (favoriteItem, token) =>
      axiosClient.post("/favorites", favoriteItem, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    remove: (favoriteId, token) =>
      axiosClient.delete(`/favorites/${favoriteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  // ==== Order/Checkout ====
  order: {
    // Get single order details
    getOrder: (orderId, token) =>
      axiosClient.get(`/orders/get-order-by-id/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Get order details (products in order)
    getOrderDetails: (orderId, token) =>
      axiosClient.get(`/order-details/get-all-order-details/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Get single order detail by ID
    getOrderDetailById: (orderDetailId, token) =>
      axiosClient.get(`/order-detail/get-order-detail-by-id/${orderDetailId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Create new order detail
    createOrderDetail: (data, token) =>
      axiosClient.post('/order-detail/create-order-detail', data, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Update order detail
    updateOrderDetail: (orderDetailId, data, token) =>
      axiosClient.put(`/order-detail/update-order-detail/${orderDetailId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Delete order detail
    deleteOrderDetail: (orderDetailId, token) =>
      axiosClient.delete(`/order-detail/delete-order-detail/${orderDetailId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Search order details
    searchOrderDetails: (queryParams, token) =>
      axiosClient.get('/order-detail/search', {
        params: queryParams,
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Get order details by product
    getOrderDetailsByProduct: (productId) =>
      axiosClient.get(`/order-detail/get-order-details-by-product/${productId}`),


    checkout: (data, token) => axiosClient.post('/orders/checkout', data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    deleteCartItem: (cartId, token) => axiosClient.delete(`/carts/${cartId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

    cancel: (orderId, token) =>
      axiosClient.patch(
        `/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      ),
  },

  // ==== Feedback ====
  feedback: {
    // Get all feedback for a product variant (with pagination)
    getAllFeedback: (variantId, page = 1, limit = 10) =>
      axiosClient.get(`/orders/get-all-feedback/${variantId}`, {
        params: { page, limit }
      }),

    // Add new feedback
    addFeedback: (orderId, variantId, data, token) =>
      axiosClient.patch(`/orders/${orderId}/add-feedback/${variantId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Edit existing feedback
    editFeedback: (orderId, variantId, data, token) =>
      axiosClient.put(`/orders/${orderId}/edit-feedback/${variantId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Delete feedback (soft delete)
    deleteFeedback: (orderId, variantId, token) =>
      axiosClient.delete(`/orders/${orderId}/delete-feedback/${variantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  // ==== Products ====
  products: {
    // Get single product
    getProduct: (productId) => axiosClient.get(`/products/${productId}`),

    // Get product variants
    getVariants: (productId) => axiosClient.get(`/variants?pro_id=${productId}`),

    // Get product images
    getImages: (productId) => axiosClient.get(`/specifications/image/product/${productId}`),

    // Get product feedbacks
    getFeedbacks: (productId) => axiosClient.get(`/order-details/product/${productId}`),

    search: (query) => {
      const sanitizedQuery = query.trim().replace(/[<>]/g, "");
      return axiosClient.get("/products/search", {
        params: { q: sanitizedQuery },
      });
    },
  },

  // ==== Voucher ====
  voucher: {
    // Apply voucher to order (backend handles all validation)
    applyVoucher: (data, token) =>
      axiosClient.post("/vouchers/apply-voucher", data, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  // ==== Bills ====
  bills: {
    export: (orderId, token) =>
      axiosClient.get(`/bills/export-bill/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
};

export default Api;
