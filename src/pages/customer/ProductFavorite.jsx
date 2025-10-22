import React, { useState, useEffect, useCallback, useContext } from "react";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axiosClient from "../../common/axiosClient";

// Constants
// Use shared axiosClient

// Interceptors are set in axiosClient.js

// API functions
const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axiosClient({ url, ...options });
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
      const favoritesData = await fetchWithRetry("/favorites", {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!Array.isArray(favoritesData)) {
        setError("No favorite products found");
        setFavorites([]);
        return;
      }
      setFavorites(favoritesData);
    } catch (err) {
      setError(err.message || "Failed to fetch favorite products");
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
      await fetchWithRetry(`/favorites/${favoriteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setFavorites((prev) => prev.filter((fav) => fav._id !== favoriteId));
      showToast("Product removed from favorites!", "success", 3000);
    } catch (err) {
      const errorMessage = err.message || "Failed to remove from favorites";
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

  // Helpers
  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);

  // Focus error notification
  useEffect(() => {
    if (error) {
      const errorElement = document.querySelector(".product-list-error");
      errorElement?.focus();
    }
  }, [error]);

  return (
    <div className="product-list-container">
      {/* Toast Notification */}
      {/* ...global toast handled by ToastProvider... */}
      <main className="product-list-main-content" role="main">
        <header className="product-list-results-header">
          <h1>Your Favorite Products</h1>
          <p>
            Browse your favorite products below. Click a product to view details or remove it from your favorites.
          </p>
          {favorites.length > 0 && !loading && (
            <p className="product-list-results-count">
              Showing {favorites.length} favorite product{favorites.length !== 1 ? "s" : ""}
            </p>
          )}
        </header>

        {error && !favorites.length && (
          <div className="product-list-error" role="alert" tabIndex={0} aria-live="polite">
            <span className="product-list-error-icon" aria-hidden="true">⚠</span>
            {error}
            <button
              onClick={handleRetry}
              className="product-list-retry-button"
              aria-label="Retry loading favorites"
              disabled={loading}
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="product-list-loading" role="status" aria-live="polite">
            <div className="product-list-loading-spinner" aria-hidden="true"></div>
            Loading favorite products...
          </div>
        )}

        {!loading && favorites.length === 0 && !error && (
          <div className="product-list-no-products" role="status">
            <p>No favorite products found.</p>
            <button
              onClick={() => navigate("/products")}
              className="product-list-clear-filters-button"
            >
              Browse Products
            </button>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <div
            className="product-list-product-grid"
            role="grid"
            aria-label={`${favorites.length} favorite products`}
          >
            {favorites.map((favorite) => (
              <article
                key={favorite._id}
                className="product-list-product-card"
                role="gridcell"
                aria-label={`View ${favorite.pro_id?.pro_name || "product"} details`}
                style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
              >
                <div
                  className="product-list-image-container"
                  onClick={() => handleProductClick(favorite.pro_id?._id)}
                  onKeyDown={(e) => handleKeyDown(e, favorite.pro_id?._id)}
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={favorite.pro_id?.imageURL || "/placeholder-image.png"}
                    alt={favorite.pro_id?.pro_name || "Product image"}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "/placeholder-image.png";
                      e.target.alt = `Image not available for ${favorite.pro_id?.pro_name || "product"}`;
                    }}
                  />
                </div>
                <div className="product-list-content">
                  <h2 title={favorite.pro_id?.pro_name}>{favorite.pro_id?.pro_name || "Unnamed Product"}</h2>
                  <p
                    className="product-list-price"
                    aria-label={`Price: ${formatPrice(favorite.pro_id?.pro_price)}`}
                  >
                    {formatPrice(favorite.pro_id?.pro_price)}
                  </p>
                </div>
                <button
                  className="product-list-clear-filters-button"
                  style={{ background: "#fff", borderColor: "#b12704", color: "#b12704" }}
                  onClick={() => handleDeleteFavorite(favorite._id)}
                  aria-label={`Remove ${favorite.pro_id?.pro_name || "product"} from favorites`}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductFavorite;