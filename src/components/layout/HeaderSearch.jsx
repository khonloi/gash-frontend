import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import Form from "../ui/Form";

export function HeaderSearch({
  search,
  setSearch,
  searchResults,
  showDropdown,
  setShowDropdown,
  loading,
  dropdownRef,
  handleSearchSubmit,
  navigate,
  getMinPrice,
  getMainImageUrl,
  formatPrice,
}) {
  return (
    <div
      className="relative flex-1 mx-4 sm:mx-6 md:mx-8 lg:mx-12 max-w-2xl"
      ref={dropdownRef}
    >
      <Form
        onSubmit={handleSearchSubmit}
        className="flex items-center w-full bg-white rounded-full shadow-sm border border-gray-200 overflow-hidden"
        showSubmitButton={false}
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
        <button
          type="submit"
          aria-label="Submit search"
          className="p-2 mr-2 text-gray-600 hover:text-amber-500 transition-colors duration-200 ease-in-out"
        >
          <Search className="w-5 h-5" />
        </button>
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
  );
}

export default HeaderSearch;
