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

      if (!productResponse) {
        throw new Error("Product not found");
      }

      const productData = productResponse.data?.data || productResponse.data;

      if (!productData) {
        throw new Error("Product data is empty");
      }

      setProduct(productData);

      const productVariants = productData.productVariantIds || [];
      setVariants(productVariants);

      const productImages = productData.productImageIds || [];
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
      showToast(err.response?.data?.message || err.message || "Failed to fetch product details", "error", TOAST_TIMEOUT);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

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
      showToast(err.message || "Failed to fetch favorites", "error", TOAST_TIMEOUT);
      setIsFavorited(false);
      setFavoriteId(null);
    }
  }, [id, user, showToast]);

  // Initial fetch
  useEffect(() => {
    fetchProductAndVariants();
    fetchFavorites();
  }, [id, fetchFavorites, fetchProductAndVariants]);

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
    fetchFavorites();
  }, [fetchProductAndVariants, fetchFavorites]);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)]">
        <div
          className="text-center text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-8 mb-4 flex items-center justify-center gap-2 flex-wrap"
          role="alert"
          tabIndex={0}
          aria-live="polite"
        >
          <span className="text-lg" aria-hidden="true">⚠</span>
          {error}
          <button
            className="px-3 py-2 border-2 border-gray-300 rounded-full text-sm font-semibold text-blue-600 bg-transparent hover:bg-gray-100 hover:border-blue-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] bg-white text-gray-900">
      <div className="flex gap-5 mb-6 flex-wrap lg:flex-nowrap">
        <div className="flex-1 max-w-[480px] flex gap-3">
          <div className="flex flex-col items-center justify-start gap-1">
            <button
              className="bg-white border-2 border-gray-300 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handlePrevThumbnail}
              disabled={thumbnailIndex === 0}
              aria-label="Previous thumbnails"
            >
              <i className="lni lni-chevron-up text-xs text-gray-900"></i>
            </button>
            <div className="w-[72px] flex flex-col gap-2 overflow-hidden">
              {visibleThumbnails.map((thumbnail, index) => (
                <div
                  key={thumbnail._id || index}
                  className={`border-2 border-gray-300 p-1 rounded cursor-pointer hover:border-yellow-400 ${selectedImage === thumbnail.imageUrl ? "border-yellow-400" : ""}`}
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
                    className="w-[60px] h-[60px] object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <button
              className="bg-white border-2 border-gray-300 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleNextThumbnail}
              disabled={thumbnailIndex >= allThumbnails.length - THUMBNAILS_PER_PAGE}
              aria-label="Next thumbnails"
            >
              <i className="lni lni-chevron-down text-xs text-gray-900"></i>
            </button>
          </div>
          <div className="flex-1 flex justify-center items-start">
            <img
              src={selectedImage || "/placeholder-image.png"}
              alt={`${product.productName || "Product"}`}
              className="w-full max-h-[400px] object-contain bg-gray-50 rounded-xl cursor-pointer hover:opacity-90"
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

        <div className="flex-1 p-3">
          <h1 className="text-2xl font-normal mb-3 leading-tight">{product?.productName || "Unnamed Product"}</h1>
          <div className="text-3xl font-semibold text-red-600 mb-2">
            {selectedVariant && selectedVariant.variantPrice
              ? formatPrice(selectedVariant.variantPrice)
              : lowestPriceVariant
                ? `From ${formatPrice(lowestPriceVariant.variantPrice)}`
                : "No variants available"}
          </div>
          <div className="mb-5">
            <span
              className={`text-sm px-2 py-1 rounded ${isInStock ? "text-green-700 bg-green-100" : "text-red-600 bg-red-50 opacity-50"}`}
            >
              {selectedVariant
                ? (isInStock ? "In Stock" : "Out of Stock")
                : "Select a variant to check stock"}
              {selectedVariant?.stockQuantity > 0 &&
                ` (${selectedVariant.stockQuantity} available)`}
            </span>
          </div>
          <div className="space-y-4">
            {availableColors.length > 0 && (
              <fieldset className="border-2 border-gray-300 rounded-xl p-3">
                <legend className="text-sm font-bold mb-2">Color:</legend>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      className={`px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 hover:border-blue-500 ${selectedColor === color ? "border-yellow-400 bg-yellow-50 font-semibold" : ""} focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
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
              <fieldset className="border-2 border-gray-300 rounded-xl p-3">
                <legend className="text-sm font-bold mb-2">Size:</legend>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      className={`px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 hover:border-blue-500 ${selectedSize === size ? "border-yellow-400 bg-yellow-50 font-semibold" : ""} disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      onClick={() => handleSizeClick(size)}
                      disabled={selectedColor && !isValidCombination(selectedColor, size)}
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
            <fieldset className="border-2 border-gray-300 rounded-xl p-3">
              <legend className="text-sm font-bold mb-2">Quantity:</legend>
              <input
                type="number"
                className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white text-sm w-20 hover:bg-gray-50 hover:border-blue-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                disabled={!selectedVariant || !isInStock}
                aria-label="Select quantity"
              />
            </fieldset>
          </div>
        </div>

        <div className="min-w-[200px] max-w-[260px] p-4 border-2 border-gray-300 rounded-xl bg-gray-50 flex flex-col gap-2">
          <button
            className="px-3 py-2 border-2 border-teal-600 rounded-full text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 hover:border-teal-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
            className="px-3 py-2 border-2 border-yellow-600 rounded-full text-sm font-semibold text-gray-900 bg-yellow-400 hover:bg-yellow-300 hover:border-yellow-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleAddToCart}
            disabled={!selectedVariant || !isInStock || isAddingToCart}
            type="button"
            aria-label="Add to cart"
          >
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </button>
          <button
            className="px-3 py-2 border-2 border-orange-600 rounded-full text-sm font-semibold text-gray-900 bg-orange-400 hover:bg-orange-300 hover:border-orange-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleBuyNow}
            disabled={!selectedVariant || !isInStock}
            type="button"
            aria-label="Buy now"
          >
            Buy Now
          </button>
          <div className="text-center text-xs text-gray-600 mt-3">
            <div className="mb-2">
              <strong className="text-green-700">FREE delivery</strong> by tomorrow
            </div>
            <div className="mb-2">
              <strong className="text-green-700">Deliver to</strong> Vietnam
            </div>
            <div>
              <strong className="text-green-700">Return Policy:</strong> 30-day returns. Free returns on eligible orders.
            </div>
          </div>
        </div>
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center" role="dialog" aria-label="Image lightbox">
          <div className="absolute inset-0 bg-black/80 cursor-pointer" onClick={handleCloseLightbox}></div>
          <div className="relative max-w-[90%] max-h-[90%] bg-white rounded-xl p-5 flex items-center justify-center shadow-lg">
            <button
              className="absolute top-2.5 right-2.5 bg-white border-2 border-gray-300 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleCloseLightbox}
              aria-label="Close lightbox"
            >
              <i className="lni lni-close text-sm text-gray-900"></i>
            </button>
            <button
              className="absolute top-1/2 -translate-y-1/2 left-2.5 bg-white border-2 border-gray-300 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <i className="lni lni-chevron-left text-base text-gray-900"></i>
            </button>
            <button
              className="absolute top-1/2 -translate-y-1/2 right-2.5 bg-white border-2 border-gray-300 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <i className="lni lni-chevron-right text-base text-gray-900"></i>
            </button>
            <div className="max-w-[800px] max-h-[600px] overflow-hidden flex items-center justify-center">
              <img
                src={allThumbnails[lightboxIndex]?.imageUrl || "/placeholder-image.png"}
                alt={`${product.productName || "Product"} image ${lightboxIndex + 1}`}
                className="max-w-full max-h-[600px] object-contain"
                style={{ transform: `scale(${zoomLevel})` }}
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                  e.target.alt = `Not available for ${product.productName || "product"}`;
                }}
              />
            </div>
            <div className="absolute bottom-2.5 flex items-center gap-2.5">
              <button
                className="bg-white border-2 border-gray-300 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                aria-label="Zoom in"
              >
                <i className="lni lni-zoom-in text-sm text-gray-900"></i>
              </button>
              <button
                className="bg-white border-2 border-gray-300 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                aria-label="Zoom out"
              >
                <i className="lni lni-zoom-out text-sm text-gray-900"></i>
              </button>
              <span className="text-sm text-gray-900 bg-white px-2 py-1 rounded">
                {lightboxIndex + 1} / {allThumbnails.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {product?.description && (
        <div className="my-4 mx-2 p-4 border-t-2 border-gray-300">
          <h2 className="text-lg font-bold mb-3">Product Description</h2>
          <div className="prose prose-sm">
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