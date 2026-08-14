import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";

export default function ProductFilters({
  categoriesList = [],
  colorsList = [],
  sizesList = [],
  selectedCategory,
  selectedColor,
  selectedSize,
  minPrice,
  maxPrice,
  priceRange,
  handleFilterChange,
  clearAllFilters,
  hasActiveFilters,
  showMobileFilters,
  setShowMobileFilters,
  formatPrice,
}) {
  const FilterSection = ({ title, options, selectedValue, filterType }) => (
    <fieldset className="mb-4 border-2 border-gray-300 rounded-xl p-3">
      <legend className="text-sm sm:text-base font-semibold">{title}</legend>
      {["All", ...options].map((option) => {
        const value = option === "All" ? `All ${title}` : option;
        return (
          <label key={value} className="flex items-center my-1.5 text-xs sm:text-sm cursor-pointer">
            <input
              type="radio"
              name={filterType}
              value={value}
              checked={selectedValue === value}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
              className="mr-2 accent-amber-400"
            />
            {value}
          </label>
        );
      })}
    </fieldset>
  );

  const renderFilterSections = () => (
    <>
      <FilterSection
        title="Categories"
        options={categoriesList}
        selectedValue={selectedCategory}
        filterType="category"
      />

      <FilterSection
        title="Colors"
        options={colorsList}
        selectedValue={selectedColor}
        filterType="color"
      />

      <FilterSection
        title="Sizes"
        options={sizesList}
        selectedValue={selectedSize}
        filterType="size"
      />

      {/* Price Range Filter */}
      <fieldset className="mb-4 border-2 border-gray-300 rounded-xl p-3">
        <legend className="text-sm sm:text-base font-semibold">Price Range</legend>
        <div className="space-y-3">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Min Price (VND)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={minPrice}
              onChange={(e) => handleFilterChange("minPrice", e.target.value)}
              placeholder={priceRange.min > 0 ? priceRange.min.toString() : ""}
              className="w-full p-3 border-2 border-gray-300 rounded-md bg-white text-xs sm:text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Max Price (VND)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={maxPrice}
              onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
              placeholder={priceRange.max > 0 ? priceRange.max.toString() : ""}
              className="w-full p-3 border-2 border-gray-300 rounded-md bg-white text-xs sm:text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none"
            />
          </div>
          {priceRange.max > 0 && (
            <p className="text-xs text-gray-500">
              Range: {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
            </p>
          )}
        </div>
      </fieldset>
    </>
  );

  return (
    <aside className="w-full md:w-60 lg:w-64 px-0 flex-shrink-0 mb-4 md:mb-0 pb-4 md:pb-0" role="complementary" aria-label="Product filters">
      <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 w-full">
        <button
          className="flex justify-between items-center w-full mb-0 md:mb-4 h-8 focus:outline-none"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          aria-expanded={showMobileFilters}
          aria-controls="mobile-filters-content"
        >
          <h1 className="text-xl sm:text-2xl m-0 flex items-center gap-2">
            Filters
            <span className="md:hidden">
              {showMobileFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </span>
          </h1>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                className="text-blue-600"
                aria-label="Clear all filters"
              >
                Clear All
              </Button>
            )}
          </div>
        </button>

        {/* Desktop static layout */}
        <div className="hidden md:block">
          {renderFilterSections()}
        </div>

        {/* Mobile animated layout */}
        <AnimatePresence initial={false}>
          {showMobileFilters && (
            <motion.div
              id="mobile-filters-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden pt-4"
            >
              {renderFilterSections()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
