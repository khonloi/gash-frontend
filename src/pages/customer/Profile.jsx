import React, { useEffect, useRef } from "react";
import { useProfile } from "../../features/auth/hooks/useProfile";
import Button from "../../components/ui/Button";
import { User, Tag, Mail, Phone, Users, Calendar, MapPin } from "lucide-react";
import LocalChangePasswordModal from "../../features/auth/components/LocalChangePasswordModal";
import LocalEditProfileModal from "../../features/auth/components/LocalEditProfileModal";
import SecuritySection from "../../features/auth/components/SecuritySection";

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
                          {isSettingUpPasskey ? 'Setting up...' : passkeys.length > 0 ? 'Passkey Enabled' : 'Setup Passkey'}
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
                <SecuritySection
                  requireAuthForCheckout={requireAuthForCheckout}
                  handleToggleCheckoutAuth={handleToggleCheckoutAuth}
                  isDemoMode={isDemoMode}
                  showDemoNotice={showDemoNotice}
                  passkeys={passkeys}
                  handleDeletePasskey={handleDeletePasskey}
                  handleSetupPasskey={handleSetupPasskey}
                />

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

export default Profile;

