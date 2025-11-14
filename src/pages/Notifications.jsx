import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Bell, Mail, Globe, Save } from "lucide-react";
import ProductButton from "../components/ProductButton";

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [prefs, setPrefs] = useState({ email: true, web: true });
  const [loading, setLoading] = useState(false);

  // 🟦 Fetch user preferences
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        if (!user?._id) return;
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/notifications/preferences/${user._id}`
        );
        setPrefs(res.data.preferences || { email: true, web: true });
      } catch (err) {
        console.error("Error loading preferences:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, [user]);

  // 🟩 Save preferences
  const handleSavePrefs = async () => {
    try {
      if (!user?._id) {
        alert("Please log in to save your preferences.");
        return;
      }
      setLoading(true);
      await axios.put(
        `http://localhost:5000/notifications/preferences/${user._id}`,
        prefs
      );
      alert("✅ Your notification settings have been saved!");
    } catch (err) {
      console.error("Error saving preferences:", err);
      alert("❌ Something went wrong while saving your settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 opacity-80" />
          <div className="relative flex items-center gap-3 px-6 py-5">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
              <Bell className="text-white w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-white drop-shadow-sm">
              Notification Settings
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {!user ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-lg">
                ⚠️ Please log in to manage your notification preferences.
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-4">
                Customize how you receive updates from the system. You can turn
                on or off any notification channels below.
              </p>

              {/* Preferences */}
              <div className="grid gap-4">
                {/* Email */}
                <div className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm border border-gray-200 transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-xl shadow-sm">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Receive notifications via Email
                      </p>
                      <p className="text-sm text-gray-500">
                        Get updates delivered directly to your inbox.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.email}
                      onChange={(e) =>
                        setPrefs({ ...prefs, email: e.target.checked })
                      }
                      className="sr-only peer"
                      disabled={loading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Web */}
                <div className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-sm border border-gray-200 transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-xl shadow-sm">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Receive notifications on the Web
                      </p>
                      <p className="text-sm text-gray-500">
                        Show in-app notifications while you’re online.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs.web}
                      onChange={(e) =>
                        setPrefs({ ...prefs, web: e.target.checked })
                      }
                      className="sr-only peer"
                      disabled={loading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Save button */}
              <div className="pt-4">
                <ProductButton
                  variant="primary"
                  size="lg"
                  onClick={handleSavePrefs}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </ProductButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
