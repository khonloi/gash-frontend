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
    disableAccount: (userId) =>
      axiosClient.put(`/accounts/disable/${userId}`),
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
    // Get all orders for a user
    getOrders: (userId, token) =>
      axiosClient.get(`/orders/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Get single order by ID for user and admin
    getOrder: (orderId, token) =>
      axiosClient.get(`/orders/get-order-by-id/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Get all orders for admin
    getAllOrdersForAdmin: (token) =>
      axiosClient.get(`/orders/admin/get-all-order`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Search orders
    searchOrders: (queryParams, token) =>
      axiosClient.get(`/orders/search`, {
        params: queryParams,
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Update order by admin
    updateOrderByAdmin: (orderId, data, token) =>
      axiosClient.put(`/orders/admin/update/${orderId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Delete order
    deleteOrder: (orderId, token) =>
      axiosClient.delete(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Create VNPay payment URL
    getPaymentUrl: (data, token) =>
      axiosClient.post("/orders/payment-url", data, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // VNPay return handler
    vnpayReturn: (params) =>
      axiosClient.get(`/orders/vnpay-return${params}`),

    // Cancel order
    cancel: (orderId, cancelReason, token) =>
      axiosClient.patch(`/orders/${orderId}/cancel`, { cancelReason }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),

    // Checkout
    checkout: (data, token) =>
      axiosClient.post('/orders/checkout', data, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Create order detail
    createOrderDetail: (data, token) =>
      axiosClient.post('/order-details/create-order-detail', data, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Get all order details for an order
    getAllOrderDetails: (orderId, token) =>
      axiosClient.get(`/order-details/get-all-order-details/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Get single order detail by ID
    getOrderDetailById: (orderDetailId, token) =>
      axiosClient.get(`/order-details/get-order-detail-by-id/${orderDetailId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Update order detail
    updateOrderDetail: (orderDetailId, data, token) =>
      axiosClient.put(`/order-details/update-order-detail/${orderDetailId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Delete order detail
    deleteOrderDetail: (orderDetailId, token) =>
      axiosClient.delete(`/order-details/delete-order-detail/${orderDetailId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Search order details
    searchOrderDetails: (queryParams, token) =>
      axiosClient.get('/order-details/search', {
        params: queryParams,
        headers: { Authorization: `Bearer ${token}` },
      }),

    // Get order details by product
    getOrderDetailsByProduct: (productId) =>
      axiosClient.get(`/order-details/get-order-details-by-product/${productId}`),
  },

  // ==== Feedback ====
  feedback: {
    getAllFeedback: (variantId, page = 1, limit = 10) =>
      axiosClient.get(`/feedback/get-all-feedback/${variantId}`, {
        params: { page, limit }
      }),
    addFeedback: (orderId, variantId, data, token) =>
      axiosClient.patch(`/feedback/${orderId}/add-feedback/${variantId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    editFeedback: (orderId, variantId, data, token) =>
      axiosClient.put(`/feedback/${orderId}/edit-feedback/${variantId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    deleteFeedback: (orderId, variantId, token) =>
      axiosClient.delete(`/feedback/${orderId}/delete-feedback/${variantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  // ==== Products ====
  products: {
    getProduct: (productId) => axiosClient.get(`/products/${productId}`),
    getVariants: (productId) => axiosClient.get(`/variants?pro_id=${productId}`),
    getImages: (productId) => axiosClient.get(`/specifications/image/product/${productId}`),
    getFeedbacks: (productId) => axiosClient.get(`/order-details/product/${productId}`),
    search: (query) => {
      const sanitizedQuery = query.trim().replace(/[<>]/g, "");
      return axiosClient.get("/products/search", {
        params: { q: sanitizedQuery },
      });
    },
  },

  // ==== New Products ====
  newProducts: {
    getAll: (filters = {}) => axiosClient.get('/new-products', { params: filters }),
    getById: (productId) => axiosClient.get(`/new-products/${productId}`),
    create: (data, token) => axiosClient.post('/new-products', data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    update: (productId, data, token) => axiosClient.put(`/new-products/${productId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    delete: (productId, token) => axiosClient.delete(`/new-products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    addImage: (productId, data, token) => axiosClient.post(`/new-products/${productId}/images`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    deleteImage: (productId, imageId, token) => axiosClient.delete(`/new-products/${productId}/images/${imageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    search: (params) => axiosClient.get('/new-products/search', { params }),
  },

  // ==== New Product Variants ====
  newVariants: {
    getAll: (filters = {}) => axiosClient.get('/new-variants/get-all-variants', { params: filters }),
    getById: (variantId) => axiosClient.get(`/new-variants/${variantId}`),
    create: (data, token) => axiosClient.post('/new-variants', data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    update: (variantId, data, token) => axiosClient.put(`/new-variants/${variantId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    delete: (variantId, token) => axiosClient.delete(`/new-variants/${variantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  },

  // ==== New Cart ====
  newCart: {
    create: (data, token) => axiosClient.post('/new-carts', data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    getByAccount: (accountId, token) => axiosClient.get(`/new-carts/account/${accountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    getById: (cartId, token) => axiosClient.get(`/new-carts/${cartId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    update: (cartId, data, token) => axiosClient.put(`/new-carts/${cartId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    delete: (cartId, token) => axiosClient.delete(`/new-carts/${cartId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  },

  // ==== Voucher ====
  voucher: {
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

  // ==== Livestream ====
  livestream: {
    // Get currently live streams (User can only see live streams)
    getLiveNow: (token) => axiosClient.get("/livestream/live-now", {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // Join livestream (view)
    view: (data, token) => axiosClient.post("/livestream/join", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // Leave livestream
    leave: (data, token) => axiosClient.post("/livestream/leave", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // Add reaction to livestream
    addReaction: (data, token) => axiosClient.post("/livestream-reactions/add-reaction", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // Get reaction counts for a livestream (User và Admin dùng chung - reaction ko có xóa)
    getReactions: (liveId, token) => axiosClient.get(`/livestream-reactions/reactions/${liveId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // Get all active products in a livestream (User và Admin dùng chung - chỉ active products)
    getLiveProducts: (liveId, token) => axiosClient.get(`/livestream-products/${liveId}/live-products`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // Add comment to livestream
    addComment: (data, token) => axiosClient.post("/livestream-comments/add-comment", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // Get comments for a livestream (User - only non-deleted comments)
    getComments: (liveId, token) => axiosClient.get(`/livestream-comments/comments/${liveId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    // Hide comment
    hideComment: (commentId, token) => axiosClient.delete(`/livestream-comments/${commentId}/hide-comment`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  },
};

export default Api;