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
import NotificationsDropdown from "./NotificationsDropdown";

// API retry utility from Search.jsx
const fetchWithRetry = async (apiCall, retries = API_RETRY_COUNT, delay = API_RETRY_DELAY) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await apiCall();
      console.log("Search API response:", response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error(`Fetch retry attempt ${i + 1} failed:`, error.message); // Debug log
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export default function Header() {
    const { user, logout } = useContext(AuthContext);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);
    const userMenuRef = useRef(null);

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
            console.error("Logout error:", err); // Debug log
        }
    };

    // Helper function to get minimum price from product variants
    const getMinPrice = (product) => {
      if (!product.productVariantIds || product.productVariantIds.length === 0) {
        console.log(`No variants for product ${product._id}`); // Debug log
        return 0;
      }
      const prices = product.productVariantIds
        .filter(v => v.variantStatus !== 'discontinued' && v.variantPrice > 0)
        .map(v => v.variantPrice);
      console.log(`Prices for product ${product._id}:`, prices); // Debug log
      return prices.length > 0 ? Math.min(...prices) : 0;
    };

    // Helper function to get main image URL
    const getMainImageUrl = (product) => {
      if (!product.productImageIds || product.productImageIds.length === 0) {
        console.log(`No images for product ${product._id}`); // Debug log
        return "/placeholder-image.png";
      }
      const mainImage = product.productImageIds.find(img => img.isMain);
      const imageUrl = mainImage?.imageUrl || product.productImageIds[0]?.imageUrl || "/placeholder-image.png";
      console.log(`Image URL for product ${product._id}:`, imageUrl); // Debug log
      return imageUrl;
    };

    const fetchSearchResults = useCallback(async (query) => {
        if (!query.trim()) {
            console.log("Empty query, clearing results"); // Debug log
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        const sanitizedQuery = query.trim().replace(/[<>]/g, "");
        console.log("Fetching search results for query:", sanitizedQuery); // Debug log
        try {
            setLoading(true);
            const productsData = await fetchWithRetry(() =>
                Api.newProducts.search({ name: sanitizedQuery, status: "active" })
            );
            console.log("Raw products data:", productsData); // Debug log
            const productsArray = Array.isArray(productsData.data) ? productsData.data : [];
            console.log("Products array:", productsArray); // Debug log
            const filteredProducts = productsArray.filter(
                (product) => product.productVariantIds?.length > 0
            );
            console.log("Filtered products:", filteredProducts); // Debug log
            setSearchResults(filteredProducts);
            setShowDropdown(true);
        } catch (err) {
            console.error("Search fetch error:", err.response?.data || err.message); // Debug log
            setSearchResults([]);
            setShowDropdown(true);
        } finally {
            setLoading(false);
            console.log("Search results state:", searchResults); // Debug log
        }
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            console.log("Search input empty, clearing results"); // Debug log
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        console.log("Debouncing search for:", search); // Debug log
        const debounce = setTimeout(() => fetchSearchResults(search), SEARCH_DEBOUNCE_DELAY);
        return () => clearTimeout(debounce);
    }, [search, fetchSearchResults]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (search.trim()) {
            console.log("Submitting search:", search); // Debug log
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
            console.log("No price provided, returning empty string"); // Debug log
            return "";
        }
        const formattedPrice = `${price.toLocaleString()} ₫`;
        console.log(`Formatted price for ${price}:`, formattedPrice); // Debug log
        return formattedPrice;
    };

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#131921] text-white shadow">
            <div className="max-w-8xl mx-auto h-20 sm:h-24 flex items-center px-4 sm:px-6 lg:px-12">
                {/* ==== MOBILE HEADER ==== */}
                <div className="flex w-full items-center justify-between sm:hidden">
                    {mobileSearchOpen ? (
                        <div className="relative w-full">
                            {/* Search form */}
                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex items-center w-full bg-white rounded-full shadow-md overflow-hidden relative"
                            >
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        console.log("Search input changed:", e.target.value); // Debug log
                                        setSearch(e.target.value);
                                    }}
                                    placeholder="Search..."
                                    autoFocus
                                    className="flex-1 pl-4 pr-12 py-2 text-base text-gray-900 focus:outline-none"
                                />
                                {search ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            console.log("Clearing search input"); // Debug log
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
                                            console.log("Closing mobile search"); // Debug log
                                            setMobileSearchOpen(false);
                                        }}
                                        className="absolute right-2 p-2 text-gray-600 hover:text-red-500"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </button>
                                )}
                            </form>

                            {/* Dropdown search */}
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
                                                console.log(`Rendering product ${item._id}:`, { name: item.productName, price: minPrice, image: imageUrl }); // Debug log
                                                return (
                                                    <Link
                                                        key={item._id}
                                                        to={`/product/${item._id}`}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#ffb300]/20 transition-colors border-b last:border-0"
                                                        onClick={() => {
                                                            console.log(`Navigating to product ${item._id}`); // Debug log
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
                                                    console.log("Navigating to full search results:", search); // Debug log
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
                            {/* Search icon trái */}
                            <button 
                                onClick={() => {
                                    console.log("Opening mobile search"); // Debug log
                                    setMobileSearchOpen(true);
                                }} 
                                title="Search"
                                className="p-2 text-white hover:text-amber-500"
                            >
                                <SearchIcon />
                            </button>

                            {/* Logo giữa */}
                            <Link to="/" className="flex items-center justify-center">
                                <img src={gashLogo} alt="Gash Logo" className="h-7" />
                            </Link>

                            {/* Menu phải */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            console.log("Navigating to login"); // Debug log
                                            navigate("/login");
                                        } else {
                                            console.log("Toggling user menu"); // Debug log
                                            setShowUserMenu((prev) => !prev);
                                        }
                                    }}
                                    title="My Account"
                                    className="p-2 text-white hover:text-amber-500"
                                >
                                    <PermIdentityOutlinedIcon />
                                </button>

                                {/* Dropdown menu */}
                                {user && showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden animate-[fadeDown_0.25s_ease-out] z-50">
                                        <div className="px-4 py-2 hover:bg-[#ffb300]/20">
                                            <NotificationsDropdown user={user} />
                                        </div>
                                        <button
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                console.log("Navigating to cart"); // Debug log
                                                navigate('/cart');
                                                setShowUserMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#ffb300]/20"
                                        >
                                            <ShoppingBagOutlinedIcon fontSize="small" /> Cart
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log("Notifications clicked"); // Debug log
                                                alert("Coming soon!");
                                                setShowUserMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#ffb300]/20"
                                        >
                                            <NotificationsNoneOutlinedIcon fontSize="small" /> Notifications
                                        </button>
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#ffb300]/20"
                                        >
                                            <button
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    console.log("Navigating to profile"); // Debug log
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
                                                console.log("Logging out"); // Debug log
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
                    {/* Logo trái */}
                    <Link to="/" className="flex items-center gap-2">
                        <img src={gashLogo} alt="Gash Logo" className="h-7" />
                    </Link>

                    {/* Search giữa */}
                    <div className="relative flex-1 mx-12 max-w-2xl" ref={dropdownRef}>
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex items-center w-full bg-white rounded-full shadow-md overflow-hidden"
                        >
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    console.log("Search input changed (desktop):", e.target.value); // Debug log
                                    setSearch(e.target.value);
                                }}
                                placeholder="Search products..."
                                className="flex-1 pl-5 pr-12 py-2 text-base text-gray-900 focus:outline-none"
                            />
                            <button type="submit" className="p-2 mr-2 text-gray-600 hover:text-amber-500">
                                <SearchIcon fontSize="small" />
                            </button>
                        </form>
                        {/* Dropdown search */}
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
                                            console.log(`Rendering product (desktop) ${item._id}:`, { name: item.productName, price: minPrice, image: imageUrl }); // Debug log
                                            return (
                                                <Link
                                                    key={item._id}
                                                    to={`/product/${item._id}`}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#ffb300]/20 transition-colors border-b last:border-0"
                                                    onClick={() => {
                                                        console.log(`Navigating to product (desktop) ${item._id}`); // Debug log
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
                                                console.log("Navigating to full search results (desktop):", search); // Debug log
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

                    {/* Icon phải */}
                    <div className="flex items-center gap-4 sm:gap-6" ref={userMenuRef}>
                        <button 
                            onClick={() => {
                                console.log("Favorites clicked, user:", !!user); // Debug log
                                user ? navigate("/favorites") : navigate("/login");
                            }} 
                            title="Favorites"
                            className="p-2 text-white hover:text-amber-500"
                        >
                            <FavoriteBorderIcon />
                        </button>
                        <button 
                            onClick={() => {
                                console.log("Cart clicked, user:", !!user); // Debug log
                                user ? navigate("/cart") : navigate("/login");
                            }} 
                            title="Cart"
                            className="p-2 text-white hover:text-amber-500"
                        >
                            <ShoppingBagOutlinedIcon />
                        </button>
                        {user ? (
                            <NotificationsDropdown user={user} />
                        ) : (
                            <button 
                                onClick={() => {
                                    console.log("Notifications clicked, navigating to login"); // Debug log
                                    navigate("/login");
                                }} 
                                title="Notifications"
                                className="p-2 text-white hover:text-amber-500"
                            >
                                <NotificationsNoneOutlinedIcon />
                            </button>
                        )}
                        <div className="relative flex items-center gap-2 cursor-pointer" onClick={() => {
                            console.log("Account menu clicked, user:", !!user); // Debug log
                            user ? setShowUserMenu((prev) => !prev) : navigate("/login");
                        }}>
                            <button 
                                title="My Account"
                                className="p-2 text-white hover:text-amber-500"
                            >
                                <PermIdentityOutlinedIcon />
                            </button>
                            {user && (
                                <span className="hidden sm:block text-sm text-gray-200">
                                    Hello, <span className="font-semibold text-white">{user?.name || "User"}</span>
                                </span>
                            )}
                            {user && showUserMenu && (
                                <div className="absolute right-0 top-full mt-2 w-44 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden animate-[fadeDown_0.25s_ease-out] z-50">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log("Navigating to profile (desktop)"); // Debug log
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
                                            console.log("Navigating to orders"); // Debug log
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
                                            console.log("My Vouchers clicked"); // Debug log
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
                                            console.log("Logging out (desktop)"); // Debug log
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