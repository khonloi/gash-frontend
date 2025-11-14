import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { Bell, Mail, Globe, Save } from "lucide-react";
import ProductButton from "../components/ProductButton";

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
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
        showToast("Please log in to save your preferences.", "error", 3000);
        return;
      }
      setLoading(true);
      await axios.put(
        `http://localhost:5000/notifications/preferences/${user._id}`,
        prefs
      );
      showToast("Your notification settings have been saved!", "success", 3000);
    } catch (err) {
      console.error("Error saving preferences:", err);
      const errorMessage = err.response?.data?.message || "Something went wrong while saving your settings.";
      showToast(errorMessage, "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto min-h-[calc(100vh-6rem)] p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-2xl shadow-sm border border-gray-200">
        <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold mb-4 sm:mb-5 md:mb-6 text-center text-gray-900 flex items-center justify-center gap-2">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          Notification Settings
        </h1>

        {!user ? (
          <div className="text-center py-8 sm:py-10">
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Please log in to manage your notification preferences.
            </p>
            <ProductButton
              variant="primary"
              size="md"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </ProductButton>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <p className="text-sm text-gray-600 mb-4 sm:mb-6">
              Customize how you receive updates from the system. You can turn
              on or off any notification channels below.
            </p>

            {/* Preferences */}
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-xl border-2 border-gray-300 hover:border-blue-600 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="p-2.5 sm:p-3 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                      Receive notifications via Email
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Get updates delivered directly to your inbox.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs.email}
                    onChange={(e) =>
                      setPrefs({ ...prefs, email: e.target.checked })
                    }
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:outline-2 peer-focus:outline-blue-600 peer-focus:outline-offset-2 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Web */}
              <div className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-xl border-2 border-gray-300 hover:border-blue-600 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="p-2.5 sm:p-3 bg-indigo-100 text-indigo-600 rounded-lg flex-shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                      Receive notifications on the Web
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Show in-app notifications while you're online.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs.web}
                    onChange={(e) =>
                      setPrefs({ ...prefs, web: e.target.checked })
                    }
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:outline-2 peer-focus:outline-blue-600 peer-focus:outline-offset-2 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-4 sm:pt-6">
              <ProductButton
                type="button"
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
          </div>
        )}
      </section>
    </div>
  );
}
