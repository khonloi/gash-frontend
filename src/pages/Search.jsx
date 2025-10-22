import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY,
} from "../constants/constants";

// API functions
const fetchWithRetry = async (apiCall, retries = API_RETRY_COUNT, delay = API_RETRY_DELAY) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await apiCall();
      console.log("Search API response:", response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error("Fetch retry error:", error.message); // Debug log
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

const Search = () => {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(search).get("q") || state?.searchQuery || "";

  // Use state?.searchResults only if it matches the current query
  const initialProducts = (state?.searchQuery && state?.searchQuery === query && Array.isArray(state?.searchResults)) ? state.searchResults : [];
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSearchResults = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setProducts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithRetry(() => Api.newProducts.search({ name: searchQuery.trim(), status: "active" }));
      const productsData = response?.data || response || [];

      if (!Array.isArray(productsData)) {
        setError("No products available for this search");
        setProducts([]);
        return;
      }

      // Filter products with variants
      const filteredProducts = productsData.filter(
        (product) => product.productVariantIds?.length > 0
      );

      console.log("Filtered search results:", filteredProducts); // Debug log
      setProducts(filteredProducts);
    } catch (err) {
      console.error("Search fetch error:", err.response?.data || err.message); // Debug log
      setError(err.response?.data?.message || err.message || "Failed to fetch search results");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Always fetch new results when query changes
  useEffect(() => {
    if (query) {
      console.log("Fetching search results for query:", query); // Debug log
      fetchSearchResults(query);
    } else {
      setProducts([]);
    }
  }, [query, fetchSearchResults]);

  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);

  const handleProductClick = useCallback((id) => {
    console.log("Navigating to product with ID:", id); // Debug log
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
      setError("Invalid product ID");
      return;
    }
    navigate(`/product/${id}`);
  }, [navigate, setError]);

  const handleKeyDown = useCallback((e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleProductClick(id);
    }
  }, [handleProductClick]);

  useEffect(() => {
    if (error) {
      const errorElement = document.querySelector(".product-list-error");
      errorElement?.focus();
    }
  }, [error]);

  return (
    <div className="product-list-container">
      <main className="product-list-main-content" role="main">
        <header className="product-list-results-header">
          <h1>{query ? `Search Results for "${query}"` : "Products"}</h1>
          {!loading && !error && products.length > 0 && (
            <p className="product-list-results-count">
              Showing {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </header>
        {loading && (
          <div className="product-list-loading" role="status" aria-live="polite">
            <div className="product-list-loading-spinner" aria-hidden="true"></div>
            Loading products...
          </div>
        )}
        {error && (
          <div className="product-list-error" role="alert" tabIndex={0} aria-live="polite">
            <span className="product-list-error-icon" aria-hidden="true">⚠</span>
            {error}
          </div>
        )}
        {!loading && !error && products.length === 0 && query && (
          <div className="product-list-no-products" role="status">
            <p>No products found for "{query}"</p>
          </div>
        )}
        {!loading && !error && products.length > 0 && (
          <div className="product-list-product-grid" role="grid" aria-label={`${products.length} products`}>
            {products.map((product) => {
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
      </main>
    </div>
  );
};

export default Search;