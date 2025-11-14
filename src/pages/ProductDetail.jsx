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
import rehypeRaw from "rehype-raw";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductFeedback from "../components/ProductFeedback";
import ProductButton from "../components/ProductButton";
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

  // Reset thumbnail index when product or images change to show main image at top
  useEffect(() => {
    setThumbnailIndex(0);
  }, [id, images, variants]);

  // Pre-index variants (only active variants)
  const variantIndex = useMemo(() => {
    const index = { byColor: {}, bySize: {}, byColorSize: {} };
    const activeVariants = variants.filter(v =>
      !v.variantStatus || v.variantStatus === 'active'
    );

    activeVariants.forEach((variant) => {
      // Only index variants with non-deleted colors and sizes
      const color = variant.productColorId && !variant.productColorId.isDeleted
        ? variant.productColorId.color_name
        : null;
      const size = variant.productSizeId && !variant.productSizeId.isDeleted
        ? variant.productSizeId.size_name
        : null;
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

  // Get all thumbnails: all product images + active variant images
  // Main image is always first at the top
  const allThumbnails = useMemo(() => {
    const thumbnails = [];
    const seenImages = new Set();

    // First, add the main image if it exists
    const mainImage = images.find(img => img.isMain && img.imageUrl);
    if (mainImage) {
      thumbnails.push({
        _id: mainImage._id,
        imageUrl: mainImage.imageUrl,
        isMain: true,
        variant: null
      });
      seenImages.add(mainImage.imageUrl);
    }

    // Then add all other product images (excluding main image)
    images.forEach((img) => {
      if (img.imageUrl && !seenImages.has(img.imageUrl)) {
        thumbnails.push({
          _id: img._id,
          imageUrl: img.imageUrl,
          isMain: img.isMain || false,
          variant: null
        });
        seenImages.add(img.imageUrl);
      }
    });

    // Finally, add variant images that aren't duplicates
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

        // Extract colors, filter out deleted colors (isDeleted: false)
        const uniqueColors = [
          ...new Set(
            activeVariants
              .filter((v) => v.productColorId && !v.productColorId.isDeleted)
              .map((v) => v.productColorId?.color_name)
              .filter(Boolean)
          ),
        ].sort();
        // Extract sizes, filter out deleted sizes (isDeleted: false)
        const uniqueSizes = [
          ...new Set(
            activeVariants
              .filter((v) => v.productSizeId && !v.productSizeId.isDeleted)
              .map((v) => v.productSizeId?.size_name)
              .filter(Boolean)
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

  // Product Detail Skeleton Component
  const ProductDetailSkeleton = () => (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      {/* Breadcrumb Skeleton */}
      <nav className="w-full mb-3 sm:mb-4" aria-label="Breadcrumb skeleton">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </nav>

      {/* Main Product Section Skeleton */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 w-full">
          {/* Image Gallery Skeleton */}
          <div className="flex-1 sm:flex-[3] max-w-full sm:max-w-[480px] flex gap-2 sm:gap-3">
            {/* Thumbnail Navigation Skeleton */}
            <div className="flex flex-col items-center justify-start gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-[72px] flex flex-col gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-[60px] h-[60px] bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            {/* Main Image Skeleton */}
            <div className="flex justify-center items-start w-full">
              <div className="w-full h-[400px] bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="flex-1 sm:flex-[3] px-0 sm:px-3 space-y-4 sm:space-y-5">
            {/* Product Name Skeleton */}
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            {/* Price Skeleton */}
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            {/* Stock Status Skeleton */}
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
            
            {/* Color Selection Skeleton */}
            <div className="space-y-3 sm:space-y-4">
              <div className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <div className="h-5 bg-gray-200 rounded w-16 mb-3 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded-md w-20 animate-pulse"></div>
                  ))}
                </div>
              </div>
              
              {/* Size Selection Skeleton */}
              <div className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <div className="h-5 bg-gray-200 rounded w-12 mb-3 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded-md w-16 animate-pulse"></div>
                  ))}
                </div>
              </div>
              
              {/* Quantity Skeleton */}
              <div className="border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <div className="h-5 bg-gray-200 rounded w-20 mb-3 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-md w-20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons Sidebar Skeleton */}
          <div className="flex-1 min-w-[200px] max-w-full sm:max-w-[260px] p-4 sm:p-5 border-2 border-gray-300 rounded-xl bg-gray-50 flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
            <div className="mt-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Description Section Skeleton */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-md">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
        </div>
      </section>

      {/* Feedback Section Skeleton */}
      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-md">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  // Render
  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error && !product) {
    return (
      <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-md">
        <div className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap" role="alert" tabIndex={0} aria-live="polite">
          <span className="text-lg" aria-hidden="true">⚠</span>
          {error}
          <button
            className="px-3 py-1.5 bg-transparent border-2 border-gray-300 text-blue-600 text-sm rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            onClick={handleRetry}
            disabled={loading}
            type="button"
            aria-label="Retry loading product"
          >
            Retry
          </button>
        </div>
        </section>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Get category name for breadcrumb
  const categoryName = product?.categoryId?.cat_name || null;
  const categoryLink = categoryName 
    ? `/products?category=${encodeURIComponent(categoryName)}`
    : null;

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
      {/* Breadcrumbs */}
      <nav className="w-full mb-3 sm:mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
          <li>
            <button
              onClick={() => navigate("/")}
              className="hover:text-blue-600 transition-colors focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 rounded"
              aria-label="Go to home"
            >
              Home
            </button>
          </li>
          {categoryName && (
            <>
              <li aria-hidden="true">
                <span className="text-gray-400">/</span>
              </li>
              <li>
                {categoryLink ? (
                  <button
                    onClick={() => navigate(categoryLink)}
                    className="hover:text-blue-600 transition-colors focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 rounded"
                    aria-label={`Go to ${categoryName} category`}
                  >
                    {categoryName}
                  </button>
                ) : (
                  <span>{categoryName}</span>
                )}
              </li>
            </>
          )}
          <li aria-hidden="true">
            <span className="text-gray-400">/</span>
          </li>
          <li className="text-gray-900 font-medium" aria-current="page">
            {product?.productName || "Product"}
          </li>
        </ol>
      </nav>

      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 w-full">
        <div className="flex-1 sm:flex-[3] max-w-full sm:max-w-[480px] flex gap-2 sm:gap-3">
          <div className="flex flex-col items-center justify-start gap-2">
            <button
              className="bg-white border-2 border-gray-300 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
              onClick={handlePrevThumbnail}
              disabled={thumbnailIndex === 0}
              aria-label="Previous thumbnails"
            >
              <i className="lni lni-chevron-up text-xs sm:text-sm text-gray-900"></i>
            </button>
            <div className="w-[72px] flex flex-col gap-2 overflow-hidden">
              {visibleThumbnails.map((thumbnail, index) => (
                <div
                  key={thumbnail._id || index}
                  className={`border-2 p-1 cursor-pointer rounded transition-colors ${
                    selectedImage === thumbnail.imageUrl
                      ? "border-amber-400"
                      : "border-gray-300 hover:border-amber-400"
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
                    className="w-[60px] h-[60px] object-contain"
                  />
                </div>
              ))}
            </div>
            <button
              className="bg-white border-2 border-gray-300 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
              onClick={handleNextThumbnail}
              disabled={
                thumbnailIndex >= allThumbnails.length - THUMBNAILS_PER_PAGE
              }
              aria-label="Next thumbnails"
            >
              <i className="lni lni-chevron-down text-xs sm:text-sm text-gray-900"></i>
            </button>
          </div>
          <div className="flex justify-center items-start w-full">
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
              className="w-full max-h-[400px] object-contain bg-gray-50 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
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

        <div className="flex-1 sm:flex-[3] px-0 sm:px-3 space-y-4 sm:space-y-5">
          <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold m-0 mb-3 sm:mb-4 leading-tight text-gray-900">
            {product?.productName || "Unnamed Product"}
          </h1>
          <div className="text-red-600 text-2xl font-semibold my-2 sm:my-3">
            {selectedVariant && selectedVariant.variantPrice
              ? formatPrice(selectedVariant.variantPrice)
              : lowestPriceVariant
                ? `From ${formatPrice(lowestPriceVariant.variantPrice)}`
                : "No variants available"}
          </div>
          <div>
            <span
              className={`text-sm px-2 py-1 rounded inline-block ${
                colorStockInfo.inStock
                  ? "text-green-700 bg-green-100"
                  : "text-red-600 bg-red-50 opacity-50"
              }`}
            >
              {colorStockInfo.message}
            </span>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {availableColors.length > 0 && (
              <fieldset className="mb-4 sm:mb-5 border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <legend className="text-sm sm:text-base font-semibold">Color:</legend>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      className={`px-3 py-1.5 border-2 rounded-md bg-white cursor-pointer text-sm transition-colors focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 ${
                        selectedColor === color
                          ? "border-amber-400 bg-amber-50 font-semibold"
                          : "border-gray-300 hover:bg-gray-50 hover:border-blue-600"
                      } ${!isColorInStock(color) ? "opacity-50" : ""}`}
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
              <fieldset className="mb-4 sm:mb-5 border-2 border-gray-300 rounded-xl p-3 sm:p-4">
                <legend className="text-sm sm:text-base font-semibold">Size:</legend>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      className={`px-3 py-1.5 border-2 rounded-md bg-white cursor-pointer text-sm transition-colors focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 ${
                        selectedSize === size
                          ? "border-amber-400 bg-amber-50 font-semibold"
                          : "border-gray-300 hover:bg-gray-50 hover:border-blue-600"
                      } ${!isSizeInStock(size) ? "opacity-50 cursor-not-allowed" : ""}`}
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
            <fieldset className="mb-4 sm:mb-5 flex flex-col">
              <legend className="text-sm sm:text-base font-semibold">Quantity:</legend>
              <input
                type="number"
                className="px-3 py-1.5 border-2 border-gray-300 rounded-md bg-white text-sm w-20 transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                disabled={!selectedVariant || !isInStock}
                aria-label="Select quantity"
              />
            </fieldset>
          </div>
        </div>

        <div className="flex-1 min-w-[200px] max-w-full sm:max-w-[260px] p-4 sm:p-5 border-2 border-gray-300 rounded-xl bg-gray-50 flex flex-col gap-2">
          <ProductButton
            variant="secondary"
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
          </ProductButton>
          <ProductButton
            variant="primary"
            onClick={handleAddToCart}
            disabled={!selectedVariant || !isInStock || isAddingToCart}
            type="button"
            aria-label="Add to cart"
          >
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </ProductButton>
          <ProductButton
            variant="default"
            onClick={handleBuyNow}
            disabled={!selectedVariant || !isInStock}
            type="button"
            aria-label="Buy now"
          >
            Buy Now
          </ProductButton>
          <div className="text-xs sm:text-sm text-gray-600 text-center mt-3 space-y-2">
            <div className="leading-relaxed">
              <strong className="text-green-700">FREE delivery</strong> by tomorrow
            </div>
            <div className="leading-relaxed">
              <strong className="text-green-700">Deliver to</strong> Vietnam
            </div>
            <div className="leading-relaxed">
              <strong className="text-green-700">Return Policy:</strong> 30-day returns. Free returns on
              eligible orders.
            </div>
          </div>
        </div>
        </div>
      </section>

      {isLightboxOpen && (
        <div className="fixed top-0 left-0 w-full h-full z-[1000] flex items-center justify-center" role="dialog" aria-label="Image lightbox">
          <div className="absolute top-0 left-0 w-full h-full bg-black/80 cursor-pointer" onClick={handleCloseLightbox}></div>
          <div className="relative max-w-[90%] max-h-[90%] bg-white rounded-xl p-4 sm:p-5 flex items-center justify-center shadow-md">
            <button
              className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white border-2 border-gray-300 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
              onClick={handleCloseLightbox}
              aria-label="Close lightbox"
            >
              <i className="lni lni-close text-sm sm:text-base text-gray-900"></i>
            </button>
            <button
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-white border-2 border-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <i className="lni lni-chevron-left text-base sm:text-lg text-gray-900"></i>
            </button>
            <button
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white border-2 border-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <i className="lni lni-chevron-right text-base sm:text-lg text-gray-900"></i>
            </button>
            <div className="max-w-[800px] max-h-[600px] overflow-hidden flex items-center justify-center">
              <img
                src={allThumbnails[lightboxIndex]?.imageUrl || "/placeholder-image.png"}
                alt={`${product.productName || "Product"} image ${lightboxIndex + 1}`}
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-w-full max-h-[600px] object-contain transition-transform"
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                  e.target.alt = `Not available for ${product.productName || "product"}`;
                }}
              />
            </div>
            <div className="absolute bottom-2 sm:bottom-3 flex items-center gap-2 sm:gap-3">
              <button
                className="bg-white border-2 border-gray-300 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                aria-label="Zoom in"
              >
                <i className="lni lni-zoom-in text-sm sm:text-base text-gray-900"></i>
              </button>
              <button
                className="bg-white border-2 border-gray-300 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                aria-label="Zoom out"
              >
                <i className="lni lni-zoom-out text-sm sm:text-base text-gray-900"></i>
              </button>
              <span className="text-gray-900 text-sm bg-white px-2 py-1 rounded">
                {lightboxIndex + 1} / {allThumbnails.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {product?.description && (
        <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full mb-4 sm:mb-5 md:mb-6 shadow-md">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Product Description</h2>
          <div className="leading-relaxed text-base text-gray-700 [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:font-semibold [&_h5]:mt-4 [&_h5]:mb-2 [&_h5]:font-semibold [&_h6]:mt-4 [&_h6]:mb-2 [&_h6]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-8 [&_ol]:my-2 [&_ol]:pl-8 [&_li]:mb-1 [&_a]:text-blue-600 [&_a]:no-underline [&_a:hover]:underline [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:my-4 [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:bg-gray-50 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_br]:block [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {product.description}
            </ReactMarkdown>
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-full shadow-md">
        <ProductFeedback productId={id} />
      </section>
    </div>
  );
};

export default ProductDetail;