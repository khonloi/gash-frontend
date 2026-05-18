import { useState, useCallback, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from '../../../common/SummaryAPI';
import { useToast } from '../../../hooks/useToast';
import { AuthContext } from '../../../context/AuthContext';
import { startRegistration } from "@simplewebauthn/browser";

export const useProfile = () => {
    const { user, logout } = useContext(AuthContext);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // File upload states
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [invalidFile, setInvalidFile] = useState(false);
    
    // Passkey states
    const [passkeys, setPasskeys] = useState([]);
    const [isSettingUpPasskey, setIsSettingUpPasskey] = useState(false);
    const [passkeyToDelete, setPasskeyToDelete] = useState(null);
    
    // Auth & settings states
    const [requireAuthForCheckout, setRequireAuthForCheckout] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    
    // Modal visibilities
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    
    // Form data
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

    const isDemoMode = import.meta.env.VITE_APP_USE_MOCK === 'true';
    const showDemoNotice = () => showToast("This page is running in demo mode. To fully explore the project, please clone it and run it locally.", "info", 5000);

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

            const regResponse = await Api.passkeys.generateRegistrationOptions(token);
            const { options, challenge } = regResponse.data;

            const registrationResponse = await startRegistration(options);

            const deviceType = navigator.userAgent.includes('Mobile') ? 'mobile' :
                navigator.userAgent.includes('Tablet') ? 'tablet' : 'desktop';

            const verifyData = {
                id: registrationResponse.id,
                rawId: registrationResponse.rawId,
                response: registrationResponse.response,
                type: registrationResponse.type,
                challenge: challenge,
                deviceType,
            };

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
            await Api.accounts.updateProfile(user._id, updateData);
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
                .then(async () => {
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
                Api.upload
                    .image(selectedFile)
                    .then((response) => {
                        const imageUrl = response.data?.url || response.data?.imageUrl;
                        if (imageUrl) {
                            showToast("Image uploaded successfully", "success", 2000);
                            updateProfileWithImage(imageUrl);
                        } else {
                            showToast("Upload completed but server did not return URL.", "error", 3000);
                            setLoading(false);
                        }
                    })
                    .catch((err) => {
                        showToast(`Upload failed: ${err.response?.data?.message || err.message}`, "error", 5000);
                        setLoading(false);
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

    return {
        user,
        profile,
        editMode,
        setEditMode,
        loading,
        error,
        selectedFile,
        previewUrl,
        setPreviewUrl,
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
    };
};
