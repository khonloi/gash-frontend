import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import Api from "../../../common/SummaryAPI";
import { getSocket, registerUserSocket } from "../../../common/socketManager";
import { SEARCH_DEBOUNCE_DELAY } from "../../../constants/constants";
import { fetchWithRetry } from "../../../utils/fetchWithRetry";
import { formatPrice } from "../../../utils/formatters";

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

    // Fetch cart item count
    const fetchCartItemCount = useCallback(async () => {
        if (!user?._id) {
            setCartItemCount(0);
            return;
        }
        try {
            const cartData = await fetchWithRetry(() =>
                Api.newCart.getByAccount(user._id)
            );
            if (Array.isArray(cartData)) {
                setCartItemCount(cartData.length);
            } else if (cartData?.data && Array.isArray(cartData.data)) {
                setCartItemCount(cartData.data.length);
            } else {
                setCartItemCount(0);
            }
        } catch {
            setCartItemCount(0);
        }
    }, [user]);

    // Fetch notification count
    const fetchNotificationCount = useCallback(async () => {
        if (!user?._id) {
            setNotificationCount(0);
            return;
        }
        try {
            const notificationData = await fetchWithRetry(() =>
                Api.notifications.getUserNotifications(user._id)
            );
            if (Array.isArray(notificationData)) {
                const unread = notificationData.filter((n) => !n.isRead).length;
                setNotificationCount(unread);
            } else if (notificationData?.data && Array.isArray(notificationData.data)) {
                const unread = notificationData.data.filter((n) => !n.isRead).length;
                setNotificationCount(unread);
            } else {
                setNotificationCount(0);
            }
        } catch {
            setNotificationCount(0);
        }
    }, [user]);

    // Fetch livestream count
    const fetchLivestreamCount = useCallback(async () => {
        try {
            const livestreamData = await fetchWithRetry(() =>
                Api.livestream.getLive()
            );
            if (Array.isArray(livestreamData)) {
                setLivestreamCount(livestreamData.length);
            } else if (livestreamData?.data && Array.isArray(livestreamData.data)) {
                setLivestreamCount(livestreamData.data.length);
            } else if (livestreamData?.success && Array.isArray(livestreamData.liveStreams)) {
                setLivestreamCount(livestreamData.liveStreams.length);
            } else {
                setLivestreamCount(0);
            }
        } catch {
            setLivestreamCount(0);
        }
    }, []);

    // Fetch random categories
    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetchWithRetry(() => Api.categories.getAll());
            if (response && response.data) {
                const categoriesData = response.data.categories || response.data;
                if (Array.isArray(categoriesData)) {
                    const shuffled = [...categoriesData].sort(() => 0.5 - Math.random());
                    setRandomCategories(shuffled.slice(0, 3));
                }
            }
        } catch {
            setRandomCategories([]);
        }
    }, []);

    // Fetch favorite count
    const fetchFavoriteCount = useCallback(async () => {
        if (!user?._id) {
            setFavoriteCount(0);
            return;
        }
        try {
            const favoritesData = await fetchWithRetry(() =>
                Api.favorites.fetch()
            );
            let count = 0;
            if (Array.isArray(favoritesData)) {
                count = favoritesData.length;
            } else if (favoritesData?.favorites && Array.isArray(favoritesData.favorites)) {
                count = favoritesData.favorites.length;
            } else if (favoritesData?.data && Array.isArray(favoritesData.data)) {
                count = favoritesData.data.length;
            }
            setFavoriteCount(count);
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

    // Socket.IO updates via singleton
    useEffect(() => {
        if (!user?._id) return;

        registerUserSocket(user._id);
        const socket = getSocket();

        const handleCartUpdated = () => {
            debouncedFetchCartItemCount();
        };

        const handleLivestreamCountChanged = (data) => {
            if (typeof data?.count === 'number') {
                setLivestreamCount(data.count);
            } else {
                debouncedFetchLivestreamCount();
            }
        };

        const handleNewNotification = () => {
            debouncedFetchNotificationCount();
        };

        const handleNotificationBadgeUpdate = (data) => {
            if (!data?.userId || data.userId === user._id) {
                debouncedFetchNotificationCount();
            }
        };

        const handleFavoriteUpdated = () => {
            debouncedFetchFavoriteCount();
        };

        socket.on("cartUpdated", handleCartUpdated);
        socket.on("livestreamCountChanged", handleLivestreamCountChanged);
        socket.on("newNotification", handleNewNotification);
        socket.on("notificationBadgeUpdate", handleNotificationBadgeUpdate);
        socket.on("favoriteUpdated", handleFavoriteUpdated);

        return () => {
            socket.off("cartUpdated", handleCartUpdated);
            socket.off("livestreamCountChanged", handleLivestreamCountChanged);
            socket.off("newNotification", handleNewNotification);
            socket.off("notificationBadgeUpdate", handleNotificationBadgeUpdate);
            socket.off("favoriteUpdated", handleFavoriteUpdated);
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
            if (!user) {
                navigate("/login");
                return;
            }

            const response = await Api.livestream.getLiveNow();

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
