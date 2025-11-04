import React, { useState, useEffect, useRef } from "react";
import axiosClient, { SOCKET_URL } from "../common/axiosClient";
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "./IconButton";
import { useNavigate } from "react-router-dom";

export default function NotificationsDropdown({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?._id) return;
      try {
        const { data } = await axiosClient.get(`/notifications/user/${user._id}`);
        setNotifications(data);
      } catch {
        // Error handling without console log
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Number of unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark as read
  const markAsRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/mark-read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new Event('notificationUpdated')); // Trigger update
    } catch {
      // Error handling without console log
    }
  };

  // Delete one notification
  const deleteNotification = async (id) => {
    try {
      await axiosClient.delete(`/notifications/admin/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      window.dispatchEvent(new Event('notificationUpdated')); // Trigger update
    } catch {
      // Error handling without console log
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      await axiosClient.delete(`/notifications/clear/${user._id}`);
      setNotifications([]);
      window.dispatchEvent(new Event('notificationUpdated')); // Trigger update
    } catch {
      // Error handling without console log
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Icon with Badge */}
      <IconButton
        onClick={() => (user ? setShowNotifications((prev) => !prev) : navigate("/login"))}
        title="Notifications"
        badge={unreadCount > 0 ? unreadCount : null}
        badgeColor="bg-amber-500"
      >
        <NotificationsNoneOutlinedIcon />
      </IconButton>

      {/* Dropdown list */}
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

          {/* List */}
          {notifications.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-300">
              {notifications.map((n) => (
                <li
                  key={n._id}
                  onClick={() => markAsRead(n._id)}
                  className={`group flex items-start gap-3 px-5 py-4 hover:bg-[#fff6eb] transition-all cursor-pointer ${!n.isRead ? "bg-[#fffaf0]" : "bg-white"
                    }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-[#ffb300]/10 text-[#ffb300] rounded-full flex items-center justify-center text-lg">
                    <NotificationsNoneOutlinedIcon fontSize="small" />
                  </div>

                  {/* Content */}
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

                  {/* Delete button */}
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