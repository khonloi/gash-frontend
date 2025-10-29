import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { useToast } from "../hooks/useToast";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axiosClient from '../common/axiosClient';
import Api from '../common/SummaryAPI';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductFeedback from "../components/ProductFeedback";
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

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

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
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Local storage
  const [, setStoredState] = useLocalStorage(DETAIL_STORAGE_KEY, {});

  // Reset favorite state when product ID changes
  useEffect(() => {
    setIsFavorited(false);
    setFavoriteId(null);
  }, [id]);

  // Pre-index variants (only active variants)
  const variantIndex = useMemo(() => {
    const index = { byColor: {}, bySize: {}, byColorSize: {} };
    const activeVariants = variants.filter(v =>
      !v.variantStatus || v.variantStatus === 'active'
    );

    activeVariants.forEach((variant) => {
      const color = variant.productColorId?.color_name;
      const size = variant.productSizeId?.size_name;
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

  // Get all thumbnails: main product image + active variant images
  const allThumbnails = useMemo(() => {
    const thumbnails = [];

    const mainImage = images.find(img => img.isMain);
    if (mainImage) {
      thumbnails.push({
        _id: mainImage._id,
        imageUrl: mainImage.imageUrl,
        isMain: true,
        variant: null
      });
    } else if (images.length > 0) {
      thumbnails.push({
        _id: images[0]._id,
        imageUrl: images[0].imageUrl,
        isMain: true,
        variant: null
      });
    }

    const seenImages = new Set([thumbnails[0]?.imageUrl]);
    variants
      .filter(v => (!v.variantStatus || v.variantStatus === 'active') && v.variantImage)
      .forEach(variant => {
        if (!seenImages.has(variant.variantImage)) {
          thumbnails.push({
            _id: variant._id,
            imageUrl: variant.variantImage,
            isMain: false,
            variant: variant
          });
          seenImages.add(variant.variantImage);
        }
      });

    return thumbnails;
  }, [images, variants]);

  // Get lowest price variant (only from active variants)
  const lowestPriceVariant = useMemo(() => {
    const activeVariants = variants.filter(v => !v.variantStatus || v.variantStatus === 'active');
    if (activeVariants.length === 0) return null;

    return activeVariants.reduce((lowest, variant) => {
      if (!lowest || variant.variantPrice < lowest.variantPrice) {
        return variant;
      }
      return lowest;
    }, null);
  }, [variants]);

  // Data fetching
  const fetchProductAndVariants = useCallback(async () => {
    if (!id) {
      showToast("Product ID is required", "error", TOAST_TIMEOUT);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productResponse = await Api.newProducts.getById(id);
      if (!productResponse?.data) {
        throw new Error("Invalid product response");
      }

      const productData = productResponse.data?.data || productResponse.data;
      if (!productData?._id) {
        throw new Error("Product data is incomplete");
      }

      setProduct(productData);
      const productVariants = Array.isArray(productData.productVariantIds) ? productData.productVariantIds : [];
      setVariants(productVariants);
      const productImages = Array.isArray(productData.productImageIds) ? productData.productImageIds : [];
      setImages(productImages);

      if (!Array.isArray(productVariants) || productVariants.length === 0) {
        setAvailableColors([]);
        setAvailableSizes([]);
        setSelectedVariant(null);
        console.warn("Product has no variants");
      } else {
        const activeVariants = productVariants.filter(v =>
          !v.variantStatus || v.variantStatus === 'active'
        );

        const uniqueColors = [
          ...new Set(
            activeVariants.map((v) => v.productColorId?.color_name).filter(Boolean)
          ),
        ].sort();
        const uniqueSizes = [
          ...new Set(
            activeVariants.map((v) => v.productSizeId?.size_name).filter(Boolean)
          ),
        ].sort();
        setAvailableColors(uniqueColors);
        setAvailableSizes(uniqueSizes);

        setSelectedColor(null);
        setSelectedSize(null);
        setQuantity(1);
        setSelectedVariant(null);
      }

      const mainImage = productImages.find(img => img.isMain);
      const defaultImageUrl = mainImage?.imageUrl || productImages[0]?.imageUrl || "/placeholder-image.png";
      setSelectedImage(defaultImageUrl);
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err.message || "Failed to fetch product details");
      showToast(err.message || "Failed to fetch product details", "error", TOAST_TIMEOUT);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  // Initial fetch
  useEffect(() => {
    fetchProductAndVariants();
  }, [id, fetchProductAndVariants]);

  // Check if product is already in favorites on mount
  useEffect(() => {
    const checkIfFavorited = async () => {
      if (!user || !id) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await Api.favorites.fetch(token);
        const favorites = response.data?.favorites || response.data || [];

        const favoriteEntry = favorites.find(fav =>
          fav.pro_id?._id === id || fav.pro_id === id
        );

        if (favoriteEntry) {
          setIsFavorited(true);
          setFavoriteId(favoriteEntry._id);
        } else {
          setIsFavorited(false);
          setFavoriteId(null);
        }
      } catch (err) {
        console.warn("Failed to check favorites status:", err);
        // Silent fail — don't break UI
      }
    };

    checkIfFavorited();
  }, [user, id]);

  // Stock status - based on selected variant (include inactive variants with stock)
  const isInStock = useMemo(
    () => {
      if (!selectedVariant) return false;
      return selectedVariant.variantStatus !== "discontinued" && selectedVariant.stockQuantity > 0;
    },
    [selectedVariant]
  );

  // Quantity validation
  const handleQuantityChange = useCallback(
    (e) => {
      const value = e.target.value;
      const parsedValue = parseInt(value, 10);
      if (isNaN(parsedValue) || parsedValue < 1) {
        setQuantity(1);
        showToast("Quantity must be at least 1", "error", TOAST_TIMEOUT);
      } else if (selectedVariant?.stockQuantity && parsedValue > selectedVariant.stockQuantity) {
        setQuantity(selectedVariant.stockQuantity);
        showToast(`Quantity cannot exceed ${selectedVariant.stockQuantity}`, "error", TOAST_TIMEOUT);
      } else {
        setQuantity(parsedValue);
      }
      setStoredState((prev) => ({
        ...prev,
        [id]: { ...prev[id], quantity: parsedValue },
      }));
    },
    [id, selectedVariant, setStoredState, showToast]
  );

  // Event handlers
  const handleColorClick = useCallback(
    (color) => {
      if (!color) return;
      setSelectedColor(color);
      setSelectedSize(null);
      setSelectedVariant(null);

      const colorVariants = variantIndex.byColor[color];
      if (colorVariants && colorVariants.length > 0 && colorVariants[0].variantImage) {
        setSelectedImage(colorVariants[0].variantImage);
      }

      setStoredState((prev) => ({
        ...prev,
        [id]: { ...prev[id], selectedColor: color, selectedSize: null },
      }));
    },
    [id, setStoredState, variantIndex]
  );

  const handleSizeClick = useCallback(
    (size) => {
      if (!size) return;
      setSelectedSize(size);

      const variant = selectedColor
        ? variantIndex.byColorSize[`${selectedColor}-${size}`] || null
        : variantIndex.bySize[size]?.[0] || null;
      setSelectedVariant(variant);

      if (variant?.variantImage) {
        setSelectedImage(variant.variantImage);
      }

      setStoredState((prev) => ({
        ...prev,
        [id]: { ...prev[id], selectedSize: size },
      }));
    },
    [selectedColor, id, setStoredState, variantIndex]
  );

  const handleImageClick = useCallback(
    (thumbnail) => {
      setSelectedImage(thumbnail.imageUrl);

      if (thumbnail.variant) {
        const variant = thumbnail.variant;
        const color = variant.productColorId?.color_name;
        const size = variant.productSizeId?.size_name;

        setSelectedColor(color);
        setSelectedSize(size);
        setSelectedVariant(variant);

        setStoredState((prev) => ({
          ...prev,
          [id]: { ...prev[id], selectedColor: color, selectedSize: size },
        }));
      } else {
        setSelectedColor(null);
        setSelectedSize(null);
        setSelectedVariant(null);

        setStoredState((prev) => ({
          ...prev,
          [id]: { ...prev[id], selectedColor: null, selectedSize: null },
        }));
      }
    },
    [id, setStoredState]
  );

  const handleOpenLightbox = useCallback(() => {
    const allImages = allThumbnails.map((thumb) => thumb.imageUrl);
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
  }, [fetchProductAndVariants]);

  // Updated: Robust favorite handling
  const handleAddToFavorites = useCallback(async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setIsAddingToFavorites(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Authentication token missing", "error", TOAST_TIMEOUT);
        navigate("/login");
        return;
      }

      if (isFavorited && favoriteId) {
        await Api.favorites.remove(favoriteId, token);
        setIsFavorited(false);
        setFavoriteId(null);
        showToast("Product removed from favorites!", "success", TOAST_TIMEOUT);
      } else {
        const favoriteItem = {
          acc_id: user._id,
          pro_id: id,
        };
        const response = await Api.favorites.add(favoriteItem, token);
        const newFavorite = response.data?.favorite || response.data;
        setIsFavorited(true);
        setFavoriteId(newFavorite._id);
        showToast("Product added to favorites!", "success", TOAST_TIMEOUT);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update favorites";
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
      showToast("Please select a valid color and size combination", "error", TOAST_TIMEOUT);
      return;
    }

    if (!isInStock) {
      showToast("Product is out of stock", "error", TOAST_TIMEOUT);
      return;
    }

    if (selectedVariant.stockQuantity && quantity > selectedVariant.stockQuantity) {
      showToast(`Only ${selectedVariant.stockQuantity} items available in stock`, "error", TOAST_TIMEOUT);
      return;
    }

    setIsAddingToCart(true);

    try {
      const cartItem = {
        accountId: user._id,
        variantId: selectedVariant._id,
        productQuantity: quantity.toString(),
        productPrice: selectedVariant.variantPrice,
      };

      const token = localStorage.getItem("token");
      await Api.newCart.create(cartItem, token);

      showToast(`${quantity} item${quantity > 1 ? "s" : ""} added to cart successfully!`, "success", TOAST_TIMEOUT);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to add item to cart";
      showToast(message, "error", TOAST_TIMEOUT);
    } finally {
      setIsAddingToCart(false);
    }
  }, [user, selectedVariant, navigate, isInStock, quantity, showToast]);

  const handleBuyNow = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      showToast("Please select a valid color and size combination", "error", TOAST_TIMEOUT);
      return;
    }

    if (!isInStock) {
      showToast("Product is out of stock", "error", TOAST_TIMEOUT);
      return;
    }

    if (selectedVariant.stockQuantity && quantity > selectedVariant.stockQuantity) {
      showToast(`Only ${selectedVariant.stockQuantity} items available in stock`, "error", TOAST_TIMEOUT);
      return;
    }

    navigate("/checkout", {
      state: {
        product,
        variant: selectedVariant,
        quantity,
      },
    });
  }, [user, selectedVariant, isInStock, navigate, quantity, product, showToast]);

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

  // Check if a color-size combination is valid
  const isValidCombination = useCallback(
    (color, size) => {
      const variant = variantIndex.byColorSize[`${color}-${size}`];
      return variant && variant.variantStatus !== "discontinued" && variant.stockQuantity > 0;
    },
    [variantIndex]
  );

  // Check if a color has any in-stock variants
  const isColorInStock = useCallback(
    (color) => {
      const colorVariants = variantIndex.byColor[color] || [];
      return colorVariants.some(
        (v) => v.variantStatus !== "discontinued" && v.stockQuantity > 0
      );
    },
    [variantIndex]
  );

  // Check if a size is in stock
  const isSizeInStock = useCallback(
    (size) => {
      if (selectedColor) {
        const variant = variantIndex.byColorSize[`${selectedColor}-${size}`];
        return variant && variant.variantStatus !== "discontinued" && variant.stockQuantity > 0;
      }
      const sizeVariants = variantIndex.bySize[size] || [];
      return sizeVariants.some(v => v.variantStatus !== "discontinued" && v.stockQuantity > 0);
    },
    [selectedColor, variantIndex]
  );

  const colorStockInfo = useMemo(() => {
    if (!selectedColor) {
      return { inStock: false, message: "Select a color to check stock" };
    }
    const anyInStock = isColorInStock(selectedColor);
    if (!anyInStock) {
      return { inStock: false, message: "Out of Stock" };
    }

    if (selectedSize && selectedVariant) {
      return {
        inStock: true,
        message: `In Stock (${selectedVariant.stockQuantity} available)`,
      };
    }
    return { inStock: true, message: "In Stock" };
  }, [selectedColor, selectedSize, selectedVariant, isColorInStock]);

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
          <span className="product-list-error-icon" aria-hidden="true">Warning</span>
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
              {visibleThumbnails.map((thumbnail, index) => (
                <div
                  key={thumbnail._id || index}
                  className={`product-detail-thumbnail ${selectedImage === thumbnail.imageUrl ? "selected" : ""
                    }`}
                  onClick={() => handleImageClick(thumbnail)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select thumbnail ${thumbnailIndex + index + 1} for ${product.productName || "Product"}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleImageClick(thumbnail);
                      e.preventDefault();
                    }
                  }}
                >
                  <img
                    src={thumbnail.imageUrl}
                    alt={`${product.productName || "Product"} thumbnail ${thumbnailIndex + index + 1}`}
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
              alt={`${product.productName || "Product"}`}
              onClick={handleOpenLightbox}
              onError={(e) => {
                e.target.src = "/placeholder-image.png";
                e.target.alt = `Not available for ${product.productName || "product"}`;
              }}
              loading="lazy"
              role="button"
              tabIndex={0}
              aria-label={`Open lightbox for ${product.productName || "Product"} image`}
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
          <h1>{product?.productName || "Unnamed Product"}</h1>
          <div className="product-detail-price">
            {selectedVariant && selectedVariant.variantPrice
              ? formatPrice(selectedVariant.variantPrice)
              : lowestPriceVariant
                ? `From ${formatPrice(lowestPriceVariant.variantPrice)}`
                : "No variants available"}
          </div>
          <div className="product-detail-stock-status">
            <span
              className={`product-detail-stock ${
                colorStockInfo.inStock ? "in-stock" : "out-of-stock"
              }`}
            >
              {colorStockInfo.message}
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
                      className={`product-detail-color-button ${selectedColor === color ? "selected" : ""} ${
                        !isColorInStock(color) ? "opacity-50" : ""
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
                      className={`product-detail-size-button ${selectedSize === size ? "selected" : ""} ${
                        !isSizeInStock(size) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => isSizeInStock(size) && handleSizeClick(size)}
                      disabled={!isSizeInStock(size) || (selectedColor && !isValidCombination(selectedColor, size))}
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
                src={allThumbnails[lightboxIndex]?.imageUrl || "/placeholder-image.png"}
                alt={`${product.productName || "Product"} image ${lightboxIndex + 1}`}
                style={{ transform: `scale(${zoomLevel})` }}
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                  e.target.alt = `Not available for ${product.productName || "product"}`;
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

      {product?.description && (
        <div className="product-detail-description">
          <h2>Product Description</h2>
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {product.description}
            </ReactMarkdown>
          </div>
        </div>
      )}

      <ProductFeedback productId={id} />
    </div>
  );
};

export default ProductDetail;