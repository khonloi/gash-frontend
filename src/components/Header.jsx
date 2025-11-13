import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Api from "../common/SummaryAPI";
import gashLogo from "../assets/image/gash-logo.svg";
import { SEARCH_DEBOUNCE_DELAY, API_RETRY_COUNT, API_RETRY_DELAY } from "../constants/constants";

// Material UI Icons
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import NotificationsDropdown from "./NotificationsDropdown";

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

// Custom events for updates
const CART_UPDATE_EVENT = 'cartUpdated';
const NOTIFICATION_UPDATE_EVENT = 'notificationUpdated';
const LIVESTREAM_UPDATE_EVENT = 'livestreamUpdated';

export default function Header() {
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

    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    const userMenuRef = useRef(null);
    const fetchTimeoutRef = useRef({ cart: null, notification: null, livestream: null });

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

            // NEW: count *different* products only
            const itemCount = Array.isArray(cartData.data)
                ? cartData.data.filter(item => (item.productQuantity ?? 0) > 0).length
                : 0;

            setCartItemCount(itemCount);
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
            setLivestreamCount(0);
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

    // Fetch counts on mount, location change, or update events
    useEffect(() => {

        fetchCartItemCount();
        fetchNotificationCount();   // guaranteed to run
        fetchLivestreamCount();

        // ---- 2. EVENT LISTENERS (debounced) ----
        const handleCartUpdate = () => debouncedFetchCartItemCount();
        const handleNotificationUpdate = () => debouncedFetchNotificationCount();
        const handleLivestreamUpdate = () => debouncedFetchLivestreamCount();

        window.addEventListener(CART_UPDATE_EVENT, handleCartUpdate);
        window.addEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);
        window.addEventListener(LIVESTREAM_UPDATE_EVENT, handleLivestreamUpdate);

        // ---- 3. POLLING (raw fetchers, every 3 s) ----
        let pollInterval;
        if (user) {
            pollInterval = setInterval(() => {
                fetchCartItemCount();        // raw
                fetchNotificationCount();    // raw
                fetchLivestreamCount();      // raw
            }, 3000);
        }

        return () => {
            window.removeEventListener(CART_UPDATE_EVENT, handleCartUpdate);
            window.removeEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);
            window.removeEventListener(LIVESTREAM_UPDATE_EVENT, handleLivestreamUpdate);
            clearInterval(pollInterval);
            Object.values(fetchTimeoutRef.current).forEach(t => t && clearTimeout(t));
        };
    }, [
        fetchCartItemCount,
        fetchNotificationCount,
        fetchLivestreamCount,
        debouncedFetchCartItemCount,
        debouncedFetchNotificationCount,
        debouncedFetchLivestreamCount,
        location,
        user
    ]);       
    
    useEffect(() => {
        setSearch("");
        setSearchResults([]);
        setShowDropdown(false);
        setShowUserMenu(false);
        setMobileSearchOpen(false);
    }, [location]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/");
        } catch (err) {
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
        } catch (err) {
            setSearchResults([]);
            setShowDropdown(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            console.log("Search input empty, clearing results");
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        console.log("Debouncing search for:", search);
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

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    // Reusable badge class
    const badgeClass = "absolute bg-amber-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center";

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#131921] text-white shadow">
            <div className="max-w-7xl mx-auto h-16 sm:h-20 md:h-24 flex items-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
                {/* ==== MOBILE HEADER ==== */}
                <div className="flex w-full items-center justify-between sm:hidden">
                    {mobileSearchOpen ? (
                        <div className="relative w-full">
                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex items-center w-full bg-white rounded-full shadow-md overflow-hidden relative"
                            >
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        console.log("Search input changed:", e.target.value);
                                        setSearch(e.target.value);
                                    }}
                                    placeholder="Search..."
                                    autoFocus
                                    className="flex-1 pl-3 pr-10 sm:pr-12 py-2 text-sm sm:text-base text-gray-900 focus:outline-none"
                                />
                                {search ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            console.log("Clearing search input");
                                            setSearch("");
                                        }}
                                        className="absolute right-2 p-2 text-gray-500 hover:text-red-500"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            console.log("Closing mobile search");
                                            setMobileSearchOpen(false);
                                        }}
                                        className="absolute right-2 p-2 text-gray-600 hover:text-red-500"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </button>
                                )}
                            </form>
                            {showDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-full rounded-xl shadow-lg z-50 bg-white 
                                border border-gray-200 overflow-hidden animate-[fadeIn_0.2s_ease-out]
                                max-h-96 overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
                                            <span className="animate-spin border-2 border-gray-300 border-t-transparent rounded-full w-5 h-5"></span>
                                            Searching...
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <>
                                            {searchResults.map((item) => {
                                                const minPrice = getMinPrice(item);
                                                const imageUrl = getMainImageUrl(item);
                                                console.log(`Rendering product ${item._id}:`, { name: item.productName, price: minPrice, image: imageUrl });
                                                return (
                                                    <Link
                                                        key={item._id}
                                                        to={`/product/${item._id}`}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#ffb300]/20 transition-colors border-b last:border-0"
                                                        onClick={() => {
                                                            console.log(`Navigating to product ${item._id}`);
                                                            setShowDropdown(false);
                                                        }}
                                                    >
                                                        <img
                                                            src={imageUrl}
                                                            alt={item.productName || "Product image"}
                                                            className="w-14 h-14 rounded-lg object-cover shadow-sm"
                                                        />
                                                        <div className="flex flex-col">
                                                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                                                {item.productName || "Unnamed Product"}
                                                            </p>
                                                            <p className="text-sm text-red-600 font-semibold mt-1">
                                                                {formatPrice(minPrice)}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                            <button
                                                onClick={() => {
                                                    console.log("Navigating to full search results:", search);
                                                    navigate(`/search?q=${encodeURIComponent(search)}`);
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full text-center text-sm font-medium text-amber-600 py-2 hover:bg-[#ffb300]/20 transition-colors"
                                            >
                                                View all results
                                            </button>
                                        </>
                                    ) : (
                                        <div className="px-4 py-4 text-gray-500 text-center">No products found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    console.log("Opening mobile search");
                                    setMobileSearchOpen(true);
                                }}
                                title="Search"
                                className="p-2 text-white hover:text-amber-500"
                            >
                                <SearchIcon />
                            </button>
                            <Link to="/" className="flex items-center justify-center">
                                <img src={gashLogo} alt="Gash Logo" className="h-6 sm:h-7" />
                            </Link>
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            console.log("Navigating to login");
                                            navigate("/login");
                                        } else {
                                            console.log("Toggling user menu");
                                            setShowUserMenu((prev) => !prev);
                                        }
                                    }}
                                    title="My Account"
                                    className="p-2 text-white hover:text-amber-500"
                                >
                                    <PermIdentityOutlinedIcon />
                                </button>
                                {user && showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden animate-[fadeDown_0.25s_ease-out] z-50">
                                        <div className="px-4 py-2 hover:bg-[#ffb300]/20">
                                            <NotificationsDropdown user={user} />
                                        </div>
                                        <button
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                console.log("Navigating to cart");
                                                navigate('/cart');
                                                setShowUserMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 relative"
                                        >
                                            <ShoppingBagOutlinedIcon fontSize="small" />
                                            Cart
                                            {cartItemCount > 0 && (
                                                <span className={`${badgeClass} top-1 right-4`}>
                                                    {cartItemCount}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                console.log("Navigating to notifications");
                                                navigate('/notifications');
                                                setShowUserMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 relative"
                                        >
                                            <NotificationsNoneOutlinedIcon fontSize="small" />
                                            Notifications
                                            {notificationCount > 0 && (
                                                <span className={`${badgeClass} top-1 right-4`}>
                                                    {notificationCount}
                                                </span>
                                            )}
                                        </button>
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#ffb300]/20"
                                        >
                                            <button
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    console.log("Navigating to profile");
                                                    navigate('/profile');
                                                    setShowUserMenu(false);
                                                }}
                                                className="flex items-center gap-2 w-full text-left"
                                            >
                                                <PermIdentityOutlinedIcon fontSize="small" /> My Account
                                            </button>
                                        </Link>
                                        <button
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                console.log("Logging out");
                                                handleLogout();
                                                setShowUserMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ==== DESKTOP HEADER ==== */}
                <div className="hidden sm:flex w-full items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={gashLogo} alt="Gash Logo" className="h-6 md:h-7" />
                    </Link>
                    <div className="relative flex-1 mx-4 sm:mx-6 md:mx-8 lg:mx-12 max-w-2xl" ref={dropdownRef}>
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex items-center w-full bg-white rounded-full shadow-md overflow-hidden"
                        >
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    console.log("Search input changed (desktop):", e.target.value);
                                    setSearch(e.target.value);
                                }}
                                placeholder="Search products..."
                                className="flex-1 pl-3 sm:pl-4 md:pl-5 pr-10 sm:pr-12 py-1.5 sm:py-2 text-sm sm:text-base text-gray-900 focus:outline-none"
                            />
                            <button type="submit" className="p-2 mr-2 text-gray-600 hover:text-amber-500">
                                <SearchIcon fontSize="small" />
                            </button>
                        </form>
                        {showDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-full rounded-xl shadow-lg z-50 bg-white border border-gray-200 overflow-hidden animate-[fadeIn_0.2s_ease-out] max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
                                        <span className="animate-spin border-2 border-gray-300 border-t-transparent rounded-full w-5 h-5"></span>
                                        Searching...
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <>
                                        {searchResults.map((item) => {
                                            const minPrice = getMinPrice(item);
                                            const imageUrl = getMainImageUrl(item);
                                            console.log(`Rendering product (desktop) ${item._id}:`, { name: item.productName, price: minPrice, image: imageUrl });
                                            return (
                                                <Link
                                                    key={item._id}
                                                    to={`/product/${item._id}`}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#ffb300]/20 transition-colors border-b last:border-0"
                                                    onClick={() => {
                                                        console.log(`Navigating to product (desktop) ${item._id}`);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.productName || "Product image"}
                                                        className="w-14 h-14 rounded-lg object-cover shadow-sm"
                                                    />
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                                            {item.productName || "Unnamed Product"}
                                                        </p>
                                                        <p className="text-sm text-red-600 font-semibold mt-1">
                                                            {formatPrice(minPrice)}
                                                        </p>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                        <button
                                            onClick={() => {
                                                console.log("Navigating to full search results (desktop):", search);
                                                navigate(`/search?q=${encodeURIComponent(search)}`);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-center text-sm font-medium text-amber-600 py-2 hover:bg-[#ffb300]/20 transition-colors"
                                        >
                                            View all results
                                        </button>
                                    </>
                                ) : (
                                    <div className="px-4 py-4 text-gray-500 text-center">No products found</div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6" ref={userMenuRef}>
                        <div className="relative">
                            <button
                                onClick={() => {
                                    console.log("Live Stream clicked");
                                    navigate("/live");
                                }}
                                title="Live Stream"
                                className="p-2 text-white hover:text-amber-500"
                            >
                                <TvOutlinedIcon />
                                {livestreamCount > 0 && (
                                    <span className={`${badgeClass} -top-1 -right-1`}>
                                        {livestreamCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                console.log("Favorites clicked, user:", !!user);
                                user ? navigate("/favorites") : navigate("/login");
                            }}
                            title="Favorites"
                            className="p-2 text-white hover:text-amber-500"
                        >
                            <FavoriteBorderIcon />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => {
                                    console.log("Cart clicked, user:", !!user);
                                    user ? navigate("/cart") : navigate("/login");
                                }}
                                title="Cart"
                                className="p-2 text-white hover:text-amber-500"
                            >
                                <ShoppingBagOutlinedIcon />
                                {cartItemCount > 0 && (
                                    <span className={`${badgeClass} -top-1 -right-1`}>
                                        {cartItemCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        {user ? (
                            <div className="relative">
                                <NotificationsDropdown user={user} />
                                {notificationCount > 0 && (
                                    <span className={`${badgeClass} -top-1 -right-1`}>
                                        {notificationCount}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        console.log("Notifications clicked, navigating to login");
                                        navigate("/login");
                                    }}
                                    title="Notifications"
                                    className="p-2 text-white hover:text-amber-500"
                                >
                                    <NotificationsNoneOutlinedIcon />
                                </button>
                            </div>
                        )}
                        <div className="relative flex items-center gap-2 cursor-pointer" onClick={() => {
                            console.log("Account menu clicked, user:", !!user);
                            user ? setShowUserMenu((prev) => !prev) : navigate("/login");
                        }}>
                            <button
                                title="My Account"
                                className="p-2 text-white hover:text-amber-500"
                            >
                                <PermIdentityOutlinedIcon />
                            </button>
                            {user && (
                                <span className="hidden md:block text-xs md:text-sm text-gray-200">
                                    <span className="font-semibold text-white">{getFirstName(user?.name)}</span>
                                </span>
                            )}
                            {user && showUserMenu && (
                                <div className="absolute right-0 top-full mt-2 w-44 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden animate-[fadeDown_0.25s_ease-out] z-50">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("Navigating to profile (desktop)");
                                            navigate("/profile");
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 transition-colors"
                                    >
                                        My Account
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("Navigating to orders");
                                            navigate("/orders");
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 transition-colors"
                                    >
                                        My Orders
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("My Vouchers clicked");
                                            alert("My Vouchers");
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 transition-colors"
                                    >
                                        My Vouchers
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("Logging out (desktop)");
                                            handleLogout();
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}