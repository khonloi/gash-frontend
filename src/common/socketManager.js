import { io } from "socket.io-client";
import { SOCKET_URL } from "./axiosClient";
import { storage } from "../utils/storage";

/**
 * Socket.IO Singleton Manager
 * Manages a single shared WebSocket connection across the entire application,
 * eliminating redundant connections, race conditions, and excessive server load.
 */

let socketInstance = null;

/**
 * Returns the singleton Socket.IO instance, lazily initializing it on first call.
 * @param {Object} [customOptions={}] - Optional socket configuration overrides
 * @returns {import("socket.io-client").Socket} The shared socket instance
 */
export function getSocket(customOptions = {}) {
  if (!socketInstance) {
    const token = storage.getToken();

    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      withCredentials: true,
      auth: { token },
      ...customOptions,
    });

    socketInstance.on("connect_error", (err) => {
      if (import.meta.env.DEV) {
        console.error("[Socket.IO] Connection error:", err.message);
      }
    });

    socketInstance.on("disconnect", (reason) => {
      if (import.meta.env.DEV) {
        console.warn("[Socket.IO] Disconnected:", reason);
      }
    });
  }

  // If token updated after login, update auth on existing socket
  const currentToken = storage.getToken();
  if (currentToken && socketInstance.auth?.token !== currentToken) {
    socketInstance.auth = { token: currentToken };
  }

  return socketInstance;
}

/**
 * Registers user identity on the active socket connection.
 * @param {string} userId - Current user ID
 */
export function registerUserSocket(userId) {
  if (!userId) return;
  const socket = getSocket();
  const token = storage.getToken();

  const emitIdentity = () => {
    socket.emit("userConnected", userId);
    socket.emit("joinRoom", userId);
    if (token) {
      socket.emit("authenticate", token);
    }
  };

  if (socket.connected) {
    emitIdentity();
  } else {
    socket.once("connect", emitIdentity);
  }
}

/**
 * Disconnects and destroys the singleton socket instance (e.g. on user logout).
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export default {
  getSocket,
  registerUserSocket,
  disconnectSocket,
};
