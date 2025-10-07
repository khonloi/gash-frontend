import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useToast } from "../components/Toast";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosClient from '../common/axiosClient';
import Api from '../common/SummaryAPI';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LoadingSpinner, { LoadingForm, LoadingSkeleton } from "../components/LoadingSpinner";
import "../styles/ProductDetail.css";
import {
  DETAIL_STORAGE_KEY,
  API_RETRY_COUNT,
  API_RETRY_DELAY,
  TOAST_TIMEOUT,
} from "../constants/constants";



const THUMBNAILS_PER_PAGE = 4;

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

  const setStoredValue = useCallback(
    (newValue) => {
      try {
        setValue(newValue);
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [value, setStoredValue];
};


axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      status === 401
        ? "Unauthorized access - please log in"
        : status === 404
          ? "Resource not found"
          : status >= 500
            ? "Server error - please try again later"
            : "Network error - please check your connection";
    return Promise.reject({ ...error, message, status });
  }
);

// Use centralized fetchWithRetry from Api.utils

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // State management
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const { showToast } = useToast();
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  // const [feedbackStats, setFeedbackStats] = useState(null); // Removed as not used in preview
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  // Removed feedbacksToShow as it's no longer needed in the preview
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Local storage
  const [, setStoredState] = useLocalStorage(DETAIL_STORAGE_KEY, {});

  // Pre-index variants
  const variantIndex = useMemo(() => {
    const index = { byColor: {}, bySize: {}, byColorSize: {} };
    variants.forEach((variant) => {
      const color = variant.color_id?.color_name;
      const size = variant.size_id?.size_name;
      if (color) {
        index.byColor[color] = index.byColor[color] || [];
        index.byColor[color].push(variant);
      }
      if (size) {
        index.bySize[size] = index.bySize[size] || [];
        index.bySize[size].push(variant);
      }
      if (color && size) {
        index.byColorSize[`${color}-${size}`] = variant;
      }
    });
    return index;
  }, [variants]);

  // Combine product.imageURL and additional images
  const allThumbnails = useMemo(() => {
    const thumbnails = [];
    if (product?.imageURL) {
      thumbnails.push({ _id: "default", imageURL: product.imageURL });
    }
    return [...thumbnails, ...images];
  }, [product?.imageURL, images]);

  // Data fetching
  const fetchProductAndVariants = useCallback(async () => {
    if (!id) {
      setError("Product ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [productResponse, variantsResponse] = await Promise.all([
        Api.products.getProduct(id),
        Api.products.getVariants(id),
      ]);

      let imagesResponse = [];
      try {
        imagesResponse = await Api.products.getImages(id);
      } catch {
        imagesResponse = [];
      }

      if (!productResponse) {
        throw new Error("Product not found");
      }

      setProduct(productResponse.data);
      setVariants(variantsResponse.data || []);
      setImages(imagesResponse.data || []);

      if (!Array.isArray(variantsResponse.data) || variantsResponse.data.length === 0) {
        setAvailableColors([]);
        setAvailableSizes([]);
        setSelectedVariant(null);
      } else {
        const uniqueColors = [
          ...new Set(
            variantsResponse.data.map((v) => v.color_id?.color_name).filter(Boolean)
          ),
        ].sort();
        const uniqueSizes = [
          ...new Set(
            variantsResponse.data.map((v) => v.size_id?.size_name).filter(Boolean)
          ),
        ].sort();
        setAvailableColors(uniqueColors);
        setAvailableSizes(uniqueSizes);

        // Reset local storage state for new product
        setSelectedColor(null);
        setSelectedSize(null);
        setQuantity(1);
        setSelectedVariant(null);
      }

      setSelectedImage(productResponse.data.imageURL || "/placeholder-image.png");
    } catch (err) {
      setError(err.message || "Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchFavorites = useCallback(async () => {
    if (!user || !localStorage.getItem("token")) {
      setIsFavorited(false);
      setFavoriteId(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const favorites = await Api.favorites.fetch(token);
      const favorite = favorites.data.find((f) => f.pro_id?._id === id);
      setIsFavorited(!!favorite);
      setFavoriteId(favorite?._id || null);
    } catch (err) {
      setError(err.message || "Failed to fetch favorites");
      setIsFavorited(false);
      setFavoriteId(null);
    }
  }, [id, user]);

  const fetchFeedbacks = useCallback(async (variantId = null, page = 1, limit = 10) => {
    setFeedbackLoading(true);
    setFeedbackError(null);

    try {
      let feedbackResponse;
      if (variantId) {
        // Fetch feedbacks for specific variant with pagination (limit to 10 for preview)
        feedbackResponse = await Api.feedback.getAllFeedback(variantId, page, limit);

        // Handle the exact API response structure
        if (feedbackResponse.data && feedbackResponse.data.feedbacks) {
          setFeedbacks(feedbackResponse.data.feedbacks);
          // setFeedbackStats(feedbackResponse.data.statistics || null); // Removed as not used
        } else if (feedbackResponse.data && Array.isArray(feedbackResponse.data)) {
          setFeedbacks(feedbackResponse.data);
          // setFeedbackStats(null); // Removed as not used
        } else {
          setFeedbacks([]);
          // setFeedbackStats(null); // Removed as not used
        }
      } else {
        // Fetch feedbacks for entire product
        feedbackResponse = await Api.products.getFeedbacks(id);
        setFeedbacks(Array.isArray(feedbackResponse.data) ? feedbackResponse.data : []);
        // setFeedbackStats(null); // Removed as not used
      }
    } catch (err) {
      console.error('Feedback fetch error:', err);
      if (err.status === 404) {
        setFeedbacks([]);
        // setFeedbackStats(null); // Removed as not used
      } else {
        setFeedbackError(err.message || "Failed to fetch feedback");
      }
    } finally {
      setFeedbackLoading(false);
    }
  }, [id]);

  // Initial fetch
  useEffect(() => {
    fetchProductAndVariants();
    fetchFeedbacks();
    fetchFavorites();
    // setFeedbacksToShow(5); // Removed as no longer needed
  }, [id, fetchFeedbacks, fetchFavorites, fetchProductAndVariants]);

  // Fetch feedbacks when variant is selected
  useEffect(() => {
    if (selectedVariant?._id) {
      fetchFeedbacks(selectedVariant._id);
    }
  }, [selectedVariant, fetchFeedbacks]);

  // Auto-select first variant if none selected (like in ProductFeedback.jsx)
  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  // Focus error
  useEffect(() => {
    if (error) {
      const errorElement = document.querySelector(".product-detail-error");
      errorElement?.focus();
    }
  }, [error]);

  // Stock status
  const isInStock = useMemo(
    () => product?.status_product === "active",
    [product]
  );

  // Quantity validation
  const handleQuantityChange = useCallback(
    (e) => {
      const value = e.target.value;
      const parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue) || parsedValue < 1) {
        setQuantity(1);
        setError("Quantity must be at least 1");
      } else {
        const maxQuantity = selectedVariant?.quantity
          ? Math.min(selectedVariant.quantity, 99)
          : 99;
        if (parsedValue > maxQuantity) {
          setQuantity(maxQuantity);
          setError(`Quantity cannot exceed ${maxQuantity}`);
        } else {
          setQuantity(parsedValue);
          setError(null);
        }
      }
      setStoredState((prev) => ({
        ...prev,
        [id]: { ...prev[id], quantity: parsedValue },
      }));
    },
    [id, selectedVariant, setStoredState]
  );

  // Event handlers
  const handleColorClick = useCallback(
    (color) => {
      if (!color) return;
      setSelectedColor(color);
      setSelectedSize(null);
      setSelectedVariant(null);
      setStoredState((prev) => ({
        ...prev,
        [id]: { ...prev[id], selectedColor: color, selectedSize: null },
      }));
    },
    [id, setStoredState]
  );

  const handleSizeClick = useCallback(
    (size) => {
      if (!size) return;
      setSelectedSize(size);

      const variant = selectedColor
        ? variantIndex.byColorSize[`${selectedColor}-${size}`] || null
        : variantIndex.bySize[size]?.[0] || null;
      setSelectedVariant(variant);

      setStoredState((prev) => ({
        ...prev,
        [id]: { ...prev[id], selectedSize: size },
      }));
    },
    [selectedColor, id, setStoredState, variantIndex]
  );

  const handleImageClick = useCallback(
    (imageURL) => {
      if (selectedImage === imageURL) {
        setSelectedImage(product?.imageURL || "/placeholder-image.png");
      } else {
        setSelectedImage(imageURL);
      }
    },
    [selectedImage, product?.imageURL]
  );

  const handleOpenLightbox = useCallback(() => {
    const allImages = allThumbnails.map((thumb) => thumb.imageURL);
    const index = allImages.indexOf(selectedImage);
    setLightboxIndex(index !== -1 ? index : 0);
    setIsLightboxOpen(true);
    setZoomLevel(1);
  }, [selectedImage, allThumbnails]);

  const handleCloseLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    setZoomLevel(1);
  }, []);

  const handlePrevImage = useCallback(() => {
    setLightboxIndex((prev) => {
      const newIndex = prev === 0 ? allThumbnails.length - 1 : prev - 1;
      setZoomLevel(1);
      return newIndex;
    });
  }, [allThumbnails]);

  const handleNextImage = useCallback(() => {
    setLightboxIndex((prev) => {
      const newIndex = prev === allThumbnails.length - 1 ? 0 : prev + 1;
      setZoomLevel(1);
      return newIndex;
    });
  }, [allThumbnails]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  }, []);

  const handlePrevThumbnail = useCallback(() => {
    setThumbnailIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextThumbnail = useCallback(() => {
    const totalThumbnails = allThumbnails.length;
    setThumbnailIndex((prev) =>
      Math.min(prev + 1, totalThumbnails - THUMBNAILS_PER_PAGE)
    );
  }, [allThumbnails]);

  const handleRetry = useCallback(() => {
    fetchProductAndVariants();
    fetchFeedbacks();
    fetchFavorites();
  }, [fetchProductAndVariants, fetchFeedbacks, fetchFavorites]);

  const handleAddToFavorites = useCallback(async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setIsAddingToFavorites(true);

    try {
      const token = localStorage.getItem("token");
      if (isFavorited) {
        await Api.favorites.remove(favoriteId, token);
        setIsFavorited(false);
        setFavoriteId(null);
        showToast("Product removed from favorites successfully!", "success", TOAST_TIMEOUT);
      } else {
        const favoriteItem = {
          acc_id: user._id,
          pro_id: id,
        };
        const response = await Api.favorites.add(favoriteItem, token);
        setIsFavorited(true);
        setFavoriteId(response.data.favorite._id);
        showToast("Product added to favorites successfully!", "success", TOAST_TIMEOUT);
      }
    } catch (err) {
      const message = err.message || isFavorited
        ? "Failed to remove from favorites"
        : "Failed to add to favorites";
      setError(message);
      showToast(message, "error", TOAST_TIMEOUT);
    } finally {
      setIsAddingToFavorites(false);
    }
  }, [user, id, navigate, isFavorited, favoriteId, showToast]);

  const handleAddToCart = useCallback(async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      setError("Please select a valid color and size combination");
      return;
    }

    if (!isInStock) {
      setError("Product is out of stock");
      return;
    }

    if (selectedVariant.quantity && quantity > selectedVariant.quantity) {
      setError(`Only ${selectedVariant.quantity} items available in stock`);
      return;
    }

    setIsAddingToCart(true);

    try {
      const cartItem = {
        acc_id: user._id,
        variant_id: selectedVariant._id,
        pro_quantity: quantity,
        pro_price: product.pro_price,
      };

      const token = localStorage.getItem("token");
      await Api.cart.addItem(cartItem, token);

      showToast(`${quantity} item${quantity > 1 ? "s" : ""} added to cart successfully!`, "success", TOAST_TIMEOUT);
    } catch (err) {
      const message = err.message || "Failed to add item to cart";
      setError(message);
      showToast(message, "error", TOAST_TIMEOUT);
    } finally {
      setIsAddingToCart(false);
    }
  }, [user, selectedVariant, product, navigate, isInStock, quantity, showToast]);

  const handleBuyNow = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      setError("Please select a valid color and size combination");
      return;
    }

    if (!isInStock) {
      setError("Product is out of stock");
      return;
    }

    if (selectedVariant.quantity && quantity > selectedVariant.quantity) {
      setError(`Only ${selectedVariant.quantity} items available in stock`);
      return;
    }

    navigate("/checkout", {
      state: {
        product,
        variant: selectedVariant,
        quantity,
      },
    });
  }, [user, selectedVariant, isInStock, navigate, quantity, product]);

  // Get visible thumbnails
  const visibleThumbnails = useMemo(() => {
    return allThumbnails.slice(
      thumbnailIndex,
      thumbnailIndex + THUMBNAILS_PER_PAGE
    );
  }, [allThumbnails, thumbnailIndex]);

  // Helpers
  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);

  const formatDate = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Unknown Date";
    }
  }, []);

  // Check if a color-size combination is valid
  const isValidCombination = useCallback(
    (color, size) => {
      return !!variantIndex.byColorSize[`${color}-${size}`];
    },
    [variantIndex]
  );

  // Render
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner
          size="xl"
          color="blue"
          text="Loading product details..."
          fullScreen={false}
        />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="product-detail-container">
        <div className="product-list-error" role="alert" tabIndex={0} aria-live="polite">
          <span className="product-list-error-icon" aria-hidden="true">⚠</span>
          {error}
          <button
            className="product-list-retry-button"
            onClick={handleRetry}
            disabled={loading}
            type="button"
            aria-label="Retry loading product"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="product-detail-container">
      {error && (
        <div className="product-detail-error" role="alert" tabIndex={0}>
          <span className="product-detail-error-icon" aria-hidden="true">
            ⚠
          </span>
          {error}
        </div>
      )}

      <div className="product-detail-main">
        <div className="product-detail-image-section">
          <div className="product-detail-thumbnails-container">
            <button
              className="product-detail-thumbnail-arrow product-detail-thumbnail-arrow-up"
              onClick={handlePrevThumbnail}
              disabled={thumbnailIndex === 0}
              aria-label="Previous thumbnails"
            >
              <i className="lni lni-chevron-up"></i>
            </button>
            <div className="product-detail-thumbnails">
              {visibleThumbnails.map((image, index) => (
                <div
                  key={image._id || index}
                  className={`product-detail-thumbnail ${selectedImage === image.imageURL ? "selected" : ""
                    }`}
                  onClick={() => handleImageClick(image.imageURL)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${image._id === "default"
                    ? "default"
                    : `thumbnail ${thumbnailIndex + index + 1}`
                    } for ${product.pro_name || "Product"}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleImageClick(image.imageURL);
                      e.preventDefault();
                    }
                  }}
                >
                  <img
                    src={image.imageURL}
                    alt={`${product.pro_name || "Product"} ${image._id === "default"
                      ? "default"
                      : `thumbnail ${thumbnailIndex + index + 1}`
                      }`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <button
              className="product-detail-thumbnail-arrow product-detail-thumbnail-arrow-down"
              onClick={handleNextThumbnail}
              disabled={
                thumbnailIndex >= allThumbnails.length - THUMBNAILS_PER_PAGE
              }
              aria-label="Next thumbnails"
            >
              <i className="lni lni-chevron-down"></i>
            </button>
          </div>
          <div className="product-detail-image">
            <img
              src={selectedImage || "/placeholder-image.png"}
              alt={`${product.pro_name || "Product"}`}
              onClick={handleOpenLightbox}
              onError={(e) => {
                e.target.src = "/placeholder-image.png";
                e.target.alt = `Not available for ${product.pro_name || "product"
                  }`;
              }}
              loading="lazy"
              role="button"
              tabIndex={0}
              aria-label={`Open lightbox for ${product.pro_name || "Product"} image`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleOpenLightbox();
                  e.preventDefault();
                }
              }}
            />
          </div>
        </div>

        <div className="product-detail-info">
          <h1>{product.pro_name || "Unnamed Product"}</h1>
          <div className="product-detail-price">
            {formatPrice(product.pro_price)}
          </div>
          <div className="product-detail-stock-status">
            <span
              className={`product-detail-stock ${isInStock ? "in-stock" : "out-of-stock"
                }`}
            >
              {isInStock ? "In Stock" : "Out of Stock"}
              {selectedVariant?.quantity &&
                ` (${selectedVariant.quantity} available)`}
            </span>
          </div>
          <div className="product-detail-variants">
            {availableColors.length > 0 && (
              <fieldset className="product-detail-color-section">
                <legend>Color:</legend>
                <div className="product-detail-color-buttons">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      className={`product-detail-color-button ${selectedColor === color ? "selected" : ""
                        }`}
                      onClick={() => handleColorClick(color)}
                      type="button"
                      aria-label={`Select ${color} color`}
                      aria-pressed={selectedColor === color}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {availableSizes.length > 0 && (
              <fieldset className="product-detail-size-section">
                <legend>Size:</legend>
                <div className="product-detail-size-buttons">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      className={`product-detail-size-button ${selectedSize === size ? "selected" : ""
                        }`}
                      onClick={() => handleSizeClick(size)}
                      disabled={
                        selectedColor &&
                        !isValidCombination(selectedColor, size)
                      }
                      type="button"
                      aria-label={`Select ${size} size`}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            <fieldset className="product-detail-quantity-section">
              <legend>Quantity:</legend>
              <input
                type="number"
                className="product-detail-quantity-input"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                max={selectedVariant?.quantity || 99}
                disabled={!selectedVariant || !isInStock}
                aria-label="Select quantity"
              />
            </fieldset>
          </div>
        </div>

        <div className="product-detail-actions-section">
          <button
            className="product-detail-add-to-favorites"
            onClick={handleAddToFavorites}
            disabled={isAddingToFavorites}
            type="button"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            {isAddingToFavorites
              ? isFavorited
                ? "Removing..."
                : "Adding..."
              : isFavorited
                ? "Remove from Favorites"
                : "Add to Favorites"}
          </button>
          <button
            className="product-detail-add-to-cart"
            onClick={handleAddToCart}
            disabled={!selectedVariant || !isInStock || isAddingToCart}
            type="button"
            aria-label="Add to cart"
          >
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </button>
          <button
            className="product-detail-buy-now"
            onClick={handleBuyNow}
            disabled={!selectedVariant || !isInStock}
            type="button"
            aria-label="Buy now"
          >
            Buy Now
          </button>
          <div className="product-detail-shipping">
            <div className="product-detail-shipping-delivery">
              <strong>FREE delivery</strong> by tomorrow
            </div>
            <div className="product-detail-shipping-deliver">
              <strong>Deliver to</strong> Vietnam
            </div>
            <div className="product-detail-shipping-returns">
              <strong>Return Policy:</strong> 30-day returns. Free returns on
              eligible orders.
            </div>
          </div>
        </div>
      </div>

      {isLightboxOpen && (
        <div className={`product-detail-lightbox ${isLightboxOpen ? 'open' : ''}`} role="dialog" aria-label="Image lightbox">
          <div className="product-detail-lightbox-overlay" onClick={handleCloseLightbox}></div>
          <div className="product-detail-lightbox-content">
            <button
              className="product-detail-lightbox-close"
              onClick={handleCloseLightbox}
              aria-label="Close lightbox"
            >
              <i className="lni lni-close"></i>
            </button>
            <button
              className="product-detail-lightbox-arrow product-detail-lightbox-arrow-prev"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <i className="lni lni-chevron-left"></i>
            </button>
            <button
              className="product-detail-lightbox-arrow product-detail-lightbox-arrow-next"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <i className="lni lni-chevron-right"></i>
            </button>
            <div className="product-detail-lightbox-image-container">
              <img
                src={allThumbnails[lightboxIndex]?.imageURL || "/placeholder-image.png"}
                alt={`${product.pro_name || "Product"} image ${lightboxIndex + 1}`}
                style={{ transform: `scale(${zoomLevel})` }}
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                  e.target.alt = `Not available for ${product.pro_name || "product"}`;
                }}
              />
            </div>
            <div className="product-detail-lightbox-controls">
              <button
                className="product-detail-lightbox-zoom"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                aria-label="Zoom in"
              >
                <i className="lni lni-zoom-in"></i>
              </button>
              <button
                className="product-detail-lightbox-zoom"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                aria-label="Zoom out"
              >
                <i className="lni lni-zoom-out"></i>
              </button>
              <span className="product-detail-lightbox-counter">
                {lightboxIndex + 1} / {allThumbnails.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {product.description && (
        <div className="product-detail-description">
          <h2>Product Description</h2>
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {product.description}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Customer Feedback Section */}
      <div className="product-detail-feedback">
        {/* Loading State for Feedback */}
        {feedbackLoading && (
          <LoadingForm
            text="Loading reviews..."
            height="h-32"
            className="mb-6"
            size="lg"
          />
        )}

        {/* Error State for Feedback */}
        {feedbackError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="lni lni-warning text-red-500 text-xl mr-3"></i>
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Reviews</h3>
                <p className="text-red-600 text-sm mt-1">{feedbackError}</p>
              </div>
            </div>
            <button
              onClick={() => fetchFeedbacks(selectedVariant?._id)}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Recent Feedback Preview */}
        {!feedbackLoading && !feedbackError && feedbacks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
            {feedbacks
              .filter(feedback => !feedback.feedback?.is_deleted) // Filter out deleted feedbacks
              .slice(0, 2)
              .map((feedback) => (
                <div key={feedback._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        {feedback.customer?.image ? (
                          <img
                            src={feedback.customer.image}
                            alt={feedback.customer?.username || 'User'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full flex items-center justify-center text-white font-bold ${feedback.customer?.image ? 'hidden' : 'flex'}`}
                        >
                          {feedback.customer?.username?.charAt(0).toUpperCase() || 'A'}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {feedback.customer?.username || "Anonymous"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {feedback.order_date ? formatDate(feedback.order_date) : 'Unknown Date'}
                        </div>
                      </div>
                    </div>
                    {feedback.feedback?.has_rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < feedback.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                  </div>
                  {feedback.feedback?.has_content && (
                    <p className="text-gray-700 text-sm line-clamp-2">
                      "{feedback.feedback.content}"
                    </p>
                  )}
                </div>
              ))}
            {feedbacks.filter(feedback => !feedback.feedback?.is_deleted).length > 2 && (
              <div className="text-center">
                <Link
                  to={selectedVariant ? `/product/${id}/feedback/${selectedVariant._id}` : `/product/${id}/feedback`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  View {feedbacks.filter(feedback => !feedback.feedback?.is_deleted).length - 2} more reviews
                  <i className="lni lni-arrow-right ml-1"></i>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* No Feedback State */}
        {!feedbackLoading && !feedbackError && feedbacks.filter(feedback => !feedback.feedback?.is_deleted).length === 0 && (
          <div className="text-center py-12">
            <div className="mb-6">
              <i className="lni lni-comments text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Reviews Yet</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;