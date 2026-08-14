/**
 * Centralized, safe localStorage abstraction with SSR guard and JSON serialization
 */

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const storage = {
  /**
   * Get an item from localStorage
   * @param {string} key
   * @param {*} [fallback=null]
   * @returns {*}
   */
  getItem(key, fallback = null) {
    if (!isBrowser) return fallback;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return fallback;
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (err) {
      console.warn(`[storage] Error reading key "${key}":`, err);
      return fallback;
    }
  },

  /**
   * Set an item in localStorage
   * @param {string} key
   * @param {*} value
   */
  setItem(key, value) {
    if (!isBrowser) return;
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn(`[storage] Error writing key "${key}":`, err);
    }
  },

  /**
   * Remove an item from localStorage
   * @param {string} key
   */
  removeItem(key) {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[storage] Error removing key "${key}":`, err);
    }
  },

  /**
   * Clear all localStorage items
   */
  clear() {
    if (!isBrowser) return;
    try {
      window.localStorage.clear();
    } catch (err) {
      console.warn("[storage] Error clearing localStorage:", err);
    }
  },

  // ==== Authentication / User Session Helpers ====
  getToken() {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem("token") || null;
    } catch {
      return null;
    }
  },

  setToken(token) {
    if (!isBrowser) return;
    try {
      if (token) {
        window.localStorage.setItem("token", token);
      } else {
        window.localStorage.removeItem("token");
      }
    } catch (err) {
      console.warn("[storage] Error setting token:", err);
    }
  },

  removeToken() {
    this.removeItem("token");
  },

  getStoredUser() {
    return this.getItem("user", null);
  },

  setStoredUser(user) {
    this.setItem("user", user);
  },

  removeStoredUser() {
    this.removeItem("user");
  },

  getLoginTime() {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem("loginTime") || null;
    } catch {
      return null;
    }
  },

  setLoginTime(time) {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem("loginTime", time ? time.toString() : Date.now().toString());
    } catch (err) {
      console.warn("[storage] Error setting loginTime:", err);
    }
  },

  removeLoginTime() {
    this.removeItem("loginTime");
  },

  clearAuthSession() {
    this.removeToken();
    this.removeStoredUser();
    this.removeLoginTime();
  },

  // ==== Recently Viewed Helper ====
  getRecentlyViewed() {
    const list = this.getItem("recently_viewed_ids", []);
    return Array.isArray(list) ? list : [];
  },

  setRecentlyViewed(ids) {
    this.setItem("recently_viewed_ids", Array.isArray(ids) ? ids : []);
  },
};

export default storage;
