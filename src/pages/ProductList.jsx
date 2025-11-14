import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

// Helper function to get main image URL
const getMainImageUrl = (product) => {
  if (!product.productImageIds || product.productImageIds.length === 0) {
    return "/placeholder-image.png";
  }
  const mainImage = product.productImageIds.find(img => img.isMain);
  return mainImage?.imageUrl || product.productImageIds[0]?.imageUrl || "/placeholder-image.png";
};

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

  const navigate = useNavigate();

  // Debounced filters
  const debouncedCategory = useDebounce(selectedCategory, SEARCH_DEBOUNCE_DELAY);
  const debouncedColor = useDebounce(selectedColor, SEARCH_DEBOUNCE_DELAY);
  const debouncedSize = useDebounce(selectedSize, SEARCH_DEBOUNCE_DELAY);

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

  // Sync filters with URL and localStorage - only when debounced values change
  const prevFiltersRef = useRef(null);
  useEffect(() => {
    const currentFilters = {
      category: debouncedCategory,
      color: debouncedColor,
      size: debouncedSize,
    };
    
    // Only update if filters actually changed (skip initial render if no change)
    if (prevFiltersRef.current === null) {
      prevFiltersRef.current = currentFilters;
      return; // Skip on initial mount
    }
    
    const hasChanged = 
      prevFiltersRef.current.category !== currentFilters.category ||
      prevFiltersRef.current.color !== currentFilters.color ||
      prevFiltersRef.current.size !== currentFilters.size;
    
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
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  }, [debouncedCategory, debouncedColor, debouncedSize, setStoredFilters, navigate]);

  // Focus error notification
  const errorRef = useRef(null);
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  // Note: variantIndex removed as it's not used in current filtering logic
  // Variants are accessed directly from product.productVariantIds in filterProducts

  // Optimized product filtering
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

    return active.sort((a, b) => (a.productName || "").localeCompare(b.productName || ""));
  }, [products, debouncedCategory, debouncedColor, debouncedSize, variants.length]);

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
      default:
        console.warn(`Unknown filter type: ${filterType}`);
    }
  }, []);

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
  }, []);

  // Helpers
  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);

  // Filter section component
  const FilterSection = ({ title, options, selectedValue, filterType }) => (
    <fieldset className="mb-4 border-2 border-gray-300 rounded-xl p-3">
      <legend className="text-md font-semibold">{title}</legend>
      {["All", ...options].map((option) => {
        const value = option === "All" ? `All ${title}` : option;
        return (
          <label key={value} className="flex items-center my-1.5 text-sm cursor-pointer">
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

  const hasActiveFilters =
    selectedCategory !== DEFAULT_FILTERS.category ||
    selectedColor !== DEFAULT_FILTERS.color ||
    selectedSize !== DEFAULT_FILTERS.size;

  // Update filtering state
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), SEARCH_DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [debouncedCategory, debouncedColor, debouncedSize]);

  return (
    <div className="flex flex-col md:flex-row w-full mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <aside className="w-full md:w-60 lg:w-64 px-0 flex-shrink-0 mb-4 md:mb-0 pb-4 md:pb-0" role="complementary" aria-label="Product filters">
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 w-full">
          <div className="flex justify-between items-center mb-4 h-8">
            <h1 className="text-2xl m-0">Filters</h1>
            {hasActiveFilters && (
              <ProductButton
                variant="default"
                size="sm"
                onClick={clearAllFilters}
                className="text-blue-600"
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
          />

          <FilterSection
            title="Colors"
            options={colors}
            selectedValue={selectedColor}
            filterType="color"
          />

          <FilterSection
            title="Sizes"
            options={sizes}
            selectedValue={selectedSize}
            filterType="size"
          />
        </div>
      </aside>

      <main className="flex-1 px-0 md:px-4 min-w-0" role="main">
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <header className="mb-4">
            <h1 className="text-xl sm:text-2xl font-normal mb-2 m-0">Product Listings</h1>
            <p className="text-sm text-gray-600 mb-4">
              Explore our range of products below. Select a product to view detailed information,
              pricing, and available variations.
            </p>
            {activeProducts.length > 0 && !loading && !isFiltering && (
              <p className="text-sm text-gray-600 mb-4">
                Showing {activeProducts.length} product{activeProducts.length !== 1 ? "s" : ""}
                {hasActiveFilters && " matching your filters"}
              </p>
            )}
          </header>

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
              <ProductButton
                variant="default"
                size="sm"
                onClick={handleRetry}
                disabled={loading}
                className="text-blue-600"
                aria-label="Retry loading products"
              >
                Retry
              </ProductButton>
            </div>
          )}

          {/* Product Grid Section - Always visible */}
          {!loading && !isFiltering && activeProducts.length === 0 && !error && (
            <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center gap-4" role="status">
              <p>No active products found for selected filters</p>
              {hasActiveFilters && (
                <ProductButton
                  variant="default"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-blue-600"
                >
                  Clear Filters
                </ProductButton>
              )}
            </div>
          )}

          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 justify-between"
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