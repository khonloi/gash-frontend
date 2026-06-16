import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard, { ProductCardSkeleton } from "../../features/products/components/ProductCard";
import Button from "../ui/Button";
import {
  FILTER_STORAGE_KEY,
  SEARCH_DEBOUNCE_DELAY
} from "../../constants/constants";

// Helper hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Helper function to get minimum price from product variants
const getMinPrice = (product) => {
  if (!product?.productVariantIds || product.productVariantIds.length === 0) {
    return 0;
  }
  const prices = product.productVariantIds
    .filter(v => v.variantStatus !== "discontinued" && v.variantPrice > 0)
    .map(v => v.variantPrice);
  return prices.length > 0 ? Math.min(...prices) : 0;
};

const formatPrice = (price) => {
  if (typeof price !== "number" || isNaN(price)) return "N/A";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};

const ProductGridLayout = ({
  title,
  rawProducts = [],
  variants = [],
  loading = false,
  error = null,
  onRetry,
  isFavoritesPage = false,
  syncToUrl = true,
  handleRemoveFavorite,
  showSearch = true
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sanitizeParam = (param) => (typeof param === "string" ? param.replace(/[<>]/g, "") : null);

  // Helper to initialize filters from URL/Storage or defaults
  const getInitialFilter = (paramKey, defaultVal) => {
    if (!syncToUrl) return defaultVal;

    const urlVal = sanitizeParam(searchParams.get(paramKey));
    if (urlVal !== null) return urlVal;

    try {
      const item = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed[paramKey] !== undefined) return parsed[paramKey];
      }
    } catch (err) {
      console.warn(`Error reading localStorage for filters:`, err);
    }
    return defaultVal;
  };

  // State management
  const [selectedCategory, setSelectedCategory] = useState(() => getInitialFilter("category", "All Categories"));
  const [selectedColor, setSelectedColor] = useState(() => getInitialFilter("color", "All Colors"));
  const [selectedSize, setSelectedSize] = useState(() => getInitialFilter("size", "All Sizes"));
  const [minPrice, setMinPrice] = useState(() => getInitialFilter("minPrice", ""));
  const [maxPrice, setMaxPrice] = useState(() => getInitialFilter("maxPrice", ""));
  const [sortBy, setSortBy] = useState(() => getInitialFilter("sortBy", "name"));
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
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

  // Debounced filter values
  const debouncedCategory = useDebounce(selectedCategory, SEARCH_DEBOUNCE_DELAY);
  const debouncedColor = useDebounce(selectedColor, SEARCH_DEBOUNCE_DELAY);
  const debouncedSize = useDebounce(selectedSize, SEARCH_DEBOUNCE_DELAY);
  const debouncedMinPrice = useDebounce(minPrice, SEARCH_DEBOUNCE_DELAY);
  const debouncedMaxPrice = useDebounce(maxPrice, SEARCH_DEBOUNCE_DELAY);

  // Focus error notification
  const errorRef = useRef(null);
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  // Normalize/extract product list (unifying products and favorites data structure)
  const productsList = useMemo(() => {
    if (!rawProducts) return [];
    if (isFavoritesPage) {
      return rawProducts
        .filter(fav => fav && fav.productId)
        .map(fav => ({
          ...fav.productId,
          favoriteId: fav._id,
          isFavorite: true
        }));
    }
    return rawProducts;
  }, [rawProducts, isFavoritesPage]);

  // Extract categories dynamically
  const categoriesList = useMemo(() => {
    return [
      ...new Set(
        productsList
          .filter((p) => p.categoryId && !p.categoryId.isDeleted)
          .map((p) => p.categoryId?.categoryName)
          .filter(Boolean)
      ),
    ].sort();
  }, [productsList]);

  // Extract colors dynamically
  const colorsList = useMemo(() => {
    const source = (variants && variants.length > 0)
      ? variants
      : productsList.flatMap((p) => p.productVariantIds || []);
    return [
      ...new Set(
        source
          .filter((v) => v.productColorId && !v.productColorId.isDeleted)
          .map((v) => v.productColorId?.productColorName)
          .filter(Boolean)
      ),
    ].sort();
  }, [variants, productsList]);

  // Extract sizes dynamically
  const sizesList = useMemo(() => {
    const source = (variants && variants.length > 0)
      ? variants
      : productsList.flatMap((p) => p.productVariantIds || []);
    return [
      ...new Set(
        source
          .filter((v) => v.productSizeId && !v.productSizeId.isDeleted)
          .map((v) => v.productSizeId?.productSizeName)
          .filter(Boolean)
      ),
    ].sort();
  }, [variants, productsList]);

  // Calculate global price range from all products
  const priceRange = useMemo(() => {
    if (!productsList.length) return { min: 0, max: 0 };
    const activeProducts = productsList.filter(
      (p) => p.productStatus === "active" && p.productVariantIds?.length > 0
    );
    const prices = activeProducts.map(getMinPrice).filter(price => price > 0);
    if (prices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [productsList]);

  // Sync state to URL and localStorage if requested
  const prevFiltersRef = useRef(null);
  useEffect(() => {
    if (!syncToUrl) return;

    const currentFilters = {
      category: debouncedCategory,
      color: debouncedColor,
      size: debouncedSize,
      minPrice: debouncedMinPrice,
      maxPrice: debouncedMaxPrice,
      sortBy: sortBy,
    };

    if (prevFiltersRef.current === null) {
      prevFiltersRef.current = currentFilters;
      return;
    }

    const hasChanged =
      prevFiltersRef.current.category !== currentFilters.category ||
      prevFiltersRef.current.color !== currentFilters.color ||
      prevFiltersRef.current.size !== currentFilters.size ||
      prevFiltersRef.current.minPrice !== currentFilters.minPrice ||
      prevFiltersRef.current.maxPrice !== currentFilters.maxPrice ||
      prevFiltersRef.current.sortBy !== currentFilters.sortBy;

    if (hasChanged) {
      prevFiltersRef.current = currentFilters;
      try {
        window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(currentFilters));
      } catch (err) {
        console.warn("Error setting localStorage key:", err);
      }
      const newSearchParams = new URLSearchParams();
      if (currentFilters.category !== "All Categories") {
        newSearchParams.set("category", currentFilters.category);
      }
      if (currentFilters.color !== "All Colors") {
        newSearchParams.set("color", currentFilters.color);
      }
      if (currentFilters.size !== "All Sizes") {
        newSearchParams.set("size", currentFilters.size);
      }
      if (currentFilters.minPrice) {
        newSearchParams.set("minPrice", currentFilters.minPrice);
      }
      if (currentFilters.maxPrice) {
        newSearchParams.set("maxPrice", currentFilters.maxPrice);
      }
      if (currentFilters.sortBy && currentFilters.sortBy !== "name") {
        newSearchParams.set("sortBy", currentFilters.sortBy);
      }
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  }, [debouncedCategory, debouncedColor, debouncedSize, debouncedMinPrice, debouncedMaxPrice, sortBy, syncToUrl, navigate]);

  // Set visual filtering state
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), SEARCH_DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [debouncedCategory, debouncedColor, debouncedSize, debouncedMinPrice, debouncedMaxPrice, sortBy, searchQuery]);

  // Filtering and sorting logic execution
  const activeProducts = useMemo(() => {
    if (!productsList.length) return [];

    let filtered = productsList.filter(
      (p) => p.productStatus === "active" && p.productVariantIds?.length > 0
    );

    // Apply category filter
    if (debouncedCategory !== "All Categories") {
      filtered = filtered.filter(
        (p) =>
          p.categoryId?.categoryName === debouncedCategory &&
          p.categoryId &&
          !p.categoryId.isDeleted
      );
    }

    // Apply color and size filters
    if (debouncedColor !== "All Colors" || debouncedSize !== "All Sizes") {
      filtered = filtered.filter((product) => {
        const productVariants = product.productVariantIds || [];
        return productVariants.some((variant) => {
          const colorMatches =
            debouncedColor === "All Colors" ||
            (variant.productColorId?.productColorName === debouncedColor &&
              variant.productColorId &&
              !variant.productColorId.isDeleted);
          const sizeMatches =
            debouncedSize === "All Sizes" ||
            (variant.productSizeId?.productSizeName === debouncedSize &&
              variant.productSizeId &&
              !variant.productSizeId.isDeleted);
          return colorMatches && sizeMatches;
        });
      });
    }

    // Apply price range filter
    if (debouncedMinPrice || debouncedMaxPrice) {
      filtered = filtered.filter((product) => {
        const productMinPrice = getMinPrice(product);
        if (productMinPrice === 0) return false;

        const min = debouncedMinPrice ? parseFloat(debouncedMinPrice) : 0;
        const max = debouncedMaxPrice ? parseFloat(debouncedMaxPrice) : Infinity;

        if (min > max) return false;

        return productMinPrice >= min && productMinPrice <= max;
      });
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product) =>
        product.productName?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return getMinPrice(a) - getMinPrice(b);
        case "price-high":
          return getMinPrice(b) - getMinPrice(a);
        case "new": {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        case "popularity": {
          const popDateA = new Date(a.createdAt || 0).getTime();
          const popDateB = new Date(b.createdAt || 0).getTime();
          return popDateB - popDateA;
        }
        case "name":
        default:
          return (a.productName || "").localeCompare(b.productName || "");
      }
    });

    return sorted;
  }, [productsList, debouncedCategory, debouncedColor, debouncedSize, debouncedMinPrice, debouncedMaxPrice, sortBy, searchQuery]);

  // Handlers
  const handleFilterChange = useCallback((filterType, value) => {
    switch (filterType) {
      case "category":
        setSelectedCategory(value);
        break;
      case "color":
        setSelectedColor(value);
        break;
      case "size":
        setSelectedSize(value);
        break;
      case "minPrice": {
        const parsed = value === "" ? "" : Number(value);
        if (parsed === "" || (!isNaN(parsed) && parsed >= 0)) {
          setMinPrice(parsed);
          if (typeof parsed === "number" && typeof maxPrice === "number" && maxPrice < parsed) {
            setMaxPrice(parsed);
          }
        }
        break;
      }
      case "maxPrice": {
        const parsed = value === "" ? "" : Number(value);
        if (parsed === "" || (!isNaN(parsed) && parsed >= 0)) {
          setMaxPrice(parsed);
          if (typeof parsed === "number" && typeof minPrice === "number" && minPrice > parsed) {
            setMinPrice(parsed);
          }
        }
        break;
      }
      case "sortBy":
        setSortBy(value);
        break;
      default:
        console.warn(`Unknown filter type: ${filterType}`);
    }
  }, [maxPrice, minPrice]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory("All Categories");
    setSelectedColor("All Colors");
    setSelectedSize("All Sizes");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("name");
    setSearchQuery("");
  }, []);

  const handleProductClick = useCallback(
    (id) => {
      if (!id) return;
      navigate(`/product/${id}`);
    },
    [navigate]
  );

  const handleKeyDown = useCallback(
    (e, id) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleProductClick(id);
      }
    },
    [handleProductClick]
  );

  const hasActiveFilters =
    selectedCategory !== "All Categories" ||
    selectedColor !== "All Colors" ||
    selectedSize !== "All Sizes" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    sortBy !== "name" ||
    searchQuery !== "";

  // Presentational filter section component
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

  const sortOptions = [
    { value: "name", label: "Name (A-Z)" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "new", label: "Newest First" },
    { value: "popularity", label: "Popularity" }
  ];

  const renderFilters = () => (
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
    <div className="page-container flex flex-col md:flex-row">
      {/* Sidebar Filters */}
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
            {renderFilters()}
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
                {renderFilters()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Grid Content */}
      <main className="flex-1 px-0 md:px-4 min-w-0" role="main">
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <header className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-3">
              <h1 className="text-xl sm:text-2xl font-normal m-0">{title}</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Sort by:
                </span>
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setIsSortOpen((prev) => !prev)}
                    className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white hover:bg-gray-50 transition-colors w-40 sm:w-44 text-left font-medium text-gray-700 cursor-pointer"
                    aria-haspopup="listbox"
                    aria-expanded={isSortOpen}
                  >
                    <span>{sortOptions.find(opt => opt.value === sortBy)?.label || "Name (A-Z)"}</span>
                    {isSortOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
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
                              handleFilterChange("sortBy", option.value);
                              setIsSortOpen(false);
                            }}
                            className={`px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors ${sortBy === option.value
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
            </div>
            {activeProducts.length > 0 && !loading && !isFiltering && (
              <p className="text-sm text-gray-600 mb-4">
                Showing {activeProducts.length} product{activeProducts.length !== 1 ? "s" : ""}
                {hasActiveFilters && " matching your filters"}
              </p>
            )}
          </header>

          {/* Optional Search Bar */}
          {showSearch && (!loading && productsList.length > 0) && (
            <div className="mb-4 sm:mb-5 md:mb-6">
              <fieldset className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <legend className="text-sm sm:text-base font-semibold m-0">Search</legend>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by product name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 pl-10 border-2 border-gray-300 rounded-md bg-white text-xs sm:text-sm transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                        aria-label="Search products"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {searchQuery && (
                    <div className="flex items-end">
                      <Button
                        variant="default"
                        size="md"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </fieldset>
            </div>
          )}

          {error && (
            <div
              ref={errorRef}
              className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap"
              role="alert"
              tabIndex={0}
              aria-live="polite"
            >
              <span className="text-lg" aria-hidden="true">⚠</span>
              {error}
              {onRetry && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onRetry}
                  disabled={loading}
                  className="text-blue-600"
                  aria-label="Retry loading"
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          {/* Product Grid Section - Always visible */}
          {!loading && !isFiltering && activeProducts.length === 0 && !error && (
            <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center" role="status">
              <p>No products found matching the criteria</p>
              {hasActiveFilters && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-blue-600"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
            role="grid"
            aria-label={(loading || isFiltering) ? "Loading products" : `${activeProducts.length} products`}
          >
            {(loading || isFiltering) ? (
              [...Array(8)].map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            ) : (
              activeProducts.map((item) => (
                <ProductCard
                  key={item._id}
                  product={item}
                  isFavorite={item.isFavorite || false}
                  favoriteId={item.favoriteId}
                  handleProductClick={handleProductClick}
                  handleKeyDown={handleKeyDown}
                  handleRemoveFavorite={handleRemoveFavorite}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProductGridLayout;
