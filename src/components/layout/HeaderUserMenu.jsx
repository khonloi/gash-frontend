import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ShoppingBag, Ticket, Heart, LogOut } from "lucide-react";

export function HeaderUserMenu({
  user,
  showUserMenu,
  setShowUserMenu,
  favoriteCount,
  getFirstName,
  handleLogout,
  navigate,
  userMenuRef,
  isMobile = false,
}) {
  const renderMenuItems = () => (
    <>
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          navigate("/profile");
          setShowUserMenu(false);
        }}
        className="flex items-center gap-3 w-full text-left p-3 hover:bg-[#ffb300]/20 transition-colors text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <User className="w-4 h-4 text-gray-500" />
        <span>My Account</span>
      </button>
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          navigate("/orders");
          setShowUserMenu(false);
        }}
        className="flex items-center gap-3 w-full text-left p-3 hover:bg-[#ffb300]/20 transition-colors text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <ShoppingBag className="w-4 h-4 text-gray-500" />
        <span>My Orders</span>
      </button>
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          navigate("/vouchers");
          setShowUserMenu(false);
        }}
        className="flex items-center gap-3 w-full text-left p-3 hover:bg-[#ffb300]/20 transition-colors text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <Ticket className="w-4 h-4 text-gray-500" />
        <span>My Vouchers</span>
      </button>
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          navigate("/favorites");
          setShowUserMenu(false);
        }}
        className="flex items-center justify-between w-full p-3 hover:bg-[#ffb300]/20 transition-colors text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <div className="flex items-center gap-3">
          <Heart className="w-4 h-4 text-gray-500" />
          <span>My Favorites</span>
        </div>
        {favoriteCount > 0 && (
          <span className="bg-amber-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {favoriteCount}
          </span>
        )}
      </button>
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          handleLogout();
        }}
        className="flex items-center gap-3 w-full text-left p-3 hover:bg-red-50 text-red-600 transition-colors text-sm font-medium border-t border-gray-100"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </>
  );

  if (isMobile) {
    return (
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
          aria-label="My Account"
          className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out relative"
        >
          <User className="w-5 h-5" />
        </button>
        <AnimatePresence>
          {user && showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-44 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden z-50 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {renderMenuItems()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center gap-2 cursor-pointer"
      onClick={() => {
        user ? setShowUserMenu((prev) => !prev) : navigate("/login");
      }}
      ref={userMenuRef}
    >
      <button
        title="My Account"
        aria-label="My Account"
        className="p-2 text-white hover:text-amber-500 transition-colors duration-200 ease-in-out relative"
      >
        <User className="w-5 h-5" />
      </button>
      {user && (
        <span className="hidden md:block text-xs md:text-sm text-gray-200">
          <span className="font-semibold text-white">
            {getFirstName(user?.name)}
          </span>
        </span>
      )}
      <AnimatePresence>
        {user && showUserMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-44 bg-white text-gray-900 rounded-xl shadow-lg overflow-hidden z-50 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {renderMenuItems()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HeaderUserMenu;
