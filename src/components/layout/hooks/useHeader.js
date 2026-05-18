import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { AuthContext } from "../../../context/AuthContext";
import Api from "../../../common/SummaryAPI";
import { SEARCH_DEBOUNCE_DELAY, API_RETRY_COUNT, API_RETRY_DELAY } from "../../../constants/constants";

const fetchWithRetry = async (apiCall, retries = API_RETRY_COUNT, delay = API_RETRY_DELAY) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await apiCall();
            return response.data;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
};

const CART_UPDATE_EVENT = 'cartUpdated';
const NOTIFICATION_UPDATE_EVENT = 'notificationUpdated';
const LIVESTREAM_UPDATE_EVENT = 'livestreamUpdated';
const FAVORITE_UPDATE_EVENT = 'favoriteUpdated';

export const useHeader = () => {
    const { user, logout } = useContext(AuthContext);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);
    const [livestreamCount, setLivestreamCount] = useState(0);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [randomCategories, setRandomCategories] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    const userMenuRef = useRef(null);
    const fetchTimeoutRef = useRef({ cart: null, notification: null, livestream: null, favorite: null });
    const socketRef = useRef(null);

    // Fetch cart item count
    const fetchCartItemCount = useCallback(async () => {
        if (!user) {
            setCartItemCount(0);
            return;
        }
        try {
            const cartData = await fetchWithRetry(() =>
                Api.newCart.getByAccount(user._id, user.token)
            );
            const itemCount = Array.isArray(cartData.data)
                ? cartData.data.filter(item => (item.productQuantity ?? 0) > 0).length
                : 0;
            setCartItemCount(itemCount);
        } catch {
            setCartItemCount(0);
        }
    }, [user]);

    // Fetch notification count
    const fetchNotificationCount = useCallback(async () => {
        if (!user) {
            setNotificationCount(0);
            return;
        }
        try {
            const notificationData = await fetchWithRetry(() =>
                Api.newNotifications.getByAccount(user._id, user.token)
            );
            const unreadCount = Array.isArray(notificationData.data)
                ? notificationData.data.filter(item => !item.isRead).length
                : 0;
            setNotificationCount(unreadCount);
        } catch {
            setNotificationCount(0);
        }
    }, [user]);

    // Fetch livestream count
    const fetchLivestreamCount = useCallback(async () => {
        if (!user) {
            setLivestreamCount(0);
            return;
        }
        try {
            const livestreamData = await fetchWithRetry(() =>
                Api.livestream.getLive(user.token)
            );
            const activeCount = livestreamData.data?.count || 0;
            setLivestreamCount(activeCount);
        } catch {
            setLivestreamCount(0);
        }
    }, [user]);

    // Fetch random categories
    const fetchCategories = useCallback(async () => {
        try {
            const cached = sessionStorage.getItem('header_random_categories');
            if (cached) {
                setRandomCategories(JSON.parse(cached));
                return;
            }

            const response = await fetchWithRetry(() => Api.categories.getAll());
            const categories = response?.data || [];
            const activeCategories = categories.filter(cat => !cat.isDeleted);

            if (activeCategories.length > 0) {
                const shuffled = [...activeCategories].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 5);
                setRandomCategories(selected);
                sessionStorage.setItem('header_random_categories', JSON.stringify(selected));
            }
        } catch (error) {
            console.error("Error fetching categories for header:", error);
        }
    }, []);

    // Fetch favorite count
    const fetchFavoriteCount = useCallback(async () => {
        if (!user) {
            setFavoriteCount(0);
            return;
        }
        try {
            const favoritesData = await fetchWithRetry(() =>
                Api.favorites.fetch(user.token)
            );
            const itemCount = Array.isArray(favoritesData) ? favoritesData.length : 0;
            setFavoriteCount(itemCount);
        } catch {
            setFavoriteCount(0);
        }
    }, [user]);

    // Debounced fetch functions
    const debouncedFetchCartItemCount = useCallback(() => {
        if (fetchTimeoutRef.current.cart) clearTimeout(fetchTimeoutRef.current.cart);
        fetchTimeoutRef.current.cart = setTimeout(fetchCartItemCount, 10);
    }, [fetchCartItemCount]);

    const debouncedFetchNotificationCount = useCallback(() => {
        if (fetchTimeoutRef.current.notification) clearTimeout(fetchTimeoutRef.current.notification);
        fetchTimeoutRef.current.notification = setTimeout(fetchNotificationCount, 10);
    }, [fetchNotificationCount]);

    const debouncedFetchLivestreamCount = useCallback(() => {
        if (fetchTimeoutRef.current.livestream) clearTimeout(fetchTimeoutRef.current.livestream);
        fetchTimeoutRef.current.livestream = setTimeout(fetchLivestreamCount, 10);
    }, [fetchLivestreamCount]);

    const debouncedFetchFavoriteCount = useCallback(() => {
        if (fetchTimeoutRef.current.favorite) clearTimeout(fetchTimeoutRef.current.favorite);
        fetchTimeoutRef.current.favorite = setTimeout(fetchFavoriteCount, 10);
    }, [fetchFavoriteCount]);

    // Socket.IO updates
    useEffect(() => {
        if (!user?._id) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
        const socket = io(baseURL, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            withCredentials: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("userConnected", user._id);
            socket.emit("joinRoom", user._id);
        });

        socket.on("cartUpdated", () => {
            debouncedFetchCartItemCount();
        });

        socket.on("livestreamCountChanged", (data) => {
            if (typeof data.count === 'number') {
                setLivestreamCount(data.count);
            } else {
                debouncedFetchLivestreamCount();
            }
        });

        socket.on("newNotification", () => {
            debouncedFetchNotificationCount();
        });

        socket.on("notificationBadgeUpdate", (data) => {
            if (!data.userId || data.userId === user._id) {
                debouncedFetchNotificationCount();
            }
        });

        socket.on("favoriteUpdated", () => {
            debouncedFetchFavoriteCount();
        });

        socket.on("connect_error", (err) => {
            console.error("Header Socket connection error:", err.message);
        });

        socket.on("disconnect", (reason) => {
            console.warn("⚠️ Header Socket disconnected:", reason);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, debouncedFetchCartItemCount, debouncedFetchNotificationCount, debouncedFetchLivestreamCount, debouncedFetchFavoriteCount]);

    // Fetch counts and setup listeners/polling
    useEffect(() => {
        fetchCartItemCount();
        fetchNotificationCount();
        fetchLivestreamCount();
        fetchFavoriteCount();
        fetchCategories();

        const handleCartUpdate = () => debouncedFetchCartItemCount();
        const handleNotificationUpdate = () => debouncedFetchNotificationCount();
        const handleLivestreamUpdate = () => debouncedFetchLivestreamCount();
        const handleFavoriteUpdate = () => debouncedFetchFavoriteCount();

        window.addEventListener(CART_UPDATE_EVENT, handleCartUpdate);
        window.addEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);
        window.addEventListener(LIVESTREAM_UPDATE_EVENT, handleLivestreamUpdate);
        window.addEventListener(FAVORITE_UPDATE_EVENT, handleFavoriteUpdate);

        let pollInterval;
        if (user) {
            pollInterval = setInterval(() => {
                fetchCartItemCount();
                fetchNotificationCount();
                fetchLivestreamCount();
                fetchFavoriteCount();
            }, 30000);
        }

        const currentTimeouts = fetchTimeoutRef.current;

        return () => {
            window.removeEventListener(CART_UPDATE_EVENT, handleCartUpdate);
            window.removeEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);
            window.removeEventListener(LIVESTREAM_UPDATE_EVENT, handleLivestreamUpdate);
            window.removeEventListener(FAVORITE_UPDATE_EVENT, handleFavoriteUpdate);
            clearInterval(pollInterval);
            Object.values(currentTimeouts).forEach(t => t && clearTimeout(t));
        };
    }, [
        fetchCartItemCount,
        fetchNotificationCount,
        fetchLivestreamCount,
        fetchFavoriteCount,
        debouncedFetchCartItemCount,
        debouncedFetchNotificationCount,
        debouncedFetchLivestreamCount,
        debouncedFetchFavoriteCount,
        fetchCategories,
        location,
        user
    ]);

    // Reset UI state on location change
    useEffect(() => {
        setSearch("");
        setSearchResults([]);
        setShowDropdown(false);
        setShowUserMenu(false);
        setMobileSearchOpen(false);
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const getMinPrice = (product) => {
        if (!product.productVariantIds || product.productVariantIds.length === 0) {
            return 0;
        }
        const prices = product.productVariantIds
            .filter(v => v.variantStatus !== 'discontinued' && v.variantPrice > 0)
            .map(v => v.variantPrice);
        return prices.length > 0 ? Math.min(...prices) : 0;
    };

    const getMainImageUrl = (product) => {
        if (!product.productImageIds || product.productImageIds.length === 0) {
            return "/placeholder-image.png";
        }
        const mainImage = product.productImageIds.find(img => img.isMain);
        const imageUrl = mainImage?.imageUrl || product.productImageIds[0]?.imageUrl || "/placeholder-image.png";
        return imageUrl;
    };

    const fetchSearchResults = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        const sanitizedQuery = query.trim().replace(/[<>]/g, "");
        try {
            setLoading(true);
            const productsData = await fetchWithRetry(() =>
                Api.newProducts.search({ name: sanitizedQuery, status: "active" })
            );
            const productsArray = Array.isArray(productsData.data) ? productsData.data : [];
            const filteredProducts = productsArray.filter(
                (product) => product.productVariantIds?.length > 0
            );
            setSearchResults(filteredProducts);
            setShowDropdown(true);
        } catch {
            setSearchResults([]);
            setShowDropdown(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const debounce = setTimeout(() => fetchSearchResults(search), SEARCH_DEBOUNCE_DELAY);
        return () => clearTimeout(debounce);
    }, [search, fetchSearchResults]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/search?q=${encodeURIComponent(search)}`);
            setShowDropdown(false);
            setMobileSearchOpen(false);
        }
    };

    const handleLiveStreamClick = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await Api.livestream.getLiveNow(token);

            if (response.data?.success) {
                let streams = [];

                if (response.data?.data?.livestreams && Array.isArray(response.data.data.livestreams)) {
                    streams = response.data.data.livestreams.filter(s => s && s.status === 'live');
                } else if (response.data?.data?.livestream) {
                    const livestream = response.data.data.livestream;
                    if (livestream && livestream.status === 'live') {
                        streams = [livestream];
                    }
                }

                if (streams.length > 0) {
                    navigate(`/live/${streams[0]._id}`);
                } else {
                    navigate("/live");
                }
            } else {
                navigate("/live");
            }
        } catch (error) {
            console.error("Error fetching live streams:", error);
            navigate("/live");
        }
    };

    const formatPrice = (price) => {
        if (!price) {
            return "";
        }
        return `${price.toLocaleString()} ₫`;
    };

    const getFirstName = (name) => {
        if (!name) return "User";
        const firstWord = name.trim().split(" ")[0];
        return firstWord || "User";
    };

    return {
        user,
        search,
        setSearch,
        searchResults,
        showDropdown,
        setShowDropdown,
        loading,
        showUserMenu,
        setShowUserMenu,
        mobileSearchOpen,
        setMobileSearchOpen,
        cartItemCount,
        notificationCount,
        livestreamCount,
        favoriteCount,
        randomCategories,
        navigate,
        dropdownRef,
        userMenuRef,
        handleLogout,
        getMinPrice,
        getMainImageUrl,
        handleSearchSubmit,
        handleLiveStreamClick,
        formatPrice,
        getFirstName,
    };
};
