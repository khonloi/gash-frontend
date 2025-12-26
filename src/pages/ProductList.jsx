import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { FiFilter } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import Api from "../common/SummaryAPI";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import ProductButton from "../components/ProductButton";
import {
  FILTER_STORAGE_KEY,
  DEFAULT_FILTERS,
  API_RETRY_COUNT,
  API_RETRY_DELAY,
  SEARCH_DEBOUNCE_DELAY
} from "../constants/constants";

// Custom hooks
const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [value, setStoredValue];
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Interceptors are set in axiosClient.js

// API functions
const fetchWithRetry = async (apiCall, retries = API_RETRY_COUNT, delay = API_RETRY_DELAY) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await apiCall();
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Helper function to get minimum price from product variants
const getMinPrice = (product) => {
  if (!product.productVariantIds || product.productVariantIds.length === 0) {
    return 0;
  }
  const prices = product.productVariantIds
    .filter(v => v.variantStatus !== 'discontinued' && v.variantPrice > 0)
    .map(v => v.variantPrice);
  return prices.length > 0 ? Math.min(...prices) : 0;
};

// Helper function to get main image URL (currently unused but kept for future use)
// const getMainImageUrl = (product) => {
//   if (!product.productImageIds || product.productImageIds.length === 0) {
//     return "/placeholder-image.png";
//   }
//   const mainImage = product.productImageIds.find(img => img.isMain);
//   return mainImage?.imageUrl || product.productImageIds[0]?.imageUrl || "/placeholder-image.png";
// };

const ProductList = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);

  // State for showing all items in filter sections
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [showAllSizes, setShowAllSizes] = useState(false);

  // State for mobile filter visibility
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter state
  const [searchParams] = useSearchParams();
  const [storedFilters, setStoredFilters] = useLocalStorage(FILTER_STORAGE_KEY, DEFAULT_FILTERS);

  const sanitizeParam = (param) => (typeof param === "string" ? param.replace(/[<>]/g, "") : null);

  const [selectedCategory, setSelectedCategory] = useState(
    sanitizeParam(searchParams.get("category")) || storedFilters.category || DEFAULT_FILTERS.category
  );
  const [selectedColor, setSelectedColor] = useState(
    sanitizeParam(searchParams.get("color")) || storedFilters.color || DEFAULT_FILTERS.color
  );
  const [selectedSize, setSelectedSize] = useState(
    sanitizeParam(searchParams.get("size")) || storedFilters.size || DEFAULT_FILTERS.size
  );
  const [minPrice, setMinPrice] = useState(() => {
    const param = searchParams.get("minPrice");
    const stored = storedFilters.minPrice;
    const defaultVal = DEFAULT_FILTERS.minPrice;
    return param || stored || defaultVal;
  });
  const [maxPrice, setMaxPrice] = useState(() => {
    const param = searchParams.get("maxPrice");
    const stored = storedFilters.maxPrice;
    const defaultVal = DEFAULT_FILTERS.maxPrice;
    return param || stored || defaultVal;
  });
  const [sortBy, setSortBy] = useState(
    sanitizeParam(searchParams.get("sortBy")) || storedFilters.sortBy || DEFAULT_FILTERS.sortBy
  );

  const navigate = useNavigate();

  // Debounced filters
  const debouncedCategory = useDebounce(selectedCategory, SEARCH_DEBOUNCE_DELAY);
  const debouncedColor = useDebounce(selectedColor, SEARCH_DEBOUNCE_DELAY);
  const debouncedSize = useDebounce(selectedSize, SEARCH_DEBOUNCE_DELAY);
  const debouncedMinPrice = useDebounce(minPrice, SEARCH_DEBOUNCE_DELAY);
  const debouncedMaxPrice = useDebounce(maxPrice, SEARCH_DEBOUNCE_DELAY);

  // Data fetching - use refs to prevent unnecessary re-renders
  const hasFetchedProductsRef = useRef(false);
  const hasFetchedVariantsRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    if (hasFetchedProductsRef.current) return;
    hasFetchedProductsRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithRetry(() => Api.newProducts.getAll());
      const productsData = response?.data || response || [];

      if (!Array.isArray(productsData) || productsData.length === 0) {
        setError("No products available at this time");
        setProducts([]);
        setCategories([]);
        return;
      }

      setProducts(productsData);
      // Extract categories, filter out deleted categories (isDeleted: false)
      const uniqueCategories = [
        ...new Set(
          productsData
            .filter((product) => product.categoryId && !product.categoryId.isDeleted)
            .map((product) => product.categoryId?.cat_name)
            .filter(Boolean)
        ),
      ].sort();
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch products");
      hasFetchedProductsRef.current = false; // Allow retry on error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVariants = useCallback(async () => {
    if (hasFetchedVariantsRef.current) return;
    hasFetchedVariantsRef.current = true;
    try {
      const response = await fetchWithRetry(() => Api.newVariants.getAll());
      const variantsData = response?.data || response || [];

      if (!Array.isArray(variantsData)) {
        console.warn("Invalid variants data received");
        setError("Failed to load product variants");
        hasFetchedVariantsRef.current = false; // Allow retry on error
        return;
      }

      setVariants(variantsData);
      // Extract colors, filter out deleted colors (isDeleted: false)
      const uniqueColors = [
        ...new Set(
          variantsData
            .filter((variant) => variant.productColorId && !variant.productColorId.isDeleted)
            .map((variant) => variant.productColorId?.color_name)
            .filter(Boolean)
        ),
      ].sort();
      // Extract sizes, filter out deleted sizes (isDeleted: false)
      const uniqueSizes = [
        ...new Set(
          variantsData
            .filter((variant) => variant.productSizeId && !variant.productSizeId.isDeleted)
            .map((variant) => variant.productSizeId?.size_name)
            .filter(Boolean)
        ),
      ].sort();
      setColors(uniqueColors);
      setSizes(uniqueSizes);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch variants");
      hasFetchedVariantsRef.current = false; // Allow retry on error
    }
  }, []);

  // Initial fetch - only once on mount
  useEffect(() => {
    fetchProducts();
    fetchVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate price range from products
  const priceRange = useMemo(() => {
    if (!products.length) return { min: 0, max: 0 };
    const activeProducts = products.filter(
      (product) => product.productStatus === "active" && product.productVariantIds?.length > 0
    );
    const prices = activeProducts.map(getMinPrice).filter(price => price > 0);
    if (prices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [products]);

  // Sync filters with URL and localStorage - only when debounced values change
  const prevFiltersRef = useRef(null);
  useEffect(() => {
    const currentFilters = {
      category: debouncedCategory,
      color: debouncedColor,
      size: debouncedSize,
      minPrice: debouncedMinPrice,
      maxPrice: debouncedMaxPrice,
      sortBy: sortBy,
    };

    // Only update if filters actually changed (skip initial render if no change)
    if (prevFiltersRef.current === null) {
      prevFiltersRef.current = currentFilters;
      return; // Skip on initial mount
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
      setStoredFilters(currentFilters);
      const newSearchParams = new URLSearchParams();
      if (currentFilters.category !== DEFAULT_FILTERS.category) {
        newSearchParams.set("category", currentFilters.category);
      }
      if (currentFilters.color !== DEFAULT_FILTERS.color) {
        newSearchParams.set("color", currentFilters.color);
      }
      if (currentFilters.size !== DEFAULT_FILTERS.size) {
        newSearchParams.set("size", currentFilters.size);
      }
      if (currentFilters.minPrice && currentFilters.minPrice !== DEFAULT_FILTERS.minPrice) {
        newSearchParams.set("minPrice", currentFilters.minPrice);
      }
      if (currentFilters.maxPrice && currentFilters.maxPrice !== DEFAULT_FILTERS.maxPrice) {
        newSearchParams.set("maxPrice", currentFilters.maxPrice);
      }
      if (currentFilters.sortBy && currentFilters.sortBy !== DEFAULT_FILTERS.sortBy) {
        newSearchParams.set("sortBy", currentFilters.sortBy);
      }
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  }, [debouncedCategory, debouncedColor, debouncedSize, debouncedMinPrice, debouncedMaxPrice, sortBy, setStoredFilters, navigate]);

  // Focus error notification
  const errorRef = useRef(null);
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  // Note: variantIndex removed as it's not used in current filtering logic
  // Variants are accessed directly from product.productVariantIds in filterProducts

  // Optimized product filtering and sorting
  const activeProducts = useMemo(() => {
    if (!products.length) return [];

    // Filter only active products
    let active = products.filter(
      (product) => product.productStatus === "active" && product.productVariantIds?.length > 0
    );

    // Apply category filter
    if (debouncedCategory !== "All Categories") {
      active = active.filter(
        (product) =>
          product.categoryId?.cat_name === debouncedCategory &&
          product.categoryId &&
          !product.categoryId.isDeleted
      );
    }

    // Apply color and size filters
    if ((debouncedColor !== "All Colors" || debouncedSize !== "All Sizes") && variants.length) {
      active = active.filter((product) => {
        const productVariants = product.productVariantIds || [];
        return productVariants.some((variant) => {
          // Filter out deleted colors and sizes
          const colorMatches =
            debouncedColor === "All Colors" ||
            (variant.productColorId?.color_name === debouncedColor &&
              variant.productColorId &&
              !variant.productColorId.isDeleted);
          const sizeMatches =
            debouncedSize === "All Sizes" ||
            (variant.productSizeId?.size_name === debouncedSize &&
              variant.productSizeId &&
              !variant.productSizeId.isDeleted);
          return colorMatches && sizeMatches;
        });
      });
    }

    // Apply price range filter
    if (debouncedMinPrice || debouncedMaxPrice) {
      active = active.filter((product) => {
        const productMinPrice = getMinPrice(product);
        if (productMinPrice === 0) return false;

        const min = debouncedMinPrice ? parseFloat(debouncedMinPrice) : 0;
        const max = debouncedMaxPrice ? parseFloat(debouncedMaxPrice) : Infinity;

        // Validate that min is not greater than max
        if (min > max) return false;

        return productMinPrice >= min && productMinPrice <= max;
      });
    }

    // Apply sorting
    const sorted = [...active].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return getMinPrice(a) - getMinPrice(b);
        case "price-high":
          return getMinPrice(b) - getMinPrice(a);
        case "new": {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA; // Newest first
        }
        case "popularity": {
          // Since there's no popularity field, we'll use createdAt as a proxy (newer = more popular)
          // Or we could sort by name as fallback
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
  }, [products, debouncedCategory, debouncedColor, debouncedSize, debouncedMinPrice, debouncedMaxPrice, sortBy, variants.length]);

  // Event handlers
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
        // Normalize numeric input: allow empty string to represent no filter
        const parsed = value === '' ? '' : Number(value);
        if (parsed === '' || (!isNaN(parsed) && parsed >= 0)) {
          setMinPrice(parsed);
          // If maxPrice is set and now less than minPrice, clamp maxPrice
          if (typeof parsed === 'number' && typeof maxPrice === 'number' && maxPrice < parsed) {
            setMaxPrice(parsed);
          }
        }
        break;
      }
      case "maxPrice": {
        const parsed = value === '' ? '' : Number(value);
        if (parsed === '' || (!isNaN(parsed) && parsed >= 0)) {
          setMaxPrice(parsed);
          // If minPrice is set and now greater than maxPrice, clamp minPrice
          if (typeof parsed === 'number' && typeof minPrice === 'number' && minPrice > parsed) {
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

  const handleProductClick = useCallback(
    (id) => {
      if (!id) {
        setError("Invalid product selected");
        return;
      }
      navigate(`/product/${id}`);
    },
    [navigate, setError]
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

  const handleRetry = useCallback(() => {
    hasFetchedProductsRef.current = false;
    hasFetchedVariantsRef.current = false;
    fetchProducts();
    fetchVariants();
  }, [fetchProducts, fetchVariants]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory(DEFAULT_FILTERS.category);
    setSelectedColor(DEFAULT_FILTERS.color);
    setSelectedSize(DEFAULT_FILTERS.size);
    setMinPrice(DEFAULT_FILTERS.minPrice);
    setMaxPrice(DEFAULT_FILTERS.maxPrice);
    setSortBy(DEFAULT_FILTERS.sortBy);
  }, []);

  // Helpers
  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);

  // Filter section component
  const FilterSection = ({ title, options, selectedValue, filterType, showAll, onToggleShowAll }) => {
    const ITEMS_TO_SHOW = 5;
    const allOptions = ["All", ...options];
    const displayOptions = showAll ? allOptions : allOptions.slice(0, ITEMS_TO_SHOW + 1); // +1 để bao gồm "All"
    const hasMore = options.length > ITEMS_TO_SHOW;

    return (
      <fieldset className="mb-3 border-2 border-yellow-200/60 rounded-xl p-3 bg-gradient-to-br from-white to-yellow-50/20 shadow-[0_2px_8px_rgba(234,179,8,0.1)]">
        <legend className="text-sm font-bold text-yellow-700 px-2">{title}</legend>
        <div className="space-y-1 mt-1.5">
          {displayOptions.map((option) => {
            const value = option === "All" ? `All ${title}` : option;
            const isSelected = selectedValue === value;
            return (
              <label key={value} className="flex items-center p-1.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-yellow-50/50 group">
                <input
                  type="radio"
                  name={filterType}
                  value={value}
                  checked={isSelected}
                  onChange={(e) => handleFilterChange(filterType, e.target.value)}
                  className="mr-2 accent-yellow-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className={`text-xs transition-colors duration-200 ${isSelected ? 'text-yellow-700 font-semibold' : 'text-gray-700 group-hover:text-yellow-600'}`}>
                  {value}
                </span>
              </label>
            );
          })}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={onToggleShowAll}
            className="mt-2 w-full text-yellow-600 hover:text-yellow-700 py-1.5 px-2 rounded-lg hover:bg-yellow-50/50 transition-all duration-200 border border-yellow-200/60 hover:border-yellow-300 flex items-center justify-center"
            aria-label={showAll ? "Show Less" : `Show All (${options.length})`}
            title={showAll ? "Show Less" : `Show All (${options.length})`}
          >
            {showAll ? (
              <HiChevronUp className="text-lg font-bold" />
            ) : (
              <HiChevronDown className="text-lg font-bold" />
            )}
          </button>
        )}
      </fieldset>
    );
  };

  const hasActiveFilters =
    selectedCategory !== DEFAULT_FILTERS.category ||
    selectedColor !== DEFAULT_FILTERS.color ||
    selectedSize !== DEFAULT_FILTERS.size ||
    minPrice !== DEFAULT_FILTERS.minPrice ||
    maxPrice !== DEFAULT_FILTERS.maxPrice ||
    sortBy !== DEFAULT_FILTERS.sortBy;

  // Update filtering state
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), SEARCH_DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [debouncedCategory, debouncedColor, debouncedSize, debouncedMinPrice, debouncedMaxPrice, sortBy]);

  return (
    <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto my-4 sm:my-5 md:my-6 p-4 sm:p-5 md:p-6 lg:p-7 text-gray-900">
      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden mb-4 flex items-center justify-between">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl shadow-[0_4px_15px_rgba(234,179,8,0.3)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.4)] transition-all duration-300 font-semibold text-sm"
          aria-label="Toggle filters"
        >
          <FiFilter className="text-lg" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-white text-yellow-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              !
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto"
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl mt-auto shadow-2xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-yellow-600 m-0">Filters</h1>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                aria-label="Close filters"
              >
                <IoClose className="text-2xl text-gray-600" />
              </button>
            </div>
            {hasActiveFilters && (
              <div className="mb-4">
                <ProductButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    clearAllFilters();
                    setShowMobileFilters(false);
                  }}
                  className="text-yellow-600 hover:text-yellow-700 w-full"
                  aria-label="Clear all filters"
                >
                  Clear All
                </ProductButton>
              </div>
            )}

            <FilterSection
              title="Categories"
              options={categories}
              selectedValue={selectedCategory}
              filterType="category"
              showAll={showAllCategories}
              onToggleShowAll={() => setShowAllCategories(!showAllCategories)}
            />

            <FilterSection
              title="Colors"
              options={colors}
              selectedValue={selectedColor}
              filterType="color"
              showAll={showAllColors}
              onToggleShowAll={() => setShowAllColors(!showAllColors)}
            />

            <FilterSection
              title="Sizes"
              options={sizes}
              selectedValue={selectedSize}
              filterType="size"
              showAll={showAllSizes}
              onToggleShowAll={() => setShowAllSizes(!showAllSizes)}
            />

            {/* Price Range Filter */}
            <fieldset className="mb-3 border-2 border-yellow-200/60 rounded-xl p-3 bg-gradient-to-br from-white to-yellow-50/20 shadow-[0_2px_8px_rgba(234,179,8,0.1)]">
              <legend className="text-sm font-bold text-yellow-700 px-2">Price Range</legend>
              {priceRange.max > 0 ? (
                <div className="space-y-4 mt-2">
                  {/* Min Price Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-gray-700">Min Price</label>
                      <span className="text-xs font-semibold text-yellow-700">{formatPrice(Number(minPrice) || priceRange.min)}</span>
                    </div>
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      step={Math.max(1000, Math.floor((priceRange.max - priceRange.min) / 100))}
                      value={minPrice || priceRange.min}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value <= (Number(maxPrice) || priceRange.max)) {
                          handleFilterChange("minPrice", value);
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-600 transition-all duration-200"
                      style={{
                        background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((Number(minPrice) || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%, #e5e7eb ${((Number(minPrice) || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>

                  {/* Max Price Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-gray-700">Max Price</label>
                      <span className="text-xs font-semibold text-yellow-700">{formatPrice(Number(maxPrice) || priceRange.max)}</span>
                    </div>
                    <input
                      type="range"
                      min={priceRange.min}
                      max={priceRange.max}
                      step={Math.max(1000, Math.floor((priceRange.max - priceRange.min) / 100))}
                      value={maxPrice || priceRange.max}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= (Number(minPrice) || priceRange.min)) {
                          handleFilterChange("maxPrice", value);
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-600 transition-all duration-200"
                      style={{
                        background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((Number(maxPrice) || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%, #fbbf24 ${((Number(maxPrice) || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%, #fbbf24 100%)`
                      }}
                    />
                  </div>

                  {/* Price Range Display */}
                  <div className="text-xs text-gray-600 bg-yellow-50/50 p-2 rounded-lg border border-yellow-200/50 text-center">
                    <span className="font-semibold text-yellow-700">
                      {formatPrice(Number(minPrice) || priceRange.min)} - {formatPrice(Number(maxPrice) || priceRange.max)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2">Loading price range...</p>
              )}
            </fieldset>
          </div>
        </div>
      )}

      {/* Desktop Filter Sidebar */}
      <aside className="hidden md:block w-full md:w-56 lg:w-64 px-0 flex-shrink-0 mb-4 md:mb-0 pb-4 md:pb-0" role="complementary" aria-label="Product filters">
        <div className="bg-gradient-to-br from-white via-yellow-50/20 to-white rounded-2xl p-4 sm:p-5 md:p-5 shadow-[0_8px_30px_rgba(234,179,8,0.15)] border border-yellow-100/50 w-full sticky top-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-yellow-600 m-0">Filters</h1>
            {hasActiveFilters && (
              <ProductButton
                variant="secondary"
                size="sm"
                onClick={clearAllFilters}
                className="text-yellow-600 hover:text-yellow-700"
                aria-label="Clear all filters"
              >
                Clear All
              </ProductButton>
            )}
          </div>

          <FilterSection
            title="Categories"
            options={categories}
            selectedValue={selectedCategory}
            filterType="category"
            showAll={showAllCategories}
            onToggleShowAll={() => setShowAllCategories(!showAllCategories)}
          />

          <FilterSection
            title="Colors"
            options={colors}
            selectedValue={selectedColor}
            filterType="color"
            showAll={showAllColors}
            onToggleShowAll={() => setShowAllColors(!showAllColors)}
          />

          <FilterSection
            title="Sizes"
            options={sizes}
            selectedValue={selectedSize}
            filterType="size"
            showAll={showAllSizes}
            onToggleShowAll={() => setShowAllSizes(!showAllSizes)}
          />

          {/* Price Range Filter */}
          <fieldset className="mb-3 border-2 border-yellow-200/60 rounded-xl p-3 bg-gradient-to-br from-white to-yellow-50/20 shadow-[0_2px_8px_rgba(234,179,8,0.1)]">
            <legend className="text-sm font-bold text-yellow-700 px-2">Price Range</legend>
            {priceRange.max > 0 ? (
              <div className="space-y-4 mt-2">
                {/* Min Price Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-gray-700">Min Price</label>
                    <span className="text-xs font-semibold text-yellow-700">{formatPrice(Number(minPrice) || priceRange.min)}</span>
                  </div>
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step={Math.max(1000, Math.floor((priceRange.max - priceRange.min) / 100))}
                    value={minPrice || priceRange.min}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value <= (Number(maxPrice) || priceRange.max)) {
                        handleFilterChange("minPrice", value);
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-600 transition-all duration-200"
                    style={{
                      background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((Number(minPrice) || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%, #e5e7eb ${((Number(minPrice) || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>

                {/* Max Price Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-gray-700">Max Price</label>
                    <span className="text-xs font-semibold text-yellow-700">{formatPrice(Number(maxPrice) || priceRange.max)}</span>
                  </div>
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step={Math.max(1000, Math.floor((priceRange.max - priceRange.min) / 100))}
                    value={maxPrice || priceRange.max}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= (Number(minPrice) || priceRange.min)) {
                        handleFilterChange("maxPrice", value);
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-600 transition-all duration-200"
                    style={{
                      background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((Number(maxPrice) || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%, #fbbf24 ${((Number(maxPrice) || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min) * 100}%, #fbbf24 100%)`
                    }}
                  />
                </div>

                {/* Price Range Display */}
                <div className="text-xs text-gray-600 bg-yellow-50/50 p-2 rounded-lg border border-yellow-200/50 text-center">
                  <span className="font-semibold text-yellow-700">
                    {formatPrice(Number(minPrice) || priceRange.min)} - {formatPrice(Number(maxPrice) || priceRange.max)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2">Loading price range...</p>
            )}
          </fieldset>
        </div>
      </aside>

      <main className="flex-1 px-0 md:px-4 min-w-0" role="main">
        <section className="bg-gradient-to-br from-white via-yellow-50/20 to-white rounded-3xl p-5 sm:p-6 md:p-7 shadow-[0_8px_30px_rgba(234,179,8,0.15)] border border-yellow-100/50">
          <header className="mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-yellow-600 m-0">Product Listings</h1>
              <div className="flex items-center gap-3">
                <label htmlFor="sortBy" className="text-sm font-semibold text-gray-700">
                  Sort by:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="px-4 py-2.5 border-2 border-yellow-200/60 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-yellow-50/50 hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 bg-white text-gray-700 shadow-[0_2px_8px_rgba(234,179,8,0.1)]"
                  aria-label="Sort products"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="new">Newest First</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              Explore our range of products below. Select a product to view detailed information,
              pricing, and available variations.
            </p>
            {activeProducts.length > 0 && !loading && !isFiltering && (
              <p className="text-sm text-gray-600 mb-4 bg-yellow-50/50 px-4 py-2 rounded-lg border border-yellow-200/50 inline-block">
                Showing <span className="font-semibold text-yellow-700">{activeProducts.length}</span> product{activeProducts.length !== 1 ? "s" : ""}
                {hasActiveFilters && <span className="text-yellow-600"> matching your filters</span>}
              </p>
            )}
          </header>

          {error && (
            <div
              ref={errorRef}
              className="text-center text-sm sm:text-base text-red-700 bg-gradient-to-br from-red-50 via-red-50/80 to-orange-50 border-2 border-red-200 rounded-3xl p-5 sm:p-6 md:p-7 mb-4 sm:mb-5 w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 shadow-[0_8px_30px_rgba(239,68,68,0.2)]"
              role="alert"
              tabIndex={0}
              aria-live="polite"
            >
              <span className="text-2xl sm:text-3xl" aria-hidden="true">😊</span>
              <span className="font-medium">{error}</span>
              <ProductButton
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                disabled={loading}
                className="mt-2 sm:mt-0 rounded-full px-4 py-2 text-sm"
                aria-label="Retry loading products"
              >
                Try Again
              </ProductButton>
            </div>
          )}

          {/* Product Grid Section - Always visible */}
          {!loading && !isFiltering && activeProducts.length === 0 && !error && (
            <div className="text-center text-sm sm:text-base text-gray-600 bg-gradient-to-br from-gray-50 to-yellow-50/30 border-2 border-yellow-200/60 rounded-3xl p-8 sm:p-10 md:p-12 mb-4 sm:mb-5 w-full min-h-[200px] flex flex-col items-center justify-center gap-5 shadow-[0_4px_15px_rgba(234,179,8,0.1)]" role="status">
              <span className="text-4xl sm:text-5xl" aria-hidden="true">🔍</span>
              <p className="font-medium text-lg">No active products found for selected filters</p>
              {hasActiveFilters && (
                <ProductButton
                  variant="secondary"
                  size="md"
                  onClick={clearAllFilters}
                  className="text-yellow-600 hover:text-yellow-700 rounded-full"
                >
                  Clear Filters
                </ProductButton>
              )}
            </div>
          )}

          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
            role="grid"
            aria-label={(loading || isFiltering) ? "Loading products" : `${activeProducts.length} products`}
          >
            {(loading || isFiltering) ? (
              [...Array(8)].map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            ) : (
              activeProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  handleProductClick={handleProductClick}
                  handleKeyDown={handleKeyDown}
                />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProductList;