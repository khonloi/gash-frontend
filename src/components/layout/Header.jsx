import React from "react";
import { Link } from "react-router-dom";
import gashLogo from "../../assets/image/gash-logo.svg";
import { useHeader } from "./hooks/useHeader";

// Material UI Icons
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import NotificationsDropdown from "../../features/notifications/components/NotificationsDropdown";
import IconButton from "../ui/IconButton";



export default function Header() {
    const {
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
        getFirstName
    } = useHeader();

    const badgeClass = "absolute bg-amber-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center";

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-[#131921] text-white shadow">
            {/* Category Bar */}
            <div className="hidden sm:block border-b border-gray-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-center gap-8 py-3 text-sm font-medium tracking-wide">
                    {randomCategories.map((cat) => (
                        <Link
                            key={cat._id}
                            to={`/products?category=${encodeURIComponent(cat.categoryName)}`}
                            className="hover:text-amber-500 transition-colors uppercase"
                        >
                            {cat.categoryName}
                        </Link>
                    ))}
                    {randomCategories.length === 0 && (
                        <span className="text-gray-500 italic">Demonstration purposes — Limited functionality</span>
                    )}
                </div>
            </div>
            <div className="max-w-7xl mx-auto h-16 sm:h-20 md:h-24 flex items-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
                {/* ==== MOBILE HEADER ==== */}
                <div className="flex w-full items-center justify-between sm:hidden">
                    {mobileSearchOpen ? (
                        <div className="relative w-full">
                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex items-center w-full bg-white rounded-full shadow-sm border border-gray-200 overflow-hidden relative"
                            >
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {

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

                                                return (
                                                    <Link
                                                        key={item._id}
                                                        to={`/product/${item._id}`}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#ffb300]/20 transition-colors border-b last:border-0"
                                                        onClick={() => {

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

                                    setMobileSearchOpen(true);
                                }}
                                title="Search"
                                className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out"
                            >
                                <SearchIcon />
                            </button>
                            <Link to="/" className="flex items-center justify-center">
                                <img src={gashLogo} alt="GASH Logo" className="h-6 sm:h-7" />
                            </Link>
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => {
                                        if (!user) {

                                            navigate("/login");
                                        } else {

                                            setShowUserMenu((prev) => !prev);
                                        }
                                    }}
                                    title="My Account"
                                    className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out"
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

                                                navigate('/notifications');
                                                setShowUserMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 relative"
                                        >
                                            <NotificationsOutlinedIcon fontSize="small" />
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
                                                navigate('/orders');
                                                setShowUserMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 transition-colors"
                                        >
                                            <ShoppingBagOutlinedIcon fontSize="small" /> My Orders
                                        </button>
                                        <button
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                navigate('/favorites');
                                                setShowUserMenu(false);
                                            }}
                                            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 relative"
                                        >
                                            <FavoriteBorderIcon fontSize="small" /> My Favorites
                                            {favoriteCount > 0 && (
                                                <span className={`${badgeClass} top-1 right-4`}>
                                                    {favoriteCount}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onMouseDown={(e) => {
                                                e.stopPropagation();

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
                        <img src={gashLogo} alt="GASH Logo" className="h-6 md:h-7" />
                    </Link>
                    <div className="relative flex-1 mx-4 sm:mx-6 md:mx-8 lg:mx-12 max-w-2xl" ref={dropdownRef}>
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex items-center w-full bg-white rounded-full shadow-sm border border-gray-200 overflow-hidden"
                        >
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                }}
                                placeholder="Search products..."
                                className="flex-1 pl-3 sm:pl-4 md:pl-5 pr-10 sm:pr-12 py-1.5 sm:py-2 text-sm sm:text-base text-gray-900 focus:outline-none"
                            />
                            <button type="submit" className="p-2 mr-2 text-gray-600 hover:text-amber-500 transition-colors duration-200 ease-in-out">
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
                                            return (
                                                <Link
                                                    key={item._id}
                                                    to={`/product/${item._id}`}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#ffb300]/20 transition-colors border-b last:border-0"
                                                    onClick={() => {
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
                                onClick={handleLiveStreamClick}
                                title="Live Stream"
                                className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out"
                            >
                                <TvOutlinedIcon />
                                {livestreamCount > 0 && (
                                    <span className={`${badgeClass} -top-1 -right-1`}>
                                        {livestreamCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => {

                                    user ? navigate("/cart") : navigate("/login");
                                }}
                                title="Cart"
                                className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out"
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

                                        navigate("/login");
                                    }}
                                    title="Notifications"
                                    className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out"
                                >
                                    <NotificationsOutlinedIcon />
                                </button>
                            </div>
                        )}
                        <div className="relative flex items-center gap-2 cursor-pointer" onClick={() => {

                            user ? setShowUserMenu((prev) => !prev) : navigate("/login");
                        }}>
                            <button
                                title="My Account"
                                className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out"
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

                                            navigate("/favorites");
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 transition-colors relative"
                                    >
                                        My Favorites
                                        {favoriteCount > 0 && (
                                            <span className={`${badgeClass} top-1 right-4`}>
                                                {favoriteCount}
                                            </span>
                                        )}
                                    </button>
                                    {/* <button
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            navigate("/feedback");
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-[#ffb300]/20 transition-colors"
                                    >
                                        My Feedback
                                    </button> */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
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