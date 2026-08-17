import axiosClient from "./axiosClient";
import { fetchWithRetry } from "../utils/fetchWithRetry";

// Canonical Products API Definition
const products = {
  getAll: (filters = {}) => axiosClient.get("/products", { params: filters }),
  getById: (productId) => axiosClient.get(`/products/${productId}`),
  getOne: (productId) => axiosClient.get(`/products/${productId}`),
  getProduct: (productId) => axiosClient.get(`/products/${productId}`),
  create: (data) => axiosClient.post("/products", data),
  update: (productId, data) => axiosClient.put(`/products/${productId}`, data),
  delete: (productId) => axiosClient.delete(`/products/${productId}`),
  addImage: (productId, data) => axiosClient.post(`/products/${productId}/images`, data),
  deleteImage: (productId, imageId) => axiosClient.delete(`/products/${productId}/images/${imageId}`),
  getImages: (productId) => axiosClient.get(`/products/${productId}`),
  getVariants: (productId) => axiosClient.get(`/variants/get-all-variants?productId=${productId}`),
  getFeedbacks: (productId) => axiosClient.get(`/order-details/product/${productId}`),
  search: (paramsOrQuery) => {
    if (typeof paramsOrQuery === "string") {
      const sanitized = paramsOrQuery.trim().replace(/[<>]/g, "");
      return axiosClient.get("/products/search", { params: { q: sanitized } });
    }
    return axiosClient.get("/products/search", { params: paramsOrQuery });
  },
};

// Canonical Variants API Definition
const variants = {
  getAll: (filters = {}) => axiosClient.get("/variants/get-all-variants", { params: filters }),
  getById: (variantId) => axiosClient.get(`/variants/get-variant-detail/${variantId}`),
  create: (data) => axiosClient.post("/variants/create-variant", data),
  update: (variantId, data) => axiosClient.put(`/variants/update-variant/${variantId}`, data),
  delete: (variantId) => axiosClient.delete(`/variants/delete-variant/${variantId}`),
};

// Canonical Cart API Definition
const cart = {
  fetch: (userId) => axiosClient.get(`/carts/account/${userId}`),
  getByAccount: (accountId) => axiosClient.get(`/carts/account/${accountId}`),
  getById: (cartId) => axiosClient.get(`/carts/${cartId}`),
  create: (data) => axiosClient.post("/carts", data),
  addItem: (cartItem) => axiosClient.post("/carts", cartItem),
  update: (cartId, data) => axiosClient.put(`/carts/${cartId}`, data),
  updateItem: (itemId, data) => axiosClient.put(`/carts/${itemId}`, data),
  delete: (cartId) => axiosClient.delete(`/carts/${cartId}`),
  removeItem: (itemId) => axiosClient.delete(`/carts/${itemId}`),
  batchRemove: async (ids) => {
    await Promise.all(ids.map((id) => axiosClient.delete(`/carts/${id}`)));
    return { success: true };
  },
  clearCart: async (userId) => {
    const res = await axiosClient.get(`/carts/account/${userId}`);
    const data = res.data?.data || res.data;
    const items = Array.isArray(data) ? data : [];
    await Promise.all(
      items.map((item) => axiosClient.delete(`/carts/${item._id || item.cartId}`))
    );
    return true;
  },
};

// Canonical Notifications API Definition
const notifications = {
  getUserNotifications: (userId) => axiosClient.get(`/notifications/user/${userId}`),
  getByAccount: (userId) => axiosClient.get(`/notifications/user/${userId}`),
  markAsRead: (id) => axiosClient.put(`/notifications/mark-read/${id}`, {}),
  clearAll: (userId) => axiosClient.delete(`/notifications/clear/${userId}`),
  deleteUserNotification: (userId, id) => axiosClient.delete(`/notifications/user/${userId}/${id}`),
  getPreferences: (userId) => axiosClient.get(`/notifications/preferences/${userId}`),
  updatePreferences: (userId, data) => axiosClient.put(`/notifications/preferences/${userId}`, data),
};

const Api = {
  // ==== Utils ====
  utils: {
    fetchWithRetry,
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
    updateProfile: (userId, data) => axiosClient.put(`/accounts/change-profile/${userId}`, data),
    changePassword: (userId, data) => axiosClient.put(`/accounts/change-password/${userId}`, data),
    deleteAccount: (userId) => axiosClient.delete(`/accounts/${userId}`),
    softDeleteAccount: (userId) => axiosClient.delete(`/accounts/soft/${userId}`),
    disableAccount: (userId) => axiosClient.put(`/accounts/disable/${userId}`),
  },

  // ==== Cart ====
  cart,
  newCart: cart, // Backwards compatibility alias

  // ==== Favorites ====
  favorites: {
    fetch: () => axiosClient.get("/favorites"),
    add: (favoriteItem) => axiosClient.post("/favorites", favoriteItem),
    remove: (favoriteId) => axiosClient.delete(`/favorites/${favoriteId}`),
  },

  // ==== Order/Checkout ====
  order: {
    getOrders: (userId) => axiosClient.get(`/orders/user/${userId}`),
    getOrder: (orderId) => axiosClient.get(`/orders/get-order-by-id/${orderId}`),
    getAllOrdersForAdmin: () => axiosClient.get(`/orders/admin/get-all-order`),
    searchOrders: (queryParams) => axiosClient.get(`/orders/search`, { params: queryParams }),
    updateOrderByAdmin: (orderId, data) => axiosClient.put(`/orders/admin/update/${orderId}`, data),
    deleteOrder: (orderId) => axiosClient.delete(`/orders/${orderId}`),
    getPaymentUrl: (data) => axiosClient.post("/orders/payment-url", data),
    vnpayReturn: (params) => axiosClient.get(`/orders/vnpay-return${params}`),
    cancel: (orderId, cancelReason) => axiosClient.patch(`/orders/${orderId}/cancel`, { cancelReason }),
    checkout: (data) => axiosClient.post("/orders/checkout", data),
    createOrderDetail: (data) => axiosClient.post("/order-details/create-order-detail", data),
    getAllOrderDetails: (orderId) => axiosClient.get(`/order-details/get-all-order-details/${orderId}`),
    getOrderDetailById: (orderDetailId) => axiosClient.get(`/order-details/get-order-detail-by-id/${orderDetailId}`),
    updateOrderDetail: (orderDetailId, data) => axiosClient.put(`/order-details/update-order-detail/${orderDetailId}`, data),
    deleteOrderDetail: (orderDetailId) => axiosClient.delete(`/order-details/delete-order-detail/${orderDetailId}`),
    searchOrderDetails: (queryParams) => axiosClient.get("/order-details/search", { params: queryParams }),
    getOrderDetailsByProduct: (productId) => axiosClient.get(`/order-details/get-order-details-by-product/${productId}`),
  },

  // ==== Categories ====
  categories: {
    getAll: () => axiosClient.get("/categories/get-all-categories"),
  },

  // ==== Feedback ====
  feedback: {
    getAllFeedback: (variantId, page = 1, limit = 10) =>
      axiosClient.get(`/feedback/get-all-feedback/${variantId}`, {
        params: { page, limit },
      }),
    addFeedback: (orderId, variantId, data) =>
      axiosClient.patch(`/feedback/${orderId}/add-feedback/${variantId}`, data),
    editFeedback: (orderId, variantId, data) =>
      axiosClient.put(`/feedback/${orderId}/edit-feedback/${variantId}`, data),
    deleteFeedback: (orderId, variantId) =>
      axiosClient.delete(`/feedback/${orderId}/delete-feedback/${variantId}`),
  },

  // ==== Products ====
  products,
  newProducts: products, // Backwards compatibility alias

  // ==== Product Images ====
  productImages: {
    getByProduct: (productId) => axiosClient.get(`/products/${productId}`),
  },

  // ==== Product Variants ====
  variants,
  newVariants: variants, // Backwards compatibility alias

  // ==== Voucher ====
  voucher: {
    applyVoucher: (data) => axiosClient.post("/vouchers/apply-voucher", data),
    getAll: () => axiosClient.get("/vouchers/get-all"),
  },

  // ==== Bills ====
  bills: {
    export: (orderId) => axiosClient.get(`/bills/export-bill/${orderId}`),
  },

  // ==== Passkeys ====
  passkeys: {
    generateRegistrationOptions: () => axiosClient.post("/passkeys/register/generate", {}),
    verifyRegistration: (data) => axiosClient.post("/passkeys/register/verify", data),
    generateAuthenticationOptions: (username) => axiosClient.post("/passkeys/auth/generate", { username }),
    verifyAuthentication: (data) => axiosClient.post("/passkeys/auth/verify", data),
    getUserPasskeys: () => axiosClient.get("/passkeys/list"),
    deletePasskey: (passkeyId) => axiosClient.delete(`/passkeys/${passkeyId}`),
  },

  // ==== Auth ====
  auth: {
    verifyPassword: (password) => axiosClient.post("/auth/verify-password", { password }),
    updateCheckoutAuthSetting: (requireAuth) => axiosClient.put("/auth/checkout-auth-setting", { requireAuth }),
  },

  // ==== Livestream ====
  livestream: {
    getLiveNow: () => axiosClient.get("/livestream/live-now"),
    getLive: () => axiosClient.get("/livestream/live-now"),
    join: (data) => axiosClient.post("/livestream/join", data),
    leave: (data) => axiosClient.post("/livestream/leave", data),
    addReaction: (data) => axiosClient.post("/livestream-reactions/add-reaction", data),
    getReactions: (liveId) => axiosClient.get(`/livestream-reactions/reactions/${liveId}`),
    getLiveProducts: (liveId) => axiosClient.get(`/livestream-products/${liveId}/live-products`),
    addComment: (data) => axiosClient.post("/livestream-comments/add-comment", data),
    getComments: (liveId) => axiosClient.get(`/livestream-comments/comments/${liveId}`),
    hideComment: (commentId) => axiosClient.delete(`/livestream-comments/${commentId}/hide-comment`),
  },

  // ==== Notifications ====
  notifications,
  newNotifications: notifications, // Backwards compatibility alias
};

export default Api;
