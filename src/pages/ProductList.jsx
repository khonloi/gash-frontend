import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Api from "../common/SummaryAPI";
import "../styles/ProductList.css";
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
  const [showUnavailable, setShowUnavailable] = useState(false);

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
  const debouncedFilters = useDebounce(
    { category: selectedCategory, color: selectedColor, size: selectedSize },
    SEARCH_DEBOUNCE_DELAY
  );

  // Data fetching
  const fetchProducts = useCallback(async () => {
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
      const uniqueCategories = [
        ...new Set(productsData.map((product) => product.categoryId?.cat_name).filter(Boolean)),
      ].sort();
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVariants = useCallback(async () => {
    try {
      const response = await fetchWithRetry(() => Api.newVariants.getAll());
      const variantsData = response?.data || response || [];
      
      if (!Array.isArray(variantsData)) {
        console.warn("Invalid variants data received");
        setError("Failed to load product variants");
        return;
      }
      
      setVariants(variantsData);
      const uniqueColors = [
        ...new Set(variantsData.map((variant) => variant.productColorId?.color_name).filter(Boolean)),
      ].sort();
      const uniqueSizes = [
        ...new Set(variantsData.map((variant) => variant.productSizeId?.size_name).filter(Boolean)),
      ].sort();
      setColors(uniqueColors);
      setSizes(uniqueSizes);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch variants");
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
    fetchVariants();
  }, [fetchProducts, fetchVariants]);

  // Sync filters/with URL and localStorage
  useEffect(() => {
    const currentFilters = {
      category: debouncedFilters.category,
      color: debouncedFilters.color,
      size: debouncedFilters.size,
    };
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
  }, [debouncedFilters, setStoredFilters, navigate]);

  // Focus error notification
  useEffect(() => {
    if (error) {
      const errorElement = document.querySelector(".product-list-error");
      errorElement?.focus();
    }
  }, [error]);

  // Pre-index variants for efficient filtering
  const variantIndex = useMemo(() => {
    const index = {};
    variants.forEach((variant) => {
      if (variant.productId?._id) {
        index[variant.productId._id] = index[variant.productId._id] || [];
        index[variant.productId._id].push(variant);
      } else if (variant.productId && typeof variant.productId === 'string') {
        index[variant.productId] = index[variant.productId] || [];
        index[variant.productId].push(variant);
      }
    });
    return index;
  }, [variants]);

  // Optimized product filtering
  const { activeProducts, unavailableProducts } = useMemo(() => {
    if (!products.length) return { activeProducts: [], unavailableProducts: [] };

    let active = [];
    let unavailable = [];

    products.forEach((product) => {
      if (product.productStatus === "active" && product.productVariantIds?.length > 0) {
        active.push(product);
      } else if (["inactive", "discontinued"].includes(product.productStatus) && product.productVariantIds?.length > 0) {
        unavailable.push(product);
      }
    });

    const filterProducts = (productList) => {
      let filtered = [...productList];

      if (debouncedCategory !== "All Categories") {
        filtered = filtered.filter((product) => product.categoryId?.cat_name === debouncedCategory);
      }

      if ((debouncedColor !== "All Colors" || debouncedSize !== "All Sizes") && variants.length) {
        filtered = filtered.filter((product) => {
          const productVariants = product.productVariantIds || [];
          return productVariants.some((variant) => {
            const matchesColor =
              debouncedColor === "All Colors" || variant.productColorId?.color_name === debouncedColor;
            const matchesSize =
              debouncedSize === "All Sizes" || variant.productSizeId?.size_name === debouncedSize;
            return matchesColor && matchesSize;
          });
        });
      }

      return filtered.sort((a, b) => (a.productName || "").localeCompare(b.productName || ""));
    };

    return {
      activeProducts: filterProducts(active),
      unavailableProducts: filterProducts(unavailable),
    };
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
    <fieldset className="product-list-filter-group">
      <legend>{title}</legend>
      {["All", ...options].map((option) => {
        const value = option === "All" ? `All ${title}` : option;
        return (
          <label key={value}>
            <input
              type="radio"
              name={filterType}
              value={value}
              checked={selectedValue === value}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
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
    <div className="product-list-container">
      <aside className="product-list-sidebar" role="complementary" aria-label="Product filters">
        <div className="product-list-filter-header">
          <h1>Filters</h1>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="product-list-clear-filters"
              aria-label="Clear all filters"
            >
              Clear All
            </button>
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
      </aside>

      <main className="product-list-main-content" role="main">
        <header className="product-list-results-header">
          <h1>Product Listings</h1>
          <p>
            Explore our range of products below. Select a product to view detailed information,
            pricing, and available variations.
          </p>
          {activeProducts.length > 0 && !loading && !isFiltering && (
            <p className="product-list-results-count">
              Showing {activeProducts.length} product{activeProducts.length !== 1 ? "s" : ""}
              {hasActiveFilters && " matching your filters"}
            </p>
          )}
        </header>

        {error && (
          <div className="product-list-error" role="alert" tabIndex={0} aria-live="polite">
            <span className="product-list-error-icon" aria-hidden="true">⚠</span>
            {error}
            <button
              onClick={handleRetry}
              className="product-list-retry-button"
              disabled={loading}
              aria-label="Retry loading products"
            >
              Retry
            </button>
          </div>
        )}

        {(loading || isFiltering) && (
          <div className="product-list-loading" role="status" aria-live="polite">
            <div className="product-list-loading-spinner" aria-hidden="true"></div>
            {loading ? "Loading products..." : "Applying filters..."}
          </div>
        )}

        {!loading && !isFiltering && activeProducts.length === 0 && !error && (
          <div className="product-list-no-products" role="status">
            <p>No active products found for selected filters</p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="product-list-clear-filters-button">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {!loading && !isFiltering && activeProducts.length > 0 && (
          <div
            className="product-list-product-grid"
            role="grid"
            aria-label={`${activeProducts.length} products`}
          >
            {activeProducts.map((product) => {
              const minPrice = getMinPrice(product);
              const imageUrl = getMainImageUrl(product);
              return (
                <article
                  key={product._id}
                  className="product-list-product-card"
                  onClick={() => handleProductClick(product._id)}
                  onKeyDown={(e) => handleKeyDown(e, product._id)}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={`View ${product.productName || "product"} details`}
                >
                  <div className="product-list-image-container">
                    <img
                      src={imageUrl}
                      alt={product.productName || "Product image"}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/placeholder-image.png";
                        e.target.alt = `Image not available for ${product.productName || "product"}`;
                      }}
                    />
                  </div>

                  <div className="product-list-content">
                    <h2 title={product.productName}>{product.productName || "Unnamed Product"}</h2>
                    <p
                      className="product-list-price"
                      aria-label={`Price: ${formatPrice(minPrice)}`}
                    >
                      {formatPrice(minPrice)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !isFiltering && unavailableProducts.length > 0 && (
          <div className="product-list-unavailable-section">
            <button
              onClick={() => setShowUnavailable(!showUnavailable)}
              className="product-list-unavailable-toggle"
              aria-expanded={showUnavailable}
              aria-controls="unavailable-products"
            >
              {showUnavailable ? "Hide Unavailable Products" : "View All Unavailable Products"}
            </button>

            {showUnavailable && (
              <>
                <header className="product-list-results-header">
                  <h1>Unavailable Products</h1>
                  <p>These products are currently inactive or discontinued.</p>
                  <p className="product-list-results-count">
                    Showing {unavailableProducts.length} product{unavailableProducts.length !== 1 ? "s" : ""}
                    {hasActiveFilters && " matching your filters"}
                  </p>
                </header>

                <div
                  className="product-list-product-grid product-list-unavailable-grid"
                  role="grid"
                  aria-label={`${unavailableProducts.length} unavailable products`}
                >
                  {unavailableProducts.map((product) => {
                    const minPrice = getMinPrice(product);
                    const imageUrl = getMainImageUrl(product);
                    const status = product.productStatus;
                    return (
                      <article
                        key={product._id}
                        className={`product-list-product-card product-list-unavailable-card product-list-${status}`}
                        onClick={() => handleProductClick(product._id)}
                        onKeyDown={(e) => handleKeyDown(e, product._id)}
                        role="gridcell"
                        tabIndex={0}
                        aria-label={`View ${product.productName || "product"} details (unavailable)`}
                      >
                        <div className="product-list-image-container">
                          <img
                            src={imageUrl}
                            alt={product.productName || "Product image"}
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = "/placeholder-image.png";
                              e.target.alt = `Image not available for ${product.productName || "product"}`;
                            }}
                          />
                          <div className={`product-list-status-overlay product-list-${status}-overlay`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                        </div>

                        <div className="product-list-content product-list-unavailable-content">
                          <h2 title={product.productName}>{product.productName || "Unnamed Product"}</h2>
                          <p
                            className="product-list-price"
                            aria-label={`Price: ${formatPrice(minPrice)}`}
                          >
                            {formatPrice(minPrice)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductList;