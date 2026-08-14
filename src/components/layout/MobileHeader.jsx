import React from "react";
import { Link } from "react-router-dom";
import { Search, X, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import gashLogo from "../../assets/image/gash-logo.svg";
import Form from "../ui/Form";
import HeaderUserMenu from "./HeaderUserMenu";

export function MobileHeader({
  user,
  search,
  setSearch,
  searchResults,
  showDropdown,
  setShowDropdown,
  loading,
  cartItemCount,
  showUserMenu,
  setShowUserMenu,
  mobileSearchOpen,
  setMobileSearchOpen,
  userMenuRef,
  navigate,
  handleSearchSubmit,
  handleLogout,
  getFirstName,
  getMainImageUrl,
  getMinPrice,
  formatPrice,
  badgeClass,
  favoriteCount,
}) {
  return (
    <div className="flex w-full items-center justify-between sm:hidden">
      {mobileSearchOpen ? (
        <div className="relative w-full">
          <Form
            onSubmit={handleSearchSubmit}
            className="flex items-center w-full bg-white rounded-full shadow-sm border border-gray-200 overflow-hidden relative"
            showSubmitButton={false}
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
                aria-label="Clear search input"
                className="absolute right-2 p-2 text-gray-500 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                }}
                aria-label="Close search"
                className="absolute right-2 p-2 text-gray-600 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </Form>
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-full left-0 mt-2 w-full rounded-xl shadow-lg z-50 bg-white border border-gray-200 overflow-hidden max-h-96 overflow-y-auto"
              >
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
                  <div className="px-4 py-4 text-gray-500 text-center">
                    No products found
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <>
          <button
            onClick={() => {
              setMobileSearchOpen(true);
            }}
            title="Search"
            aria-label="Open search bar"
            className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out relative"
          >
            <Search className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center justify-center">
            <img src={gashLogo} alt="GASH Logo" className="h-6 sm:h-7" />
          </Link>
          <div className="flex items-center gap-1">
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

            <HeaderUserMenu
              user={user}
              showUserMenu={showUserMenu}
              setShowUserMenu={setShowUserMenu}
              favoriteCount={favoriteCount}
              getFirstName={getFirstName}
              handleLogout={handleLogout}
              navigate={navigate}
              userMenuRef={userMenuRef}
              isMobile={true}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default MobileHeader;
