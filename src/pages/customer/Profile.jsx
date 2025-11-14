import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Api from "../../common/SummaryAPI";
import { useToast } from "../../hooks/useToast";

// Import modal
import EditProfileModal from "../../components/EditProfileModal";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import ProductButton from "../../components/ProductButton";

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
    gender: "",
    dob: "",
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
        gender: response.data.gender || "",
        dob: response.data.dob || "",
        image: response.data.image || "",
      });
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
    if (name && !/^[\p{L}\p{N}\s]+$/u.test(name))
      newErrors.name = "Name can only contain letters, numbers, and spaces";
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
        gender: formData.gender,
        dob: formData.dob,
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
        gender: formData.gender,
        dob: formData.dob,
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
            console.error("❌ Upload failed details:", {
              message: err.message,
              status: err.response?.status,
              data: err.response?.data,
              config: err.config
            });
            showToast(`Upload failed: ${err.response?.data?.message || err.message}`, "error", 5000);
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
      gender: profile?.gender || "",
      dob: profile?.dob || "",
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
    <div className="bg-gray-50 pt-6 pb-4 px-4">
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Profile Card */}
            <div className="lg:col-span-1 flex">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full flex flex-col pt-2">
                {/* Header */}
                <div className="bg-gray-50 p-8 text-center border-b border-gray-200">
                  <div className="relative inline-block">
                    <img
                      src={profile.image || "https://via.placeholder.com/120x120?text=No+Image"}
                      alt={profile.username || "Profile"}
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/120x120?text=No+Image";
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-900 mt-4">{profile.name || profile.username}</h1>
                  <p className="text-gray-500 text-base">@{profile.username}</p>
                </div>

                {/* Action Buttons */}
                {!isDeleted ? (
                  <div className="p-6 space-y-3 flex-grow flex flex-col justify-end">
                    <ProductButton
                      variant="primary"
                      size="lg"
                      onClick={() => setEditMode(true)}
                      className="w-full"
                    >
                      Edit Profile
                    </ProductButton>
                    <ProductButton
                      variant="secondary"
                      size="lg"
                      onClick={() => setShowChangePassword(true)}
                      className="w-full"
                    >
                      Change Password
                    </ProductButton>
                    <ProductButton
                      variant="danger"
                      size="lg"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full"
                    >
                      Close Account
                    </ProductButton>
                  </div>
                ) : (
                  <div className="p-6 flex-grow flex flex-col justify-end">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-red-800 font-semibold">Account Deleted</span>
                      </div>
                      <p className="text-red-600 text-sm text-center">
                        This account has been soft deleted and is no longer active.
                      </p>
                    </div>
                    <ProductButton
                      variant="default"
                      size="lg"
                      onClick={logout}
                      className="w-full"
                    >
                      Return to Login
                    </ProductButton>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 flex">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full flex flex-col pt-2">
                <div className="bg-gray-50 border-b border-gray-200 p-5">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                </div>

                <div className="p-5 flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal Information */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>

                      <div className="space-y-2">
                        <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Username</p>
                            <p className="font-medium text-gray-900">@{profile.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Full Name</p>
                            <p className="font-medium text-gray-900">{profile.name || "Not provided"}</p>
                          </div>
                        </div>

                        <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                            <p className="font-medium text-gray-900">{profile.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                            <p className="font-medium text-gray-900">{profile.phone || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Additional Information</h3>

                      <div className="space-y-2">
                        <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                            <p className="font-medium text-gray-900">{profile.address || "Not provided"}</p>
                          </div>
                        </div>

                        {profile.gender && (
                          <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Gender</p>
                              <p className="font-medium text-gray-900 capitalize">{profile.gender}</p>
                            </div>
                          </div>
                        )}

                        {profile.dob && (
                          <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                              <p className="font-medium text-gray-900">{new Date(profile.dob).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Member Since</p>
                            <p className="font-medium text-gray-900">{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
              <p className="text-gray-600 text-sm">We couldn't find your profile information. Please try refreshing the page.</p>
            </div>
          </div>
        )}
      </div>

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

      {/* Modal Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Account Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <ProductButton
                variant="secondary"
                size="md"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </ProductButton>
              <ProductButton
                variant="danger"
                size="md"
                onClick={handleDeleteConfirm}
              >
                Delete Account
              </ProductButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
