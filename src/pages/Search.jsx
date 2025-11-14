import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import ProductButton from "../components/ProductButton";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY,
} from "../constants/constants";

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
      
      setProducts(filteredProducts);
    } catch (err) {
      console.error("Search fetch error:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch search results");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Always fetch new results when query changes
  useEffect(() => {
    if (query) {
      fetchSearchResults(query);
    } else {
      setProducts([]);
    }
  }, [query, fetchSearchResults]);

  const handleProductClick = useCallback((id) => {
    if (!id) {
      setError("Invalid product selected");
      return;
    }
    navigate(`/product/${id}`);
  }, [navigate]);

  const handleKeyDown = useCallback((e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleProductClick(id);
    }
  }, [handleProductClick]);

  const handleRetry = useCallback(() => {
    if (query) {
      fetchSearchResults(query);
    }
  }, [query, fetchSearchResults]);

  // Focus error notification
  const errorRef = useRef(null);
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-sm border border-gray-200">
        <header className="mb-4">
          <h1 className="text-xl sm:text-2xl font-normal mb-2 m-0">
            {query ? `Search Results for "${query}"` : "Search Products"}
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            {query 
              ? `Searching for products matching "${query}"`
              : "Enter a search query to find products"}
          </p>
          {!loading && !error && products.length > 0 && (
            <p className="text-sm text-gray-600 mb-4">
              Showing {products.length} product{products.length !== 1 ? "s" : ""}
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
            {query && (
              <ProductButton
                variant="default"
                size="sm"
                onClick={handleRetry}
                disabled={loading}
                className="text-blue-600"
                aria-label="Retry search"
              >
                Retry
              </ProductButton>
            )}
          </div>
        )}

        {/* Product Grid Section */}
        {!loading && products.length === 0 && !error && query && (
          <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center gap-4" role="status">
            <p>No products found for "{query}"</p>
          </div>
        )}

        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-between"
          role="grid"
          aria-label={loading ? "Loading search results" : `${products.length} products`}
        >
          {loading ? (
            [...Array(8)].map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          ) : (
            products.map((product) => (
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
    </div>
  );
};

export default Search;
