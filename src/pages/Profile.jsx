import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Api from "../common/SummaryAPI";
import { useToast } from "../components/Toast";

// Import modal
import EditProfileModal from "../components/EditProfileModal";
import ChangePasswordModal from "../components/ChangePasswordModal";

const Profile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [invalidFile, setInvalidFile] = useState(false);

  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    image: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const firstInputRef = useRef(null);
  const { showToast } = useToast();

  // Handle chọn file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file.", "error", 3000);
        setInvalidFile(true);
        setSelectedFile(null);
        setPreviewUrl("");
        return;
      }
      setInvalidFile(false);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setInvalidFile(false);
      setSelectedFile(null);
      setPreviewUrl("");
    }
  };

  const fetchProfile = useCallback(async () => {
    if (!user || !user._id) return;
    setLoading(true);
    try {
      const response = await Api.accounts.getProfile(user._id);
      setProfile(response.data);
      setIsDeleted(response.data.is_deleted === true);
      setFormData({
        username: response.data.username,
        name: response.data.name || "",
        email: response.data.email,
        phone: response.data.phone || "",
        address: response.data.address || "",
        image: response.data.image || "",
      });
      showToast("Profile loaded successfully!", "success", 2000);
    } catch (err) {
      console.error("Fetch profile error:", err.response || err.message);
      showToast("Failed to fetch profile", "error", 4000);
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (editMode) {
      firstInputRef.current?.focus();
      if (!selectedFile && profile?.image) {
        setPreviewUrl(profile.image);
      }
    } else {
      setPreviewUrl("");
    }
  }, [editMode, profile, selectedFile]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    const { username, name, email, phone, address } = formData;

    if (!username.trim()) newErrors.username = "Username cannot be blank";
    if (!name.trim()) newErrors.name = "Full name cannot be blank";
    if (!email.trim()) newErrors.email = "Email cannot be blank";
    if (!phone.trim()) newErrors.phone = "Phone cannot be blank";
    if (!address.trim()) newErrors.address = "Address cannot be blank";

    const hasImage = Boolean(formData.image?.trim() || selectedFile || profile?.image);
    if (!hasImage) newErrors.image = "Image cannot be blank";

    if (username && (username.length < 3 || username.length > 30)) {
      newErrors.username = "Username must be 3-30 characters";
    }
    if (name && name.length > 50) newErrors.name = "Name cannot exceed 50 characters";
    if (email && !/^\S+@\S+\.\S+$/.test(email))
      newErrors.email = "Valid email is required";
    if (phone && !/^\d{10}$/.test(phone))
      newErrors.phone = "Phone must be exactly 10 digits";
    if (address && address.length > 100)
      newErrors.address = "Address cannot exceed 100 characters";

    if (Object.keys(newErrors).length > 0) {
      Object.values(newErrors).forEach((msg) =>
        showToast(msg, "error", 3000)
      );
      return false;
    }
    return true;
  }, [formData, profile, selectedFile, showToast]);

  const updateProfile = useCallback(async () => {
    setLoading(true);
    try {
      const updateData = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        image: formData.image,
      };
      const response = await Api.accounts.updateProfile(user._id, updateData);
      setProfile(response.data.account);
      setEditMode(false);
      showToast("Profile updated successfully!", "success", 2000);
    } catch (err) {
      console.error("Update profile error:", err.response || err.message);
      const errorMessage =
        err.response?.status === 409
          ? "Username or email already exists"
          : err.response?.data?.errors?.[0]?.msg || "Failed to update profile";
      showToast(errorMessage, "error", 4000);
    } finally {
      setLoading(false);
    }
  }, [formData, user, showToast]);

  const updateProfileWithImage = useCallback(
    (imageUrl) => {
      setLoading(true);
      const updateData = {
        ...formData,
        image: imageUrl,
      };
      Api.accounts
        .updateProfile(user._id, updateData)
        .then((response) => {
          setProfile(response.data.account);
          setEditMode(false);
          showToast("Profile updated successfully!", "success", 2000);
        })
        .catch((err) => {
          console.error("Update profile with image error:", err.response || err.message);
          const errorMessage =
            err.response?.status === 409
              ? "Username or email already exists"
              : err.response?.data?.errors?.[0]?.msg ||
              "Failed to update profile";
          showToast(errorMessage, "error", 4000);
        })
        .finally(() => setLoading(false));
    },
    [formData, user, showToast]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      if (invalidFile) {
        showToast("Invalid file selected. Please choose an image.", "error", 3000);
        return;
      }

      if (selectedFile) {
        // gọi API upload ảnh
        Api.upload
          .image(selectedFile)
          .then((response) => {
            const imageUrl = response.data?.url || response.data?.imageUrl;
            if (imageUrl) {
              showToast("Image uploaded successfully!", "success", 2000);
              updateProfileWithImage(imageUrl);
            } else {
              showToast(
                "Upload completed but server did not return URL.",
                "error",
                3000
              );
            }
          })
          .catch((err) => {
            console.error("Upload failed:", err.response?.data || err.message);
            showToast("An error occurred during upload.", "error", 3000);
          });
      } else {
        updateProfile();
      }
    },
    [
      validateForm,
      selectedFile,
      invalidFile,
      updateProfile,
      updateProfileWithImage,
      showToast,
    ]
  );

  const handleCancel = useCallback(() => {
    setEditMode(false);
    setFormData({
      username: profile?.username || "",
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      image: profile?.image || "",
    });
    setSelectedFile(null);
    setPreviewUrl("");
    setInvalidFile(false);
  }, [profile]);

  const handleDeleteConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await Api.accounts.softDeleteAccount(user._id);
      setIsDeleted(true);
      logout();
      showToast("Account soft deleted successfully!", "success", 2000);
      navigate("/login");
    } catch {
      showToast("Failed to soft delete account", "error", 4000);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [user, logout, navigate, showToast]);

  if (!user) {
    return <div className="w-full h-full"></div>;
  }

  return (
    <div className="flex justify-center items-center py-10 bg-gray-50 min-h-screen">
      {loading ? (
        <div className="text-gray-500 text-sm p-4">Loading...</div>
      ) : profile ? (
        <div className="w-full max-w-md bg-white rounded-lg shadow p-10 text-center">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>

          {/* Avatar */}
          {profile.image && (
            <div className="flex justify-center mb-8">
              <img
                src={profile.image}
                alt={profile.username || "Profile"}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-300"
              />
            </div>
          )}

          {/* Info */}
          <div className="space-y-3 text-gray-800 mb-8 text-lg">
            <p>
              <span className="font-semibold">Username:</span> {profile.username}
            </p>
            <p>
              <span className="font-semibold">Name:</span>{" "}
              {profile.name || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {profile.email}
            </p>
            <p>
              <span className="font-semibold">Phone:</span>{" "}
              {profile.phone || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Address:</span>{" "}
              {profile.address || "N/A"}
            </p>
          </div>

          {/* Buttons */}
          {!isDeleted && (
            <div className="flex flex-col gap-3">
              <button
                className="px-6 py-3 rounded-full bg-yellow-400 hover:bg-yellow-500 text-base font-semibold"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
              <button
                className="px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold"
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </button>
              <button
                className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-base font-semibold"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Close Account
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-red-50 text-red-600 border border-red-300 p-3 rounded text-sm flex items-center gap-2">
          ⚠ Profile not found
        </div>
      )}

      {/* Modal Edit Profile */}
      {editMode && (
        <EditProfileModal
          formData={formData}
          setFormData={setFormData}
          previewUrl={previewUrl}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
        />

      )}

      {/* Modal Change Password */}
      {showChangePassword && (
        <ChangePasswordModal handleCancel={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export default Profile;
