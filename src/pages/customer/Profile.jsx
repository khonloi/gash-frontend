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

import { useProfile } from "../../features/auth/hooks/useProfile";
import Button from "../../components/ui/Button";
import { User, Tag, Mail, Phone, Users, Calendar, MapPin, Key, Camera } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/ui/PasswordInput";
import { useChangePassword } from "../../features/auth/hooks/useChangePassword";


const Profile = () => {
    const {
        user,
        profile,
        editMode,
        setEditMode,
        loading,
        error,
        selectedFile,
        previewUrl,
        passkeys,
        isSettingUpPasskey,
        passkeyToDelete,
        setPasskeyToDelete,
        requireAuthForCheckout,
        isDeleted,
        showDeleteConfirm,
        setShowDeleteConfirm,
        showChangePassword,
        setShowChangePassword,
        formData,
        setFormData,
        isDemoMode,
        showDemoNotice,
        handleFileChange,
        handleSetupPasskey,
        handleDeletePasskey,
        confirmDeletePasskey,
        handleToggleCheckoutAuth,
        handleSubmit,
        handleCancel,
        handleDeleteConfirm
    } = useProfile();
    
    const firstInputRef = useRef(null);

    useEffect(() => {
        if (editMode) {
            firstInputRef.current?.focus();
        }
    }, [editMode]);

  const ProfileSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-6 sm:h-8 bg-gray-200 rounded-lg w-48 mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border-2 border-gray-300 overflow-hidden h-fit">
          <div className="p-6 sm:p-8 flex items-center gap-4 border-b-2 border-gray-100 bg-gray-50/30">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
            <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
            <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-300 overflow-hidden">
          <div className="h-14 bg-gray-50 border-b-2 border-gray-300 px-6 flex items-center">
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-40"></div>
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
    <div className="page-container">
      <div>
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
            <Button variant="primary" onClick={fetchProfile} className="px-8">
              Retry
            </Button>
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
                  <div className="bg-gray-50 p-6 sm:p-8 border-b-2 border-gray-300 flex items-center gap-4 sm:gap-6">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                      <img
                        src={profile.image || "https://via.placeholder.com/128x128?text=User"}
                        alt={profile.username}
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-sm"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/128x128?text=User"; }}
                      />
                      <div className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 border-[3px] sm:border-4 border-white rounded-full"></div>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">
                        {profile.name || profile.username}
                      </h2>
                      <p className="text-sm sm:text-base text-amber-600 font-medium mt-0.5 sm:mt-1 truncate">@{profile.username}</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    {!isDeleted ? (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => isDemoMode ? showDemoNotice() : setEditMode(true)}
                          className="w-full justify-center py-3"
                        >
                          Update Profile
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => isDemoMode ? showDemoNotice() : setShowChangePassword(true)}
                          className="w-full justify-center py-3"
                        >
                          Change Password
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => isDemoMode ? showDemoNotice() : handleSetupPasskey()}
                          disabled={!isDemoMode && (isSettingUpPasskey || passkeys.length > 0)}
                          className="w-full justify-center py-3"
                        >
                          {isSettingUpPasskey ? 'Setting up...' : passkeys.length > 0 ? 'Passkey Enabled ✓' : 'Setup Passkey'}
                        </Button>
                        <div className="pt-4 border-t-2 border-gray-300">
                          <Button
                            variant="danger"
                            onClick={() => isDemoMode ? showDemoNotice() : setShowDeleteConfirm(true)}
                            className="w-full justify-center py-3"
                          >
                            Close Account
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border-2 border-red-200 text-sm font-medium mb-4">
                          This account has been deactivated.
                        </div>
                        <Button variant="primary" onClick={logout} className="w-full justify-center">
                          Return to Login
                        </Button>
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
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Personal Information</h3>
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
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{item.label}</p>
                        <div className="flex items-center p-3.5 bg-gray-50 rounded-xl border-2 border-gray-300 group-hover:border-amber-400 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center mr-3 shrink-0">
                            <item.icon className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className={`text-sm sm:text-base text-gray-900 font-medium ${item.capitalize ? 'capitalize' : ''}`}>
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
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Authentication & Security</h3>
                  </div>
                  <div className="p-6 space-y-8">
                    {/* Checkout Auth Toggle */}
                    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-300">
                      <div className="mr-4">
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1">Require Authentication for Checkout</h4>
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                          For extra security, you'll be asked to authenticate via password, Google, or Passkey before placing any order.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={requireAuthForCheckout}
                          onChange={(e) => isDemoMode ? showDemoNotice() : handleToggleCheckoutAuth(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {/* Passkeys */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Passkeys</h4>
                      {passkeys.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {passkeys.map((pk) => (
                            <div key={pk.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-300">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center mr-3">
                                  <Key className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-bold text-gray-900 capitalize">{pk.deviceType || 'Device'}</p>
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

        {/* Modal Update Profile */}
        <LocalEditProfileModal
          isOpen={editMode}
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

        {/* Modal Change Password */}
        <LocalChangePasswordModal
          isOpen={showChangePassword}
          handleCancel={() => setShowChangePassword(false)}
        />

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
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 justify-center py-3"
                >
                  Keep Account
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteConfirm}
                  className="flex-1 justify-center py-3"
                >
                  Yes, Close It
                </Button>
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
                <Button
                  variant="secondary"
                  onClick={() => setPasskeyToDelete(null)}
                  className="flex-1 justify-center py-3"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDeletePasskey}
                  className="flex-1 justify-center py-3"
                >
                  Remove Device
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LocalChangePasswordModal = ({ isOpen, handleCancel }) => {
  const {
    form,
    loading,
    validationErrors,
    handleFieldChange,
    handleSubmit
  } = useChangePassword(handleCancel);

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <Modal.Header>Change Password</Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            { label: "Current Password", key: "oldPassword" },
            { label: "New Password", key: "newPassword" },
            { label: "Confirm New Password", key: "repeatPassword" },
          ].map((field) => (
            <PasswordInput
              key={field.key}
              label={field.label}
              required
              value={form[field.key]}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              error={validationErrors[field.key]}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          ))}
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-2.5"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-2.5 min-w-[120px] justify-center"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Updating...</span>
            </div>
          ) : (
            'Update Password'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const LocalEditProfileModal = ({
  isOpen,
  formData,
  setFormData,
  previewUrl,
  handleFileChange,
  handleSubmit,
  handleCancel,
  selectedFile,
  profile,
  loading,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});

  const validateField = useCallback((name, value, currentFormData = formData) => {
    switch (name) {
      case 'name': {
        if (!value || value.trim() === '') return 'Please fill in all required fields';
        const trimmedName = value.trim();
        if (trimmedName.length > 50) {
          return 'Name must be at most 50 characters';
        }
        if (!/^[\p{L}\s]+$/u.test(trimmedName)) {
          return 'Name must contain only letters and spaces';
        }
        return null;
      }
      case 'phone': {
        if (!value || value.trim() === '') return 'Please fill in all required fields';
        if (!/^\d{10}$/.test(value.trim())) {
          return 'Phone must be exactly 10 digits';
        }
        return null;
      }
      case 'address': {
        if (!value || value.trim() === '') return 'Please fill in all required fields';
        const trimmedAddress = value.trim();
        if (trimmedAddress.length > 200) {
          return 'Address must be at most 200 characters';
        }
        return null;
      }
      case 'dob': {
        if (!value || value.trim() === '') return 'Please fill in all required fields';
        return null;
      }
      case 'image': {
        const hasImage = Boolean(currentFormData.image?.trim() || selectedFile || profile?.image);
        if (!hasImage) return 'Please fill in all required fields';
        if (currentFormData.image?.trim() && !selectedFile) {
          const imageUrl = currentFormData.image.trim().toLowerCase();
          if (!imageUrl.match(/\.(png|jpg|jpeg)$/i) && !imageUrl.startsWith('data:image/')) {
            return 'Please select a valid image type';
          }
        }
        if (selectedFile) {
          const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
          if (!validTypes.includes(selectedFile.type.toLowerCase())) {
            return 'Please select a valid image type';
          }
        }
        return null;
      }
      default:
        return null;
    }
  }, [formData, selectedFile, profile]);

  const validateForm = useCallback(() => {
    const errors = {};
    const nameError = validateField('name', formData.name);
    if (nameError) errors.name = nameError;

    const phoneError = validateField('phone', formData.phone);
    if (phoneError) errors.phone = phoneError;

    const addressError = validateField('address', formData.address);
    if (addressError) errors.address = addressError;

    const dobError = validateField('dob', formData.dob);
    if (dobError) errors.dob = dobError;

    const imageError = validateField('image', formData.image);
    if (imageError) errors.image = imageError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      const error = validateField(field, value, updated);
      setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
      return updated;
    });
  }, [validateField, setFormData]);

  const handleSubmitWithValidation = useCallback((e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please check the input fields again', 'error');
      return;
    }
    handleSubmit(e);
  }, [validateForm, handleSubmit, showToast]);

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} maxWidth="max-w-lg">
      <Modal.Header>Update Profile</Modal.Header>
      <Modal.Body>
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className={`w-28 h-28 rounded-full p-1 bg-white border-2 ${validationErrors.image ? 'border-red-500' : 'border-gray-300 shadow-sm'}`}>
              <img
                src={previewUrl || formData.image || "https://via.placeholder.com/128x128?text=User"}
                alt="Preview"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => { e.target.src = "https://via.placeholder.com/128x128?text=User"; }}
              />
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 w-9 h-9 bg-amber-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg hover:bg-amber-600 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="Change Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => {
              handleFileChange(e);
              if (e.target.files?.length > 0) {
                setValidationErrors(prev => {
                  const next = { ...prev };
                  delete next.image;
                  return next;
                });
              }
            }}
          />
          {validationErrors.image && (
            <p className="mt-2 text-xs font-bold text-red-500 uppercase tracking-wider">{validationErrors.image}</p>
          )}
        </div>

        <form onSubmit={handleSubmitWithValidation} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {[
              { label: "Full Name", type: "text", key: "name", required: true, icon: Tag },
              { label: "Phone Number", type: "text", key: "phone", required: true, icon: Phone },
              { label: "Address", type: "text", key: "address", required: true, icon: MapPin },
              { label: "Gender", type: "select", key: "gender", options: ["Male", "Female", "Other"], icon: Users },
              { label: "Date of Birth", type: "date", key: "dob", required: true, icon: Calendar },
            ].map((field) => (
              <div key={field.key}>
                {field.type === "select" ? (
                  <div className="w-full relative">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      {field.label}
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <field.icon className="w-5 h-5" />
                      </div>
                      <select
                        value={formData[field.key] ?? ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 bg-gray-50 border-2 rounded-xl transition-all outline-none appearance-none ${validationErrors[field.key] ? 'border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-amber-400 focus:bg-white'}`}
                      >
                        {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <Input
                    label={field.label}
                    type={field.type}
                    required={field.required}
                    value={formData[field.key] ?? ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    error={validationErrors[field.key]}
                    leftIcon={<field.icon className="w-5 h-5" />}
                  />
                )}
              </div>
            ))}
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-2.5"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmitWithValidation}
          disabled={loading}
          className="px-8 py-2.5 min-w-[120px] justify-center"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            'Save Changes'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Profile;

