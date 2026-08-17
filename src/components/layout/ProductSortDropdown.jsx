import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const sortOptions = [
  { value: "name", label: "Name (A-Z)" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "new", label: "Newest First" },
  { value: "popularity", label: "Popularity" },
];

/**
 * Animated dropdown for sorting products in grid layout.
 */
export default function ProductSortDropdown({ sortBy = "name", onSortChange }) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || "Name (A-Z)";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs sm:text-sm font-medium text-gray-700">Sort by:</span>
      <div className="relative" ref={sortRef}>
        <button
          onClick={() => setIsSortOpen((prev) => !prev)}
          className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white hover:bg-gray-50 transition-colors w-40 sm:w-44 text-left font-medium text-gray-700 cursor-pointer"
          aria-haspopup="listbox"
          aria-expanded={isSortOpen}
          type="button"
        >
          <span>{currentLabel}</span>
          {isSortOpen ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </button>

        <AnimatePresence>
          {isSortOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 mt-1.5 w-40 sm:w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 focus:outline-none"
              role="listbox"
            >
              {sortOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsSortOpen(false);
                  }}
                  className={`px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors ${
                    sortBy === option.value
                      ? "bg-amber-100 text-amber-900 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  role="option"
                  aria-selected={sortBy === option.value}
                >
                  {option.label}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
