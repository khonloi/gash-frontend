import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";
import Api from "../../../common/SummaryAPI";
import {
  DETAIL_STORAGE_KEY,
  API_RETRY_COUNT,
  API_RETRY_DELAY,
  TOAST_TIMEOUT,
} from "../../../constants/constants";

const THUMBNAILS_PER_PAGE = 4;

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

export const useProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

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
  const [forYouProducts, setForYouProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const [, setStoredState] = useLocalStorage(DETAIL_STORAGE_KEY, {});

  useEffect(() => {
    setIsFavorited(false);
    setFavoriteId(null);
  }, [id]);

  useEffect(() => {
    setThumbnailIndex(0);
  }, [id, images, variants]);

  const isProductInactive = useMemo(() => {
    return product?.productStatus === 'inactive';
  }, [product]);

  const isProductDiscontinued = useMemo(() => {
    return product?.productStatus === 'discontinued';
  }, [product]);

  const variantIndex = useMemo(() => {
    const index = { byColor: {}, bySize: {}, byColorSize: {} };
    const activeVariants = variants.filter(v =>
      !v.variantStatus || v.variantStatus === 'active'
    );

    activeVariants.forEach((variant) => {
      const color = variant.productColorId && !variant.productColorId.isDeleted
        ? variant.productColorId.productColorName
        : null;
      const size = variant.productSizeId && !variant.productSizeId.isDeleted
        ? variant.productSizeId.productSizeName
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

  const allThumbnails = useMemo(() => {
    const thumbnails = [];
    const seenImages = new Set();

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
        const uniqueColors = [
          ...new Set(
            productVariants
              .filter((v) => v.productColorId && !v.productColorId.isDeleted)
              .map((v) => v.productColorId?.productColorName)
              .filter(Boolean)
          ),
        ].sort();
        const uniqueSizes = [
          ...new Set(
            productVariants
              .filter((v) => v.productSizeId && !v.productSizeId.isDeleted)
              .map((v) => v.productSizeId?.productSizeName)
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

  useEffect(() => {
    fetchProductAndVariants();
  }, [id, fetchProductAndVariants]);

  useEffect(() => {
    const checkIfFavorited = async () => {
      if (!user || !id) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await Api.favorites.fetch(token);
        const favorites = response.data?.favorites || response.data || [];

        const favoriteEntry = favorites.find(fav =>
          fav.productId?._id === id || fav.productId === id
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
      }
    };

    checkIfFavorited();
  }, [user, id]);

  useEffect(() => {
    if (!id) return;

    try {
      const stored = localStorage.getItem("recently_viewed_ids");
      let ids = stored ? JSON.parse(stored) : [];

      ids = ids.filter(itemId => itemId !== id);
      ids.unshift(id);

      const limitedIds = ids.slice(0, 10);
      localStorage.setItem("recently_viewed_ids", JSON.stringify(limitedIds));
    } catch (err) {
      console.warn("Failed to update recently viewed products:", err);
    }
  }, [id]);

  useEffect(() => {
    if (allProducts.length > 0) {
      try {
        const stored = localStorage.getItem("recently_viewed_ids");
        const ids = stored ? JSON.parse(stored) : [];

        const otherIds = ids.filter(itemId => itemId !== id);

        const detailedProducts = otherIds
          .map(itemId => allProducts.find(p => p._id === itemId))
          .filter(Boolean)
          .slice(0, 5);

        setRecentlyViewed(detailedProducts);
      } catch (err) {
        console.warn("Failed to load recently viewed products:", err);
      }
    }
  }, [allProducts, id]);

  const isInStock = useMemo(() => {
    if (!selectedVariant) return false;
    return selectedVariant.variantStatus !== "discontinued" && selectedVariant.stockQuantity > 0;
  }, [selectedVariant]);

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
        const color = variant.productColorId?.productColorName;
        const size = variant.productSizeId?.productSizeName;

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
        showToast("Product removed from favorites successfully", "success", TOAST_TIMEOUT);
      } else {
        const favoriteItem = {
          accountId: user._id,
          productId: id,
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

      showToast(`${quantity} item${quantity > 1 ? "s" : ""} added to cart successfully`, "success", TOAST_TIMEOUT);
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

  const visibleThumbnails = useMemo(() => {
    return allThumbnails.slice(
      thumbnailIndex,
      thumbnailIndex + THUMBNAILS_PER_PAGE
    );
  }, [allThumbnails, thumbnailIndex]);

  const formatPrice = useCallback((price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);

  const getRandomItems = useCallback((arr, count, excludeIds = []) => {
    if (!Array.isArray(arr) || arr.length <= count) return arr;
    const filtered = excludeIds.length > 0 ? arr.filter(item => !excludeIds.includes(item._id || item)) : arr;
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }, []);

  const fetchAllProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await fetchWithRetry(() => Api.newProducts.getAll());
      const productsData = response?.data || response || [];

      if (!Array.isArray(productsData) || productsData.length === 0) {
        setAllProducts([]);
        setForYouProducts([]);
        return;
      }

      const activeProducts = productsData.filter(
        (p) => p.productStatus === "active" &&
          p.productVariantIds?.length > 0
      );

      setAllProducts(activeProducts);

      const excludeIds = id ? [id] : [];
      const forYou = getRandomItems(activeProducts, 5, excludeIds);
      setForYouProducts(forYou);
    } catch (err) {
      console.error("Error fetching products for For You section:", err);
      setAllProducts([]);
      setForYouProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [id, getRandomItems]);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const handleProductClick = useCallback(
    (productId) => {
      if (!productId) {
        showToast("Invalid product selected", "error", TOAST_TIMEOUT);
        return;
      }
      navigate(`/product/${productId}`);
    },
    [navigate, showToast]
  );

  const handleKeyDown = useCallback(
    (e, productId) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleProductClick(productId);
      }
    },
    [handleProductClick]
  );

  const isValidCombination = useCallback(
    (color, size) => {
      const variant = variants.find(v => {
        const variantColor = v.productColorId && !v.productColorId.isDeleted
          ? v.productColorId.productColorName
          : null;
        const variantSize = v.productSizeId && !v.productSizeId.isDeleted
          ? v.productSizeId.productSizeName
          : null;
        return variantColor === color && variantSize === size;
      });
      return variant &&
        variant.variantStatus !== "discontinued" &&
        variant.variantStatus !== "inactive" &&
        (!variant.variantStatus || variant.variantStatus === 'active') &&
        variant.stockQuantity > 0;
    },
    [variants]
  );

  const isColorInStock = useCallback(
    (color) => {
      const colorVariants = variants.filter(v => {
        const variantColor = v.productColorId && !v.productColorId.isDeleted
          ? v.productColorId.productColorName
          : null;
        return variantColor === color;
      });
      return colorVariants.some(
        (v) => v.variantStatus !== "discontinued" &&
          v.variantStatus !== "inactive" &&
          (!v.variantStatus || v.variantStatus === 'active') &&
          v.stockQuantity > 0
      );
    },
    [variants]
  );

  const isColorInactiveOrDiscontinued = useCallback(
    (color) => {
      const colorVariants = variants.filter(v => {
        const variantColor = v.productColorId && !v.productColorId.isDeleted
          ? v.productColorId.productColorName
          : null;
        return variantColor === color;
      });
      if (colorVariants.length === 0) return true;
      return colorVariants.every(
        (v) => v.variantStatus === "inactive" || v.variantStatus === "discontinued"
      );
    },
    [variants]
  );

  const isSizeInStock = useCallback(
    (size) => {
      if (selectedColor) {
        const variant = variants.find(v => {
          const variantColor = v.productColorId && !v.productColorId.isDeleted
            ? v.productColorId.productColorName
            : null;
          const variantSize = v.productSizeId && !v.productSizeId.isDeleted
            ? v.productSizeId.productSizeName
            : null;
          return variantColor === selectedColor && variantSize === size;
        });
        return variant &&
          variant.variantStatus !== "discontinued" &&
          variant.variantStatus !== "inactive" &&
          (!variant.variantStatus || variant.variantStatus === 'active') &&
          variant.stockQuantity > 0;
      }
      const sizeVariants = variants.filter(v => {
        const variantSize = v.productSizeId && !v.productSizeId.isDeleted
          ? v.productSizeId.productSizeName
          : null;
        return variantSize === size;
      });
      return sizeVariants.some(
        v => v.variantStatus !== "discontinued" &&
          v.variantStatus !== "inactive" &&
          (!v.variantStatus || v.variantStatus === 'active') &&
          v.stockQuantity > 0
      );
    },
    [selectedColor, variants]
  );

  const isSizeInactiveOrDiscontinued = useCallback(
    (size) => {
      if (selectedColor) {
        const variant = variants.find(v => {
          const variantColor = v.productColorId && !v.productColorId.isDeleted
            ? v.productColorId.productColorName
            : null;
          const variantSize = v.productSizeId && !v.productSizeId.isDeleted
            ? v.productSizeId.productSizeName
            : null;
          return variantColor === selectedColor && variantSize === size;
        });
        return variant && (variant.variantStatus === "inactive" || variant.variantStatus === "discontinued");
      }
      const sizeVariants = variants.filter(v => {
        const variantSize = v.productSizeId && !v.productSizeId.isDeleted
          ? v.productSizeId.productSizeName
          : null;
        return variantSize === size;
      });
      if (sizeVariants.length === 0) return true;
      return sizeVariants.every(
        v => v.variantStatus === "inactive" || v.variantStatus === "discontinued"
      );
    },
    [selectedColor, variants]
  );

  const colorStockInfo = useMemo(() => {
    if (isProductDiscontinued) {
      return { inStock: false, message: "Discontinued" };
    }
    if (isProductInactive) {
      return { inStock: false, message: "Out of Stock" };
    }
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
  }, [selectedColor, selectedSize, selectedVariant, isColorInStock, isProductInactive, isProductDiscontinued]);

  return {
    id,
    user,
    product,
    variants,
    selectedVariant,
    loading,
    error,
    selectedColor,
    selectedSize,
    quantity,
    availableColors,
    availableSizes,
    isAddingToCart,
    isAddingToFavorites,
    isFavorited,
    favoriteId,
    images,
    selectedImage,
    thumbnailIndex,
    isLightboxOpen,
    lightboxIndex,
    zoomLevel,
    forYouProducts,
    allProducts,
    productsLoading,
    recentlyViewed,
    isProductInactive,
    isProductDiscontinued,
    lowestPriceVariant,
    allThumbnails,
    visibleThumbnails,
    colorStockInfo,
    isInStock,
    handleQuantityChange,
    handleColorClick,
    handleSizeClick,
    handleImageClick,
    handleOpenLightbox,
    handleCloseLightbox,
    handlePrevImage,
    handleNextImage,
    handleZoomIn,
    handleZoomOut,
    handlePrevThumbnail,
    handleNextThumbnail,
    handleRetry,
    handleAddToFavorites,
    handleAddToCart,
    handleBuyNow,
    formatPrice,
    handleProductClick,
    handleKeyDown,
    isValidCombination,
    isColorInStock,
    isColorInactiveOrDiscontinued,
    isSizeInStock,
    isSizeInactiveOrDiscontinued,
    THUMBNAILS_PER_PAGE
  };
};
