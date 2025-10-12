import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Notifications() {
  const [tab, setTab] = useState("list");
  const [notifications, setNotifications] = useState([]);
  const [prefs, setPrefs] = useState({ email: true, web: true });

  // Fetch notifications
  useEffect(() => {
    if (tab !== "list") return;
    const fetchNotifications = async () => {
      try {
        const accountId = localStorage.getItem("accountId");
        const res = await axios.get(`http://localhost:5000/notifications/${accountId}`);
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error("Error loading notifications:", err);
      }
    };
    fetchNotifications();
  }, [tab]);

  // Fetch preferences
  useEffect(() => {
    if (tab !== "settings") return;
    const fetchPrefs = async () => {
      try {
        const accountId = localStorage.getItem("accountId");
        const res = await axios.get(`http://localhost:5000/notifications/preferences/${accountId}`);
        setPrefs(res.data.preferences || { email: true, web: true });
      } catch (err) {
        console.error("Error loading preferences:", err);
      }
    };
    fetchPrefs();
  }, [tab]);

  const handleSavePrefs = async () => {
    try {
      const accountId = localStorage.getItem("accountId");
      await axios.put(`http://localhost:5000/notifications/preferences/${accountId}`, prefs);
      alert("Cài đặt thông báo đã được lưu!");
    } catch (err) {
      console.error("Error saving preferences:", err);
    }
  };

  const tabs = [
    { key: "list", label: "📨 Danh sách thông báo" },
    { key: "settings", label: "⚙️ Cài đặt" },
    { key: "templates", label: "🧩 Mẫu thông báo" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        {/* --- Header Tabs --- */}
        <div className="flex justify-between items-center border-b bg-gray-100 px-4 sm:px-8">
          <div className="flex gap-6 overflow-x-auto py-3 scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`pb-2 font-semibold transition-colors border-b-2 ${
                  tab === t.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-blue-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- Content Area --- */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: Danh sách thông báo */}
          {tab === "list" && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">📬 Danh sách thông báo</h2>

              {notifications.length === 0 ? (
                <p className="text-gray-500 italic text-center py-10">
                  Hiện chưa có thông báo nào.
                </p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((n) => (
                    <li
                      key={n._id}
                      className={`p-4 border rounded-xl transition shadow-sm hover:shadow-md ${
                        n.isRead ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{n.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* TAB 2: Cài đặt thông báo */}
          {tab === "settings" && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                ⚙️ Tùy chọn thông báo
              </h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3 text-gray-700">
                  <input
                    type="checkbox"
                    checked={prefs.email}
                    onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  Nhận thông báo qua email
                </label>

                <label className="flex items-center gap-3 text-gray-700">
                  <input
                    type="checkbox"
                    checked={prefs.web}
                    onChange={(e) => setPrefs({ ...prefs, web: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  Nhận thông báo trên web
                </label>

                <button
                  onClick={handleSavePrefs}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow transition"
                >
                  💾 Lưu thay đổi
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Mẫu thông báo */}
          {tab === "templates" && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                🧩 Quản lý mẫu thông báo
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">•</span> Chào mừng người dùng mới
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">•</span> Xác nhận đơn hàng
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">•</span> Khuyến mãi / Voucher
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-500">•</span> Thông báo hệ thống
                </li>
              </ul>
              <div className="mt-6 text-sm text-gray-500 italic">
                (Các mẫu thông báo này sẽ được dùng để gửi tự động đến người dùng.)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}