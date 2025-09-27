import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Api from "../common/SummaryAPI";
import gashLogo from "../assets/image/gash-logo.svg";
import { SEARCH_DEBOUNCE_DELAY } from "../constants/constants";

// Material UI Icons
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MenuIcon from "@mui/icons-material/Menu";

import IconButton from "./IconButton";

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
            console.error(err);
        }
    };

    const fetchSearchResults = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        try {
            setLoading(true);
            const res = await Api.products.search(query);
            setSearchResults(res.data || []);
            setShowDropdown(true);
        } catch (err) {
            console.error(err);
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
        if (!price) return "";
        return `${price.toLocaleString()} ₫`;
    };

    // helper cho menu mobile
    const handleMenuClick = (path, callback) => {
        if (path) navigate(path);
        if (callback) callback();
        setShowUserMenu(false);
    };

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#131921] text-white shadow">
            <div className="max-w-7xl mx-auto h-16 sm:h-20 flex items-center px-4 sm:px-6 lg:px-12">
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
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    autoFocus
                                    className="flex-1 pl-4 pr-12 py-2 text-sm text-gray-900 focus:outline-none"
                                />

                                {search ? (
                                    // X để clear text
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-2 p-2 text-gray-500 hover:text-red-500"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </button>
                                ) : (
                                    // X để đóng search bar
                                    <button
                                        type="button"
                                        onClick={() => setMobileSearchOpen(false)}
                                        className="absolute right-2 p-2 text-gray-600 hover:text-red-500"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </button>
                                )}
                            </form>

                            {/* Dropdown search (mobile) */}
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
                                            {searchResults.map((item) => (
                                                <Link
                                                    key={item._id}
                                                    to={`/product/${item._id}`}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-0"
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    <img
                                                        src={item.imageURL || "/placeholder.png"}
                                                        alt={item.pro_name}
                                                        className="w-14 h-14 rounded-lg object-cover shadow-sm"
                                                    />
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                                            {item.pro_name}
                                                        </p>
                                                        <p className="text-sm text-red-600 font-semibold mt-1">
                                                            {formatPrice(item.pro_price)}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    navigate(`/search?q=${encodeURIComponent(search)}`);
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full text-center text-sm font-medium text-amber-600 py-2 hover:bg-amber-50 transition-colors"
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
                            <IconButton onClick={() => setMobileSearchOpen(true)} title="Search">
                                <SearchIcon />
                            </IconButton>

                            {/* Logo giữa */}
                            <Link to="/" className="flex items-center justify-center">
                                <img src={gashLogo} alt="Gash Logo" className="h-8" />
                            </Link>

                            {/* Menu phải */}
                            <div className="relative" ref={userMenuRef}>
                                <IconButton
                                    onClick={() => setShowUserMenu((prev) => !prev)}
                                    title="Menu"
                                >
                                    <MenuIcon />
                                </IconButton>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden animate-[fadeDown_0.25s_ease-out] z-50">
                                        <button
                                            onClick={() => handleMenuClick("/favorites")}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                            <FavoriteIcon fontSize="small" /> Favorites
                                        </button>
                                        <button
                                            onClick={() => handleMenuClick("/cart")}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                            <ShoppingCartIcon fontSize="small" /> Cart
                                        </button>
                                        <button
                                            onClick={() => handleMenuClick(null, () => alert("Coming soon!"))}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                            <ChatBubbleIcon fontSize="small" /> Messages
                                        </button>
                                        <button
                                            onClick={() => handleMenuClick(null, () => alert("Coming soon!"))}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                            <NotificationsIcon fontSize="small" /> Notifications
                                        </button>
                                        <button
                                            onClick={() => handleMenuClick("/profile")}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                            <AccountCircleIcon fontSize="small" /> My Account
                                        </button>
                                        <button
                                            onClick={() => handleMenuClick(null, handleLogout)}
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
                        <img src={gashLogo} alt="Gash Logo" className="h-10" />
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
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search products..."
                                className="flex-1 pl-5 pr-12 py-2 text-sm text-gray-900 focus:outline-none"
                            />
                            <button type="submit" className="p-2 mr-2 text-gray-600 hover:text-amber-500">
                                <SearchIcon fontSize="small" />
                            </button>
                        </form>

                        {/* Dropdown search (desktop) */}
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
                                        {searchResults.map((item) => (
                                            <Link
                                                key={item._id}
                                                to={`/product/${item._id}`}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-0"
                                                onClick={() => setShowDropdown(false)}
                                            >
                                                <img
                                                    src={item.imageURL || "/placeholder.png"}
                                                    alt={item.pro_name}
                                                    className="w-14 h-14 rounded-lg object-cover shadow-sm"
                                                />
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.pro_name}</p>
                                                    <p className="text-sm text-red-600 font-semibold mt-1">{formatPrice(item.pro_price)}</p>
                                                </div>
                                            </Link>
                                        ))}
                                        <button
                                            onClick={() => {
                                                navigate(`/search?q=${encodeURIComponent(search)}`);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full text-center text-sm font-medium text-amber-600 py-2 hover:bg-amber-50 transition-colors"
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
                        <IconButton onClick={() => navigate("/favorites")} title="Favorites">
                            <FavoriteIcon />
                        </IconButton>
                        <IconButton onClick={() => navigate("/cart")} title="Cart">
                            <ShoppingCartIcon />
                        </IconButton>
                        <IconButton onClick={() => alert("Coming soon!")} title="Messages">
                            <ChatBubbleIcon />
                        </IconButton>
                        <IconButton onClick={() => alert("Coming soon!")} title="Notifications">
                            <NotificationsIcon />
                        </IconButton>
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => setShowUserMenu((prev) => !prev)}
                        >
                            <IconButton title="My Account">
                                <AccountCircleIcon />
                            </IconButton>
                            <span className="hidden sm:block text-sm text-gray-200">
                                Hello, <span className="font-semibold text-white">{user?.name || "User"}</span>
                            </span>
                        </div>
                        {showUserMenu && (
                            <div className="absolute right-4 top-20 sm:top-16 w-44 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden animate-[fadeDown_0.25s_ease-out]">
                                <button onClick={() => navigate("/profile")} className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors">
                                    My Account
                                </button>
                                <button onClick={() => navigate("/orders")} className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors">
                                    My Account
                                </button>
                                <button onClick={() => alert("Coming soon!")} className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors">
                                    My Vouchers
                                </button>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors">
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
