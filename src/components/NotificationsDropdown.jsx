import React, { useState, useEffect, useRef } from "react";
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "./IconButton";
import { useNavigate } from "react-router-dom";

export default function NotificationsDropdown({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // 🧠 Lấy danh sách thông báo từ backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?._id) return;
      try {
        const res = await fetch(`http://localhost:5000/notifications/user/${user._id}`);
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
      await fetch(`http://localhost:5000/notifications/mark-read/${id}`, { method: "PUT" });
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
      await fetch(`http://localhost:5000/notifications/admin/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("❌ Lỗi khi xóa thông báo:", err);
    }
  };

  // 🧹 Xóa toàn bộ thông báo
  const clearAll = async () => {
    try {
      await fetch(`http://localhost:5000/notifications/clear/${user._id}`, { method: "DELETE" });
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
      >
        <NotificationsNoneOutlinedIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </IconButton>

      {/* 📜 Dropdown danh sách */}
      {user && showNotifications && (
        <div className="absolute right-0 mt-3 w-96 bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-[fadeDown_0.25s_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <button
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#ff4d4d] transition"
                onClick={clearAll}
              >
                <DeleteIcon fontSize="small" />
                Clear all
              </button>
            )}
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
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-[#ffb300]/10 text-[#ffb300] rounded-full flex items-center justify-center text-lg">
                    <NotificationsNoneOutlinedIcon fontSize="small" />
                  </div>

                  {/* Nội dung */}
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

                  {/* Nút xóa */}
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

          {/* Footer */}
          <div className="border-t bg-gray-50 px-4 py-3 flex justify-center">
            <button
              onClick={() => {
                setShowNotifications(false);
                navigate("/notifications");
              }}
              className="w-full text-sm py-2 rounded-lg font-medium text-gray-700 bg-white border hover:bg-[#ffb300]/10 hover:text-[#ffb300] transition"
            >
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
