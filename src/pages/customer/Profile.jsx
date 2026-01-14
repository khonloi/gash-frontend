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
import { startRegistration } from "@simplewebauthn/browser";

import EditProfileModal from "../../components/EditProfileModal";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import ProductButton from "../../components/ProductButton";
import { User, Tag, Mail, Phone, Users, Calendar, MapPin, Key } from "lucide-react";

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
  const [passkeys, setPasskeys] = useState([]);
  const [isSettingUpPasskey, setIsSettingUpPasskey] = useState(false);
  const [requireAuthForCheckout, setRequireAuthForCheckout] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] = useState(null);
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
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const firstInputRef = useRef(null);
  const { showToast } = useToast();

  // Handle chọn file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        showToast("Please select a valid image type", "error", 3000);
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
    setError('');
    try {
      const response = await Api.accounts.getProfile(user._id);
      setProfile(response.data);
      setIsDeleted(response.data.isDeleted === true);
      setFormData({
        username: response.data.username,
        name: response.data.name || "",
        email: response.data.email,
        phone: response.data.phone || "",
        address: response.data.address || "",
        gender: response.data.gender || "",
        dob: response.data.dob ? new Date(response.data.dob).toISOString().split('T')[0] : "",
        image: response.data.image || "",
      });
      setRequireAuthForCheckout(response.data.requireAuthForCheckout || false);
    } catch (err) {
      console.error("Fetch profile error:", err.response || err.message);
      let errorMessage = "Failed to fetch profile";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = "You are not authorized to view profile";
      } else if (err.response?.status === 404) {
        errorMessage = "Profile not found";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later";
      } else if (!err.response) {
        errorMessage = "Failed to fetch profile. Please try again later.";
      } else if (err.message) {
        errorMessage = `Failed to fetch profile: ${err.message}`;
      }
      setError(errorMessage);
      showToast(errorMessage, "error", 4000);
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const fetchPasskeys = useCallback(async () => {
    if (!user || !user._id) return;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await Api.passkeys.getUserPasskeys(token);
        setPasskeys(response.data.passkeys || []);
      }
    } catch (err) {
      console.error('Fetch passkeys error:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchPasskeys();
  }, [fetchPasskeys]);

  const handleSetupPasskey = useCallback(async () => {
    setIsSettingUpPasskey(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please log in again', 'error', 3000);
        return;
      }

      // Get registration options
      const regResponse = await Api.passkeys.generateRegistrationOptions(token);
      const { options, challenge } = regResponse.data; // Get both options and challenge

      console.log('Registration options received:', options);
      console.log('Challenge:', challenge);

      // Start registration - pass the options object directly
      const registrationResponse = await startRegistration(options);
      console.log('Registration response from browser:', registrationResponse);

      // Detect device type
      const deviceType = navigator.userAgent.includes('Mobile') ? 'mobile' :
        navigator.userAgent.includes('Tablet') ? 'tablet' : 'desktop';

      // SimpleWebAuthn browser v13 returns response with base64url strings already
      // But we need to ensure proper format for transmission
      // The response from startRegistration is already in the correct format
      const verifyData = {
        id: registrationResponse.id,
        rawId: registrationResponse.rawId,
        response: registrationResponse.response,
        type: registrationResponse.type,
        challenge: challenge, // Server needs this to verify
        deviceType,
      };

      console.log('Sending verification data:', {
        id: verifyData.id,
        hasRawId: !!verifyData.rawId,
        hasResponse: !!verifyData.response,
        hasClientDataJSON: !!verifyData.response?.clientDataJSON,
        hasAttestationObject: !!verifyData.response?.attestationObject,
        challenge: verifyData.challenge,
        deviceType: verifyData.deviceType
      });

      await Api.passkeys.verifyRegistration(verifyData, token);

      showToast('Passkey authentication set up successfully', 'success', 2000);
      fetchPasskeys();
    } catch (err) {
      console.error('Passkey setup error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to set up passkey authentication';
      showToast(errorMsg, 'error', 3000);
    } finally {
      setIsSettingUpPasskey(false);
    }
  }, [showToast, fetchPasskeys]);

  const handleDeletePasskey = useCallback(async (passkeyId) => {
    setPasskeyToDelete(passkeyId);
  }, []);

  const confirmDeletePasskey = useCallback(async () => {
    if (!passkeyToDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please log in again', 'error', 3000);
        setPasskeyToDelete(null);
        return;
      }

      await Api.passkeys.deletePasskey(passkeyToDelete, token);
      showToast('Passkey authentication removed successfully', 'success', 2000);
      fetchPasskeys();
      setPasskeyToDelete(null);
    } catch (err) {
      console.error('Delete passkey error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to remove passkey authentication';
      showToast(errorMsg, 'error', 3000);
      setPasskeyToDelete(null);
    }
  }, [passkeyToDelete, showToast, fetchPasskeys]);

  const handleToggleCheckoutAuth = useCallback(async (checked) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please log in again', 'error', 3000);
        return;
      }

      await Api.auth.updateCheckoutAuthSetting(checked, token);
      setRequireAuthForCheckout(checked);
      showToast(
        checked
          ? 'Checkout authentication enabled. You will need to authenticate before placing orders.'
          : 'Checkout authentication disabled.',
        'success',
        3000
      );
    } catch (err) {
      console.error('Update checkout auth setting error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update setting';
      showToast(errorMsg, 'error', 3000);
    }
  }, [showToast]);

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

    if (!username.trim()) newErrors.username = "Please fill in all required fields";
    if (!name.trim()) newErrors.name = "Please fill in all required fields";
    if (!email.trim()) newErrors.email = "Please fill in all required fields";
    if (!phone.trim()) newErrors.phone = "Please fill in all required fields";
    if (!address.trim()) newErrors.address = "Please fill in all required fields";

    const hasImage = Boolean(formData.image?.trim() || selectedFile || profile?.image);
    if (!hasImage) newErrors.image = "Please fill in all required fields";

    if (username && (username.length < 5 || username.length > 30)) {
      newErrors.username = "Username must be between 5 and 30 characters";
    }
    if (name && name.length > 50) {
      newErrors.name = "Name must be at most 50 characters";
    }
    if (name && !/^[\p{L}\s]+$/u.test(name))
      newErrors.name = "Name must contain only letters and spaces";
    if (email && !/^\S+@\S+\.\S+$/.test(email))
      newErrors.email = "Valid email is required";
    if (phone && !/^\d{10}$/.test(phone))
      newErrors.phone = "Phone must be exactly 10 digits";
    if (address && address.length > 200)
      newErrors.address = "Address must be at most 200 characters";

    // Validate image format if provided
    if (hasImage) {
      if (selectedFile) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(selectedFile.type.toLowerCase())) {
          newErrors.image = "Please select a valid image type";
        }
      } else if (formData.image?.trim()) {
        const imageUrl = formData.image.trim().toLowerCase();
        if (!imageUrl.match(/\.(png|jpg|jpeg)$/i) && !imageUrl.startsWith('data:image/')) {
          newErrors.image = "Please select a valid image type";
        }
      }
    }

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
      await fetchProfile();
      setEditMode(false);
      showToast("Profile edited successfully", "success", 2000);
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
  }, [formData, user, showToast, fetchProfile]);

  const updateProfileWithImage = useCallback(
    (imageUrl) => {
      const updateData = {
        ...formData,
        image: imageUrl,
        gender: formData.gender,
        dob: formData.dob,
      };
      Api.accounts
        .updateProfile(user._id, updateData)
        .then(async (response) => {
          await fetchProfile();
          setEditMode(false);
          showToast("Profile edited successfully", "success", 2000);
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
    [formData, user, showToast, fetchProfile]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      if (invalidFile) {
        showToast("Invalid file selected. Please choose an image.", "error", 3000);
        return;
      }

      setLoading(true);

      if (selectedFile) {
        // gọi API upload ảnh
        Api.upload
          .image(selectedFile)
          .then((response) => {
            const imageUrl = response.data?.url || response.data?.imageUrl;
            if (imageUrl) {
              showToast("Image uploaded successfully", "success", 2000);
              updateProfileWithImage(imageUrl);
            } else {
              showToast(
                "Upload completed but server did not return URL.",
                "error",
                3000
              );
              setLoading(false);
            }
          })
          .catch((err) => {
            console.error("Upload failed details:", {
              message: err.message,
              status: err.response?.status,
              data: err.response?.data,
              config: err.config
            });
            showToast(`Upload failed: ${err.response?.data?.message || err.message}`, "error", 5000);
            setLoading(false);
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
      showToast("Account soft deleted successfully", "success", 2000);
      navigate("/login");
    } catch {
      showToast("Failed to soft delete account", "error", 4000);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [user, logout, navigate, showToast]);

  const ProfileSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded-lg w-48 mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border-2 border-gray-300 p-8 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-6"></div>
          <div className="w-full space-y-3">
            <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-300 overflow-hidden">
          <div className="h-14 bg-gray-50 border-b-2 border-gray-300 px-6 flex items-center">
            <div className="h-5 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-20"></div>
                <div className="h-12 bg-gray-50 rounded-xl border-2 border-gray-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return <div className="min-h-screen bg-gray-50/50"></div>;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {loading || !profile ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="bg-white rounded-xl border-2 border-gray-300 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Profile</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
            <ProductButton variant="primary" onClick={fetchProfile} className="px-8">
              Retry
            </ProductButton>
          </div>
        ) : (
          <React.Fragment>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border-2 border-gray-300 shadow-sm overflow-hidden sticky top-24">
                  <div className="bg-gray-50 p-8 border-b-2 border-gray-300">
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <img
                        src={profile.image || "https://via.placeholder.com/128x128?text=User"}
                        alt={profile.username}
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/128x128?text=User"; }}
                      />
                      <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                        {profile.name || profile.username}
                      </h2>
                      <p className="text-amber-600 font-medium mt-1">@{profile.username}</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    {!isDeleted ? (
                      <>
                        <ProductButton variant="primary" onClick={() => setEditMode(true)} className="w-full justify-center py-3">
                          Edit Profile
                        </ProductButton>
                        <ProductButton variant="secondary" onClick={() => setShowChangePassword(true)} className="w-full justify-center py-3">
                          Change Password
                        </ProductButton>
                        <ProductButton
                          variant="secondary"
                          onClick={handleSetupPasskey}
                          disabled={isSettingUpPasskey || passkeys.length > 0}
                          className="w-full justify-center py-3"
                        >
                          {isSettingUpPasskey ? 'Setting up...' : passkeys.length > 0 ? 'Passkey Enabled ✓' : 'Setup Passkey'}
                        </ProductButton>
                        <div className="pt-4 border-t-2 border-gray-300">
                          <ProductButton variant="danger" onClick={() => setShowDeleteConfirm(true)} className="w-full justify-center py-3">
                            Close Account
                          </ProductButton>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border-2 border-red-200 text-sm font-medium mb-4">
                          This account has been deactivated.
                        </div>
                        <ProductButton variant="primary" onClick={logout} className="w-full justify-center">
                          Return to Login
                        </ProductButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Information Sections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-xl border-2 border-gray-300 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b-2 border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {[
                      { label: "Username", value: `@${profile.username}`, icon: User },
                      { label: "Full Name", value: profile.name || "Not set", icon: Tag },
                      { label: "Email Address", value: profile.email, icon: Mail },
                      { label: "Phone Number", value: profile.phone || "Not set", icon: Phone },
                      { label: "Gender", value: profile.gender || "Not set", icon: Users, capitalize: true },
                      { label: "Date of Birth", value: profile.dob ? new Date(profile.dob).toLocaleDateString() : "Not set", icon: Calendar },
                      { label: "Address", value: profile.address || "Not set", icon: MapPin, colSpan: true },
                    ].map((item, i) => (
                      <div key={i} className={`${item.colSpan ? 'md:col-span-2' : ''} group`}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{item.label}</p>
                        <div className="flex items-center p-3.5 bg-gray-50 rounded-xl border-2 border-gray-300 group-hover:border-amber-400 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center mr-3 shrink-0">
                            <item.icon className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className={`text-gray-900 font-medium ${item.capitalize ? 'capitalize' : ''}`}>
                            {item.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-xl border-2 border-gray-300 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b-2 border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900">Authentication & Security</h3>
                  </div>
                  <div className="p-6 space-y-8">
                    {/* Checkout Auth Toggle */}
                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-300">
                      <div className="mr-4">
                        <h4 className="font-bold text-gray-900 mb-1">Require Authentication for Checkout</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          For extra security, you'll be asked to authenticate via password, Google, or Passkey before placing any order.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={requireAuthForCheckout}
                          onChange={(e) => handleToggleCheckoutAuth(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {/* Passkeys */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Passkeys</h4>
                      {passkeys.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {passkeys.map((pk) => (
                            <div key={pk.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-300">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center mr-3">
                                  <Key className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 capitalize">{pk.deviceType || 'Device'}</p>
                                  <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">
                                    Added {new Date(pk.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeletePasskey(pk.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove passkey"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <p className="text-gray-500 text-sm">No passkeys linked to this account yet.</p>
                          <button
                            onClick={handleSetupPasskey}
                            className="mt-3 text-amber-600 text-sm font-bold hover:underline"
                          >
                            Setup Passkey Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    Member Since {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </React.Fragment>
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
            selectedFile={selectedFile}
            profile={profile}
            loading={loading}
          />
        )}

        {/* Modal Change Password */}
        {showChangePassword && (
          <ChangePasswordModal handleCancel={() => setShowChangePassword(false)} />
        )}

        {/* Modal Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-300 p-8 max-w-md w-full">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border-2 border-red-200">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Close Your Account?</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                This will deactivate your account. You won't be able to log in or access your orders until it's reactivated by support.
              </p>
              <div className="flex gap-3">
                <ProductButton
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 justify-center py-3"
                >
                  Keep Account
                </ProductButton>
                <ProductButton
                  variant="danger"
                  onClick={handleDeleteConfirm}
                  className="flex-1 justify-center py-3"
                >
                  Yes, Close It
                </ProductButton>
              </div>
            </div>
          </div>
        )}

        {/* Modal Delete Passkey Confirmation */}
        {passkeyToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl border-2 border-gray-300 p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Passkey?</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                You won't be able to use this device for biometric login. You can set it up again at any time.
              </p>
              <div className="flex gap-3">
                <ProductButton
                  variant="secondary"
                  onClick={() => setPasskeyToDelete(null)}
                  className="flex-1 justify-center py-3"
                >
                  Cancel
                </ProductButton>
                <ProductButton
                  variant="danger"
                  onClick={confirmDeletePasskey}
                  className="flex-1 justify-center py-3"
                >
                  Remove Device
                </ProductButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
