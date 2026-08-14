import React from "react";
import { Link } from "react-router-dom";
import gashLogo from "../../assets/image/gash-logo.svg";
import { useHeader } from "./hooks/useHeader";
import { Bell, ShoppingBag, Tv } from "lucide-react";
import NotificationsDropdown from "../../features/notifications/components/NotificationsDropdown";
import HeaderSearch from "./HeaderSearch";
import HeaderUserMenu from "./HeaderUserMenu";
import MobileHeader from "./MobileHeader";

export default function Header() {
    const {
        user,
        search,
        setSearch,
        searchResults,
        showDropdown,
        setShowDropdown,
        loading,
        cartItemCount,
        notificationCount,
        livestreamCount,
        favoriteCount,
        randomCategories,
        showUserMenu,
        setShowUserMenu,
        mobileSearchOpen,
        setMobileSearchOpen,
        userMenuRef,
        dropdownRef,
        navigate,
        handleSearchSubmit,
        handleLogout,
        handleLiveStreamClick,
        getFirstName,
        getMainImageUrl,
        getMinPrice,
        formatPrice,
    } = useHeader();

    const badgeClass =
        "absolute bg-amber-500 text-white text-[10px] sm:text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center pointer-events-none";

    return (
        <nav
            aria-label="Main Navigation"
            className="sticky top-0 z-40 bg-[#0c1015]/80 backdrop-blur-md border-b border-gray-800 shadow-sm"
        >
            <div className="border-b border-gray-800 bg-[#0c1015]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex items-center justify-end gap-3 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-1 text-xs">
                    {randomCategories.map((cat) => (
                        <Link
                            key={cat._id}
                            to={`/category/${cat._id}`}
                            className="text-gray-400 hover:text-amber-500 transition-colors"
                        >
                            {cat.categoryName}
                        </Link>
                    ))}
                    {randomCategories.length === 0 && (
                        <span className="text-gray-500 italic">For Demonstration Purposes</span>
                    )}
                </div>
            </div>
            <div className="max-w-7xl mx-auto h-16 sm:h-20 md:h-24 flex items-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
                {/* ==== MOBILE HEADER ==== */}
                <MobileHeader
                    user={user}
                    search={search}
                    setSearch={setSearch}
                    searchResults={searchResults}
                    showDropdown={showDropdown}
                    setShowDropdown={setShowDropdown}
                    loading={loading}
                    cartItemCount={cartItemCount}
                    showUserMenu={showUserMenu}
                    setShowUserMenu={setShowUserMenu}
                    mobileSearchOpen={mobileSearchOpen}
                    setMobileSearchOpen={setMobileSearchOpen}
                    userMenuRef={userMenuRef}
                    navigate={navigate}
                    handleSearchSubmit={handleSearchSubmit}
                    handleLogout={handleLogout}
                    getFirstName={getFirstName}
                    getMainImageUrl={getMainImageUrl}
                    getMinPrice={getMinPrice}
                    formatPrice={formatPrice}
                    badgeClass={badgeClass}
                    favoriteCount={favoriteCount}
                />

                {/* ==== DESKTOP HEADER ==== */}
                <div className="hidden sm:flex w-full items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={gashLogo} alt="GASH Logo" className="h-6 md:h-7" />
                    </Link>

                    <HeaderSearch
                        search={search}
                        setSearch={setSearch}
                        searchResults={searchResults}
                        showDropdown={showDropdown}
                        setShowDropdown={setShowDropdown}
                        loading={loading}
                        dropdownRef={dropdownRef}
                        handleSearchSubmit={handleSearchSubmit}
                        navigate={navigate}
                        getMinPrice={getMinPrice}
                        getMainImageUrl={getMainImageUrl}
                        formatPrice={formatPrice}
                    />

                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                        <div className="relative">
                            <button
                                onClick={handleLiveStreamClick}
                                title="Live Stream"
                                aria-label="Live Stream"
                                className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out relative"
                            >
                                <Tv className="w-5 h-5" />
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
                                aria-label="Cart"
                                className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out relative"
                            >
                                <ShoppingBag className="w-5 h-5" />
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
                                    aria-label="Notifications"
                                    className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out relative"
                                >
                                    <Bell className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        <HeaderUserMenu
                            user={user}
                            showUserMenu={showUserMenu}
                            setShowUserMenu={setShowUserMenu}
                            favoriteCount={favoriteCount}
                            getFirstName={getFirstName}
                            handleLogout={handleLogout}
                            navigate={navigate}
                            userMenuRef={userMenuRef}
                            isMobile={false}
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
}