import { useState, useEffect, useCallback, useContext, useRef, useMemo } from "react";
import { useToast } from "../../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import Api from "../../../common/SummaryAPI";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY,
} from "../../../constants/constants";

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

export const useFavorites = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [favoriteToDelete, setFavoriteToDelete] = useState(null);
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

  // Show confirmation modal for removing favorite
  const handleDeleteFavoriteClick = useCallback((favoriteId) => {
    const favorite = favorites.find((fav) => fav._id === favoriteId);
    setFavoriteToDelete({ favoriteId, favorite });
    setShowDeleteConfirm(true);
  }, [favorites]);

  // Remove from favorites (after confirmation)
  const handleDeleteFavorite = useCallback(async () => {
    if (!user || !favoriteToDelete) {
      setShowDeleteConfirm(false);
      setFavoriteToDelete(null);
      if (!user) {
        navigate("/login");
      }
      return;
    }

    const { favoriteId } = favoriteToDelete;
    setShowDeleteConfirm(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Authentication token missing", "error", 3000);
        navigate("/login");
        setFavoriteToDelete(null);
        return;
      }
      await fetchWithRetry(() => Api.favorites.remove(favoriteId, token));
      setFavorites((prev) => prev.filter((fav) => fav._id !== favoriteId));
      showToast("Product removed from favorites successfully", "success", 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to remove from favorites";
      setError(errorMessage);
      showToast(errorMessage, "error", 3000);
    } finally {
      setFavoriteToDelete(null);
    }
  }, [user, navigate, showToast, favoriteToDelete]);

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

  // Filter favorites based on search query
  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) {
      return favorites;
    }

    const query = searchQuery.toLowerCase().trim();
    return favorites.filter((favorite) => {
      if (!favorite.productId) return false;
      // Search by product name
      const productName = favorite.productId?.productName?.toLowerCase() || "";
      return productName.includes(query);
    });
  }, [favorites, searchQuery]);

  return {
    user,
    favorites,
    filteredFavorites,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    showDeleteConfirm,
    setShowDeleteConfirm,
    favoriteToDelete,
    setFavoriteToDelete,
    fetchFavorites,
    handleDeleteFavoriteClick,
    handleDeleteFavorite,
    handleProductClick,
    handleKeyDown,
    handleRetry
  };
};
