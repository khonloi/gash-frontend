import React from "react";
import { Bell, Trash2, Settings, X } from "lucide-react";
import Dropdown from "../../../components/ui/Dropdown";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { formatDateTime } from "../../../utils/formatters";

export default function NotificationsDropdown({ user }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications(user);

  return (
    <Dropdown
      trigger={
        <button
          title="Notifications"
          className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      }
    >
      {({ close }) =>
        user && (
          <div className="w-80 sm:w-96 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Notification Settings"
                  onClick={() => {
                    close();
                    navigate("/notifications");
                  }}
                  aria-label="Notification Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {notifications.length > 0 && (
                  <button
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    onClick={clearAll}
                    title="Clear all notifications"
                    aria-label="Clear all notifications"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            {notifications.length > 0 ? (
              <ul className="max-h-96 overflow-y-auto divide-y divide-gray-200">
                {notifications.map((n) => (
                  <li
                    key={n._id}
                    onClick={() => {
                      markAsRead(n._id);
                      if (n.type === "livestream" && n.livestreamId) {
                        close();
                        navigate(`/live/${n.livestreamId}`);
                      }
                    }}
                    className={`group flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !n.isRead ? "bg-amber-50/50" : "bg-white"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center self-center ${
                        !n.isRead
                          ? "bg-amber-100 text-amber-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm sm:text-base leading-snug mb-1">
                        <strong className="font-semibold">{n.title}</strong>
                      </p>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2 whitespace-pre-wrap">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                        <span>{formatDateTime(n.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0 self-center flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n._id);
                      }}
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No new notifications</p>
              </div>
            )}
          </div>
        )
      }
    </Dropdown>
  );
}
