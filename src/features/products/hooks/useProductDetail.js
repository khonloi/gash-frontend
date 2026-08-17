import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";
import Api from "../../../common/SummaryAPI";
import { DETAIL_STORAGE_KEY, TOAST_TIMEOUT } from "../../../constants/constants";
import { fetchWithRetry } from "../../../utils/fetchWithRetry";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { formatPrice } from "../../../utils/formatters";
import { storage } from "../../../utils/storage";
import { useImageGallery } from "./useImageGallery";
import { useVariantSelection } from "./useVariantSelection";

const THUMBNAILS_PER_PAGE = 4;

export const useProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [images, setImages] = useState([]);
  const [forYouProducts, setForYouProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const [, setStoredState] = useLocalStorage(DETAIL_STORAGE_KEY, {});

  // Sub-hook: Image Gallery & Lightbox
  const gallery = useImageGallery(images, variants, id, (variant) => {
    selectVariantDirectly(variant);
  });

  const setSelectedGalleryImage = gallery.setSelectedImage;

  // Sub-hook: Variant Selection & Availability
  const {
    selectedVariant,
    setSelectedVariant,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    availableColors,
    setAvailableColors,
    availableSizes,
    setAvailableSizes,
    variantIndex,
    lowestPriceVariant,
    isInStock,
    handleColorClick,
    handleSizeClick,
    selectVariantDirectly,
  } = useVariantSelection(variants, id, setSelectedGalleryImage, setStoredState);

  useEffect(() => {
    setIsFavorited(false);
    setFavoriteId(null);
  }, [id]);

  const isProductInactive = useMemo(() => {
    return product?.productStatus === "inactive";
  }, [product]);

  const isProductDiscontinued = useMemo(() => {
    return product?.productStatus === "discontinued";
  }, [product]);

  // Fetch product data and its variants
  const fetchProductAndVariants = useCallback(async () => {
    if (!id) {
      setError("No product ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productResponse = await fetchWithRetry(() => Api.products.getById(id));
      const productData = productResponse?.data || productResponse;

      if (!productData) {
        throw new Error("Product data not found");
      }

      setProduct(productData);

      // Handle product images
      let productImages = [];
      if (Array.isArray(productData.productImageIds) && productData.productImageIds.length > 0) {
        productImages = productData.productImageIds;
      } else {
        const imagesResponse = await fetchWithRetry(() => Api.productImages.getByProduct(id));
        const fetchedImages = imagesResponse?.data || imagesResponse || [];
        productImages = Array.isArray(fetchedImages) ? fetchedImages : [];
      }

      setImages(productImages);

      const mainImage = productImages.find((img) => img.isMain);
      if (mainImage && mainImage.imageUrl) {
        setSelectedGalleryImage(mainImage.imageUrl);
      } else if (productImages.length > 0 && productImages[0].imageUrl) {
        setSelectedGalleryImage(productImages[0].imageUrl);
      }

      // Handle variants
      const activeVariantIds = (productData.productVariantIds || []).filter(
        (v) => !v.variantStatus || v.variantStatus === "active"
      );

      setVariants(activeVariantIds);

      // Extract unique colors and sizes
      const colorsMap = new Map();
      const sizesMap = new Map();

      activeVariantIds.forEach((variant) => {
        if (variant.productColorId && !variant.productColorId.isDeleted) {
          const colorName = variant.productColorId.productColorName;
          if (colorName && !colorsMap.has(colorName)) {
            colorsMap.set(colorName, colorName);
          }
        }

        if (variant.productSizeId && !variant.productSizeId.isDeleted) {
          const sizeName = variant.productSizeId.productSizeName;
          if (sizeName && !sizesMap.has(sizeName)) {
            sizesMap.set(sizeName, sizeName);
          }
        }
      });

      const colors = Array.from(colorsMap.keys());
      const sizes = Array.from(sizesMap.keys());

      setAvailableColors(colors);
      setAvailableSizes(sizes);

      // Restore saved selection or select defaults
      try {
        const parsedState = storage.getItem(DETAIL_STORAGE_KEY, {});
        const productState = parsedState[id] || {};

        if (productState.selectedColor && colorsMap.has(productState.selectedColor)) {
          setSelectedColor(productState.selectedColor);
          if (productState.selectedSize && sizesMap.has(productState.selectedSize)) {
            setSelectedSize(productState.selectedSize);
            const variant = activeVariantIds.find((v) => {
              const vc = v.productColorId?.productColorName;
              const vs = v.productSizeId?.productSizeName;
              return vc === productState.selectedColor && vs === productState.selectedSize;
            });
            if (variant) {
              setSelectedVariant(variant);
              if (variant.variantImage) setSelectedGalleryImage(variant.variantImage);
            }
          }
        } else if (colors.length > 0) {
          const firstColor = colors[0];
          setSelectedColor(firstColor);

          const matchingVariant = activeVariantIds.find(
            (v) => v.productColorId?.productColorName === firstColor
          );
          if (matchingVariant) {
            if (matchingVariant.productSizeId) {
              setSelectedSize(matchingVariant.productSizeId.productSizeName);
            }
            setSelectedVariant(matchingVariant);
            if (matchingVariant.variantImage) {
              setSelectedGalleryImage(matchingVariant.variantImage);
            }
          }
        }

        if (productState.quantity && productState.quantity >= 1) {
          setQuantity(productState.quantity);
        }
      } catch {
        // Fallback default selection
        if (colors.length > 0) {
          setSelectedColor(colors[0]);
        }
      }

      // Check favorites status if user logged in
      if (user?._id) {
        try {
          const favResponse = await fetchWithRetry(() => Api.favorites.fetch());
          const favoritesData = favResponse?.favorites || favResponse?.data || favResponse || [];
          if (Array.isArray(favoritesData)) {
            const found = favoritesData.find(
              (f) => f.productId?._id === id || f.productId === id
            );
            if (found) {
              setIsFavorited(true);
              setFavoriteId(found._id);
            }
          }
        } catch {
          // Non-critical, ignore favorites fetch failure
        }
      }

      // Track recently viewed
      try {
        const stored = storage.getRecentlyViewed();
        const ids = [id, ...stored.filter((itemId) => itemId !== id)].slice(0, 10);
        storage.setRecentlyViewed(ids);
      } catch {
        // Ignore error
      }
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError(err.message || "Failed to load product details");
    } finally {
      setLoading(false);
    }
  }, [id, user?._id, setSelectedGalleryImage, setAvailableColors, setAvailableSizes, setSelectedColor, setSelectedSize, setSelectedVariant]);

  useEffect(() => {
    fetchProductAndVariants();
  }, [fetchProductAndVariants]);

  // Load recently viewed details from allProducts
  useEffect(() => {
    if (allProducts.length > 0 && id) {
      try {
        const ids = storage.getRecentlyViewed();
        const otherIds = ids.filter((itemId) => itemId !== id);
        const detailed = otherIds
          .map((itemId) => allProducts.find((p) => p._id === itemId))
          .filter(Boolean)
          .slice(0, 5);
        setRecentlyViewed(detailed);
      } catch (err) {
        console.warn("Failed to load recently viewed products:", err);
      }
    }
  }, [allProducts, id]);

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
      if (isFavorited && favoriteId) {
        await Api.favorites.remove(favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
        showToast("Product removed from favorites successfully", "success", TOAST_TIMEOUT);
      } else {
        const favoriteItem = {
          accountId: user._id,
          productId: id,
        };
        const response = await Api.favorites.add(favoriteItem);
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

      await Api.cart.create(cartItem);
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

  const getRandomItems = useCallback((arr, count, excludeIds = []) => {
    if (!Array.isArray(arr) || arr.length <= count) return arr;
    const filtered = excludeIds.length > 0 ? arr.filter((item) => !excludeIds.includes(item._id || item)) : arr;
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }, []);

  const fetchAllProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const response = await fetchWithRetry(() => Api.products.getAll());
      const productsData = response?.data || response || [];

      if (!Array.isArray(productsData) || productsData.length === 0) {
        setAllProducts([]);
        setForYouProducts([]);
        return;
      }

      const activeProducts = productsData.filter(
        (p) => p.productStatus === "active" && p.productVariantIds?.length > 0
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
      const variant = variants.find((v) => {
        const variantColor = v.productColorId && !v.productColorId.isDeleted
          ? v.productColorId.productColorName
          : null;
        const variantSize = v.productSizeId && !v.productSizeId.isDeleted
          ? v.productSizeId.productSizeName
          : null;
        return variantColor === color && variantSize === size;
      });
      return (
        variant &&
        variant.variantStatus !== "discontinued" &&
        variant.variantStatus !== "inactive" &&
        (!variant.variantStatus || variant.variantStatus === "active") &&
        variant.stockQuantity > 0
      );
    },
    [variants]
  );

  const isColorInStock = useCallback(
    (color) => {
      const colorVariants = variants.filter((v) => {
        const variantColor = v.productColorId && !v.productColorId.isDeleted
          ? v.productColorId.productColorName
          : null;
        return variantColor === color;
      });
      return colorVariants.some(
        (v) =>
          v.variantStatus !== "discontinued" &&
          v.variantStatus !== "inactive" &&
          (!v.variantStatus || v.variantStatus === "active") &&
          v.stockQuantity > 0
      );
    },
    [variants]
  );

  const isColorInactiveOrDiscontinued = useCallback(
    (color) => {
      const colorVariants = variants.filter((v) => {
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
        const variant = variants.find((v) => {
          const variantColor = v.productColorId && !v.productColorId.isDeleted
            ? v.productColorId.productColorName
            : null;
          const variantSize = v.productSizeId && !v.productSizeId.isDeleted
            ? v.productSizeId.productSizeName
            : null;
          return variantColor === selectedColor && variantSize === size;
        });
        return (
          variant &&
          variant.variantStatus !== "discontinued" &&
          variant.variantStatus !== "inactive" &&
          (!variant.variantStatus || variant.variantStatus === "active") &&
          variant.stockQuantity > 0
        );
      }
      const sizeVariants = variants.filter((v) => {
        const variantSize = v.productSizeId && !v.productSizeId.isDeleted
          ? v.productSizeId.productSizeName
          : null;
        return variantSize === size;
      });
      return sizeVariants.some(
        (v) =>
          v.variantStatus !== "discontinued" &&
          v.variantStatus !== "inactive" &&
          (!v.variantStatus || v.variantStatus === "active") &&
          v.stockQuantity > 0
      );
    },
    [selectedColor, variants]
  );

  const isSizeInactiveOrDiscontinued = useCallback(
    (size) => {
      if (selectedColor) {
        const variant = variants.find((v) => {
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
      const sizeVariants = variants.filter((v) => {
        const variantSize = v.productSizeId && !v.productSizeId.isDeleted
          ? v.productSizeId.productSizeName
          : null;
        return variantSize === size;
      });
      if (sizeVariants.length === 0) return true;
      return sizeVariants.every(
        (v) => v.variantStatus === "inactive" || v.variantStatus === "discontinued"
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
    selectedImage: gallery.selectedImage,
    thumbnailIndex: gallery.thumbnailIndex,
    isLightboxOpen: gallery.isLightboxOpen,
    lightboxIndex: gallery.lightboxIndex,
    zoomLevel: gallery.zoomLevel,
    forYouProducts,
    allProducts,
    productsLoading,
    recentlyViewed,
    isProductInactive,
    isProductDiscontinued,
    lowestPriceVariant,
    allThumbnails: gallery.allThumbnails,
    visibleThumbnails: gallery.visibleThumbnails,
    colorStockInfo,
    isInStock,
    handleQuantityChange,
    handleColorClick,
    handleSizeClick,
    handleImageClick: gallery.handleImageClick,
    handleOpenLightbox: gallery.handleOpenLightbox,
    handleCloseLightbox: gallery.handleCloseLightbox,
    handlePrevImage: gallery.handlePrevImage,
    handleNextImage: gallery.handleNextImage,
    handleZoomIn: gallery.handleZoomIn,
    handleZoomOut: gallery.handleZoomOut,
    handlePrevThumbnail: gallery.handlePrevThumbnail,
    handleNextThumbnail: gallery.handleNextThumbnail,
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
    THUMBNAILS_PER_PAGE,
  };
};

export default useProductDetail;
