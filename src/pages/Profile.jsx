import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Api from '../common/SummaryAPI';
import '../styles/Profile.css';
import { useToast } from '../components/Toast';

const Profile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [invalidFile, setInvalidFile] = useState(false);

  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    image: '',
    password: '',
    repeatPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const firstInputRef = useRef(null);
  const { showToast } = useToast();

  //  Handle chọn file
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
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await Api.accounts.getProfile(user._id);
      setProfile(response.data);
      setIsDeleted(response.data.is_deleted === true);
      setFormData({
        username: response.data.username,
        name: response.data.name || '',
        email: response.data.email,
        phone: response.data.phone || '',
        address: response.data.address || '',
        image: response.data.image || '',
        password: '',
        repeatPassword: '',
      });
      showToast('Profile loaded successfully!', 'success', 2000);
    } catch {
      showToast('Failed to fetch profile', 'error', 4000);
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
      if (!selectedFile && profile && profile.image) {
        setPreviewUrl(profile.image);
      }
    } else {
      setPreviewUrl("");
    }
  }, [editMode, profile, selectedFile]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    const username = formData.username.trim();
    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const address = formData.address.trim();
    const password = formData.password.trim();
    const repeatPassword = formData.repeatPassword.trim();

    if (!username) newErrors.username = 'Username cannot be blank';
    if (!name) newErrors.name = 'Full name cannot be blank';
    if (!email) newErrors.email = 'Email cannot be blank';
    if (!phone) newErrors.phone = 'Phone cannot be blank';

    if (!address) newErrors.address = 'Address cannot be blank';
    const hasImage = Boolean(
      (formData.image && formData.image.trim()) || selectedFile || (profile && profile.image)
    );
    if (!hasImage) {
      newErrors.image = 'Image cannot be blank';
    }

    if (username && (username.length < 3 || username.length > 30)) {
      newErrors.username = 'Username must be 3-30 characters';
    }
    if (name && name.length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Valid email is required';
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Phone must be exactly 10 digits';
    }
    if (address && address.length > 100) {
      newErrors.address = 'Address cannot exceed 100 characters';
    }
    if (password && password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password && password !== repeatPassword) {
      newErrors.repeatPassword = 'Passwords do not match';
    }



    if (Object.keys(newErrors).length > 0) {
      Object.values(newErrors).forEach((msg) => showToast(msg, 'error', 3000));
      return false;
    }
    return true;
  }, [formData, showToast, profile, selectedFile]);

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
        ...(formData.password && { password: formData.password }),
      };
      const token = localStorage.getItem('token');
      const response = await Api.accounts.updateProfile(user._id, updateData);
      setProfile(response.data.account);
      setEditMode(false);
      showToast('Profile updated successfully!', 'success', 2000);
    } catch (err) {
      const errorMessage = err.response?.status === 409
        ? 'Username or email already exists'
        : err.response?.data?.errors?.[0]?.msg || 'Failed to update profile';
      showToast(errorMessage, 'error', 4000);
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
        password: formData.password || undefined,
      };
      Api.accounts.updateProfile(user._id, updateData)
        .then((response) => {
          setProfile(response.data.account);
          setEditMode(false);
          showToast('Profile updated successfully!', 'success', 2000);
        })
        .catch((err) => {
          const errorMessage = err.response?.status === 409
            ? 'Username or email already exists'
            : err.response?.data?.errors?.[0]?.msg || 'Failed to update profile';
          showToast(errorMessage, 'error', 4000);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [formData, user, showToast]
  );

  //  Chặn update nếu file invalid
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      if (invalidFile) {
        showToast("Invalid file selected. Please choose an image.", "error", 3000);
        return;
      }

      if (selectedFile) {
        Api.upload.image(selectedFile)
          .then((response) => {
            console.log("Upload response:", response.data);
            const imageUrl = response.data?.url;
            if (imageUrl) {
              showToast("Image uploaded successfully!", "success", 2000);
              updateProfileWithImage(imageUrl);
            } else {
              showToast("Upload completed but server did not return URL.", "error", 3000);
            }
          })
          .catch((err) => {
            showToast("An error occurred during upload.", "error", 3000);
            console.error("Upload error:", err, err?.response?.data);
          });
      } else {
        updateProfile();
      }
    },
    [validateForm, selectedFile, invalidFile, updateProfile, updateProfileWithImage, showToast]
  );

  const handleCancel = useCallback(() => {
    setEditMode(false);
    setFormData({
      username: profile?.username || '',
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      image: profile && profile.image ? profile.image : '',
      password: '',
      repeatPassword: '',
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setInvalidFile(false);
  }, [profile]);

  const handleDeleteConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await Api.accounts.softDeleteAccount(user._id);
      setIsDeleted(true);
      logout();
      showToast('Account soft deleted successfully!', 'success', 2000);
      navigate('/login');
    } catch {
      showToast('Failed to soft delete account', 'error', 4000);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [user, logout, navigate, showToast]);

  if (!user) {
    return <div className="profile-container"></div>;
  }

  return (
    <div className="profile-container">
      {loading ? (
        <div className="profile-loading" role="status">Loading...</div>
      ) : profile ? (
        <div className="profile-box">
          <h1 className="profile-title">Your Profile</h1>
          {!editMode && (
            <div className="profile-main">
              {profile.image && (
                <div className="profile-image-section">
                  <img
                    src={profile.image}
                    alt={profile.username ? `${profile.username}` : "Profile"}
                    className="profile-image"
                  />
                </div>
              )}
              <div className="profile-details">
                <div className="profile-info-group">
                  <p><strong>Username:</strong> {profile.username}</p>
                  <p><strong>Name:</strong> {profile.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {profile.address || 'N/A'}</p>
                </div>
                <div className="profile-actions">
                  {/* Hide Edit and Delete if soft-deleted */}
                  {!isDeleted && (
                    <>
                      <button className="edit-button" onClick={() => setEditMode(true)}>
                        Edit Profile
                      </button>
                      <button className="delete-button" onClick={() => setShowDeleteConfirm(true)}>
                        Close Account
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          {editMode && (
            <form className="profile-form" onSubmit={handleSubmit}>
              {[
                { id: 'username', label: 'Username', type: 'text' },
                { id: 'name', label: 'Full Name', type: 'text' },
                { id: 'email', label: 'Email', type: 'email' },
                { id: 'phone', label: 'Phone', type: 'text' },
                { id: 'address', label: 'Address', type: 'text' },
                { id: 'image', label: 'Upload', type: 'file' },
                { id: 'password', label: 'Password (leave blank to keep current)', type: 'password' },
                { id: 'repeatPassword', label: 'Repeat Password', type: 'password' },
              ].map((item) => (
                <div className="profile-form-group" key={item.id}>
                  <label htmlFor={item.id} className="profile-form-label">{item.label}</label>
                  {item.id === 'image' ? (
                    <div className="profile-upload-group">
                      <input
                        id="profile-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="profile-form-input"
                      />
                      {previewUrl && (
                        <div className="profile-image-preview">
                          <img src={previewUrl} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, marginTop: 8 }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      id={item.id}
                      type={item.type}
                      name={item.id}
                      value={formData[item.id]}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      ref={item.id === 'username' ? firstInputRef : undefined}
                      className="profile-form-input"
                    />
                  )}
                </div>
              ))}
              <div className="profile-form-actions">
                <button type="submit" className="update-button" disabled={loading}>
                  {loading ? 'Updating...' : 'Confirm'}
                </button>
                <button type="button" className="cancel-button" onClick={handleCancel} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          {showDeleteConfirm && (
            <div className="confirmation-dialog" role="dialog">
              <div className="dialog-content">
                <h2 className="dialog-title">Confirm Account Deletion</h2>
                <p className="dialog-message">
                  Are you sure you want to permanently delete your Gash account? This action cannot be undone.
                </p>
                <div className="profile-dialog-actions">
                  <button className="confirm-button" onClick={handleDeleteConfirm} disabled={loading}>
                    {loading ? 'Deleting...' : 'Confirm'}
                  </button>
                  <button className="cancel-button" onClick={() => setShowDeleteConfirm(false)} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="profile-no-profile" role="alert">
          <span className="profile-error-icon">⚠</span>
          Profile not found
        </div>
      )}
    </div>
  );
};

export default Profile;