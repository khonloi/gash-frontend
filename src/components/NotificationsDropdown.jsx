import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "./IconButton";
import { useNavigate } from "react-router-dom";

export default function NotificationsDropdown({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // 🧩 Socket.IO: kết nối realtime
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?._id) {
      // Cleanup socket if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // ✅ Lấy URL backend chính xác
    const baseURL =
      import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

    console.log("🔌 Connecting notification socket to:", baseURL);

    // Create socket if it doesn't exist
    if (!socketRef.current) {
      socketRef.current = io(baseURL, {
        transports: ["websocket", "polling"], // fallback an toàn
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        withCredentials: true,
      });
    }

    const socket = socketRef.current;

    // Khi user kết nối, gửi userId lên server
    const handleConnect = () => {
      console.log("✅ Notification Socket connected:", socket.id);
      // Emit user connection to join notification room
      socket.emit("userConnected", user._id);
      console.log(`🔔 Emitted userConnected for user: ${user._id}`);
    };

    // Nhận thông báo realtime
    const handleNewNotification = (data) => {
      console.log("🔔 Nhận thông báo realtime:", data);
      // Add notification to the top of the list
      setNotifications((prev) => {
        // Check if notification already exists to avoid duplicates
        const exists = prev.some(n => n._id === data._id || (n._id?.toString() === data._id?.toString()));
        if (exists) {
          console.log("⚠️ Notification already exists, skipping:", data._id);
          return prev;
        }
        return [data, ...prev];
      });
    };

    // Listen for badge updates to refresh notification list
    const handleBadgeUpdate = (data) => {
      console.log("🔔 Notification badge update received:", data);
      // Refresh notifications list when badge updates
      const fetchNotifications = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/notifications/user/${user._id}`
          );
          if (!res.ok) throw new Error("Failed to fetch notifications");
          const notificationData = await res.json();
          setNotifications(notificationData);
        } catch (err) {
          console.error("❌ Lỗi khi refresh thông báo:", err);
        }
      };
      fetchNotifications();
    };

    // Log lỗi
    const handleConnectError = (err) => {
      console.error("❌ Notification Socket connection error:", err.message);
    };

    // Ngắt kết nối
    const handleDisconnect = (reason) => {
      console.warn("⚠️ Notification Socket disconnected:", reason);
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("newNotification", handleNewNotification);
    socket.on("notificationBadgeUpdate", handleBadgeUpdate);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    // If already connected, emit userConnected immediately
    if (socket.connected) {
      socket.emit("userConnected", user._id);
      console.log(`🔔 Emitted userConnected immediately for user: ${user._id}`);
    }

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationBadgeUpdate", handleBadgeUpdate);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      // Don't disconnect here - keep socket alive for component lifecycle
    };
  }, [user]);

  // 🧠 Lấy danh sách thông báo từ backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?._id) return;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/notifications/user/${user._id}`
        );
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error("❌ Lỗi khi lấy thông báo:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh mỗi 30s
    return () => clearInterval(interval);
  }, [user]);

  // 🧱 Click ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔢 Số lượng chưa đọc
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ✅ Đánh dấu đã đọc
  const markAsRead = async (id) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/notifications/mark-read/${id}`,
        { method: "PUT" }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("❌ Lỗi khi đánh dấu đã đọc:", err);
    }
  };

  // ❌ Xóa 1 thông báo (cho user)
  const deleteNotification = async (id) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/notifications/user/${user._id}/${id}`,
        { method: "DELETE" }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("❌ Lỗi khi xóa thông báo:", err);
    }
  };

  // 🧹 Xóa toàn bộ thông báo
  const clearAll = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/notifications/clear/${user._id}`,
        { method: "DELETE" }
      );
      setNotifications([]);
    } catch (err) {
      console.error("❌ Lỗi khi clear all:", err);
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      {/* 🔔 Icon chuông */}
      <IconButton
        onClick={() => (user ? setShowNotifications((prev) => !prev) : navigate("/login"))}
        title="Notifications"
        badge={unreadCount > 0 ? unreadCount : undefined}
      >
        <NotificationsNoneOutlinedIcon />
      </IconButton>

      {/* 📜 Dropdown danh sách */}
      {user && showNotifications && (
        <div className="absolute right-0 mt-3 w-96 bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-[fadeDown_0.25s_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              <button
                className="text-gray-500 hover:text-indigo-600 transition"
                title="Notification Settings"
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/notifications");
                }}
              >
                <SettingsIcon fontSize="small" />
              </button>

              {notifications.length > 0 && (
                <button
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#ff4d4d] transition"
                  onClick={clearAll}
                  title="Clear all notifications"
                >
                  <DeleteIcon fontSize="small" />
                </button>
              )}
            </div>
          </div>

          {/* Danh sách */}
          {notifications.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-300">
              {notifications.map((n) => (
                <li
                  key={n._id}
                  onClick={() => markAsRead(n._id)}
                  className={`group flex items-start gap-3 px-5 py-4 hover:bg-[#fff6eb] transition-all cursor-pointer ${
                    !n.isRead ? "bg-[#fffaf0]" : "bg-white"
                  }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-[#ffb300]/10 text-[#ffb300] rounded-full flex items-center justify-center text-lg">
                    <NotificationsNoneOutlinedIcon fontSize="small" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm leading-snug">
                      <strong>{n.title}</strong>
                      <br />
                      <span className="text-gray-600">{n.message}</span>
                    </p>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                      <span>
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>

                      {!n.isRead && (
                        <span className="flex items-center gap-1 text-[#ff4d4d] font-medium">
                          <span className="w-2 h-2 bg-[#ff4d4d] rounded-full animate-pulse" />
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="ml-auto text-gray-400 hover:text-red-500 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n._id);
                    }}
                    title="Delete notification"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              No new notifications 🎉
            </div>
          )}
        </div>
      )}
    </div>
  );
}
