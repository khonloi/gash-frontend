import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Api from "../../common/SummaryAPI";
import FavoriteProductCard from "../../components/FavoriteProductCard";
import ProductCardSkeleton from "../../components/ProductCardSkeleton";
import ProductButton from "../../components/ProductButton";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY,
} from "../../constants/constants";

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


const ProductFavorite = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Data fetching
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setError("Please log in to view your favorites");
      setFavorites([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token missing");
        setFavorites([]);
        return;
      }
      const response = await fetchWithRetry(() => Api.favorites.fetch(token));
      const favoritesData = response?.favorites || response?.data || response || [];
      
      if (!Array.isArray(favoritesData)) {
        setError("No favorite products found");
        setFavorites([]);
        return;
      }
      setFavorites(favoritesData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch favorite products");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Remove from favorites
  const handleDeleteFavorite = useCallback(async (favoriteId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Authentication token missing", "error", 3000);
        navigate("/login");
        return;
      }
      await fetchWithRetry(() => Api.favorites.remove(favoriteId, token));
      setFavorites((prev) => prev.filter((fav) => fav._id !== favoriteId));
      showToast("Product removed from favorites!", "success", 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to remove from favorites";
      setError(errorMessage);
      showToast(errorMessage, "error", 3000);
    }
  }, [user, navigate, showToast]);

  // Navigation
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
    fetchFavorites();
  }, [fetchFavorites]);

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
          <h1 className="text-xl sm:text-2xl font-normal mb-2 m-0">Your Favorite Products</h1>
          <p className="text-sm text-gray-600 mb-4">
            Browse your favorite products below. Click a product to view details or remove it from your favorites.
          </p>
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
              aria-label="Retry loading favorites"
            >
              Retry
            </ProductButton>
          </div>
        )}

        {/* Product Grid Section - Always visible */}
        {!loading && favorites.length === 0 && !error && (
          <div className="text-center text-xs sm:text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full min-h-[100px] flex flex-col items-center justify-center gap-4" role="status">
            <p>No favorite products found.</p>
            <ProductButton
              variant="default"
              size="sm"
              onClick={() => navigate("/products")}
              className="text-blue-600"
            >
              Browse Products
            </ProductButton>
          </div>
        )}

        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-between"
          role="grid"
          aria-label={loading ? "Loading favorites" : `${favorites.length} favorite products`}
        >
          {loading ? (
            [...Array(8)].map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          ) : (
            favorites.map((favorite) => {
              if (!favorite.pro_id) {
                return null; // Skip rendering if pro_id is missing
              }
              const product = favorite.pro_id;
              return (
                <FavoriteProductCard
                  key={favorite._id}
                  product={product}
                  favoriteId={favorite._id}
                  handleProductClick={handleProductClick}
                  handleKeyDown={handleKeyDown}
                  handleRemove={handleDeleteFavorite}
                />
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductFavorite;