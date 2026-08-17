import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useDebounce from "../../../hooks/useDebounce";
import { FILTER_STORAGE_KEY, SEARCH_DEBOUNCE_DELAY } from "../../../constants/constants";
import { storage } from "../../../utils/storage";

const getMinPrice = (product) => {
  if (!product?.productVariantIds || product.productVariantIds.length === 0) {
    return 0;
  }
  const prices = product.productVariantIds
    .filter((v) => v.variantStatus !== "discontinued" && v.variantPrice > 0)
    .map((v) => v.variantPrice);
  return prices.length > 0 ? Math.min(...prices) : 0;
};

export function useProductGridFilter({
  rawProducts = [],
  variants = [],
  isFavoritesPage = false,
  syncToUrl = true,
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sanitizeParam = (param) =>
    typeof param === "string" ? param.replace(/[<>]/g, "") : null;

  const getInitialFilter = (paramKey, defaultVal) => {
    if (!syncToUrl) return defaultVal;

    const urlVal = sanitizeParam(searchParams.get(paramKey));
    if (urlVal !== null) return urlVal;

    try {
      const parsed = storage.getItem(FILTER_STORAGE_KEY, {});
      if (parsed && typeof parsed === "object" && parsed[paramKey] !== undefined) {
        return parsed[paramKey];
      }
    } catch (err) {
      console.warn(`Error reading localStorage for filters:`, err);
    }
    return defaultVal;
  };

  const [selectedCategory, setSelectedCategory] = useState(() =>
    getInitialFilter("category", "All Categories")
  );
  const [selectedColor, setSelectedColor] = useState(() =>
    getInitialFilter("color", "All Colors")
  );
  const [selectedSize, setSelectedSize] = useState(() =>
    getInitialFilter("size", "All Sizes")
  );
  const [minPrice, setMinPrice] = useState(() => getInitialFilter("minPrice", ""));
  const [maxPrice, setMaxPrice] = useState(() => getInitialFilter("maxPrice", ""));
  const [sortBy, setSortBy] = useState(() => getInitialFilter("sortBy", "name"));
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  const debouncedCategory = useDebounce(selectedCategory, SEARCH_DEBOUNCE_DELAY);
  const debouncedColor = useDebounce(selectedColor, SEARCH_DEBOUNCE_DELAY);
  const debouncedSize = useDebounce(selectedSize, SEARCH_DEBOUNCE_DELAY);
  const debouncedMinPrice = useDebounce(minPrice, SEARCH_DEBOUNCE_DELAY);
  const debouncedMaxPrice = useDebounce(maxPrice, SEARCH_DEBOUNCE_DELAY);

  const productsList = useMemo(() => {
    if (!rawProducts) return [];
    if (isFavoritesPage) {
      return rawProducts
        .filter((fav) => fav && fav.productId)
        .map((fav) => ({
          ...fav.productId,
          favoriteId: fav._id,
          isFavorite: true,
        }));
    }
    return rawProducts;
  }, [rawProducts, isFavoritesPage]);

  const categoriesList = useMemo(() => {
    return [
      ...new Set(
        productsList
          .filter((p) => p.categoryId && !p.categoryId.isDeleted)
          .map((p) => p.categoryId?.categoryName)
          .filter(Boolean)
      ),
    ].sort();
  }, [productsList]);

  const colorsList = useMemo(() => {
    const source = variants && variants.length > 0 ? variants : [];
    const colors = source
      .map((v) => v.productColorId)
      .filter((c) => c && !c.isDeleted)
      .map((c) => c.productColorName)
      .filter(Boolean);
    return [...new Set(colors)].sort();
  }, [variants]);

  const sizesList = useMemo(() => {
    const source = variants && variants.length > 0 ? variants : [];
    const sizes = source
      .map((v) => v.productSizeId)
      .filter((s) => s && !s.isDeleted)
      .map((s) => s.productSizeName)
      .filter(Boolean);
    return [...new Set(sizes)].sort();
  }, [variants]);

  const priceRange = useMemo(() => {
    const allPrices = productsList.flatMap((p) => {
      const pVariants = p.productVariantIds || [];
      return pVariants
        .filter((v) => v.variantStatus !== "discontinued" && v.variantPrice > 0)
        .map((v) => v.variantPrice);
    });
    if (allPrices.length === 0) return { min: 0, max: 1000000 };
    return {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices),
    };
  }, [productsList]);

  // Sync state to URL and localStorage if requested
  const prevFiltersRef = useRef(null);
  useEffect(() => {
    if (!syncToUrl) return;

    const currentFilters = {
      category: debouncedCategory,
      color: debouncedColor,
      size: debouncedSize,
      minPrice: debouncedMinPrice,
      maxPrice: debouncedMaxPrice,
      sortBy: sortBy,
    };

    if (prevFiltersRef.current === null) {
      prevFiltersRef.current = currentFilters;
      return;
    }

    const hasChanged =
      prevFiltersRef.current.category !== currentFilters.category ||
      prevFiltersRef.current.color !== currentFilters.color ||
      prevFiltersRef.current.size !== currentFilters.size ||
      prevFiltersRef.current.minPrice !== currentFilters.minPrice ||
      prevFiltersRef.current.maxPrice !== currentFilters.maxPrice ||
      prevFiltersRef.current.sortBy !== currentFilters.sortBy;

    if (hasChanged) {
      prevFiltersRef.current = currentFilters;
      storage.setItem(FILTER_STORAGE_KEY, currentFilters);
      const newSearchParams = new URLSearchParams();
      if (currentFilters.category !== "All Categories") {
        newSearchParams.set("category", currentFilters.category);
      }
      if (currentFilters.color !== "All Colors") {
        newSearchParams.set("color", currentFilters.color);
      }
      if (currentFilters.size !== "All Sizes") {
        newSearchParams.set("size", currentFilters.size);
      }
      if (currentFilters.minPrice) {
        newSearchParams.set("minPrice", currentFilters.minPrice);
      }
      if (currentFilters.maxPrice) {
        newSearchParams.set("maxPrice", currentFilters.maxPrice);
      }
      if (currentFilters.sortBy && currentFilters.sortBy !== "name") {
        newSearchParams.set("sortBy", currentFilters.sortBy);
      }
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  }, [
    debouncedCategory,
    debouncedColor,
    debouncedSize,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortBy,
    syncToUrl,
    navigate,
  ]);

  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), SEARCH_DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [
    debouncedCategory,
    debouncedColor,
    debouncedSize,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortBy,
    searchQuery,
  ]);

  // Filter and sort active products
  const activeProducts = useMemo(() => {
    if (!productsList.length) return [];

    let filtered = productsList.filter(
      (p) => p.productStatus === "active" && p.productVariantIds?.length > 0
    );

    if (debouncedCategory !== "All Categories") {
      filtered = filtered.filter(
        (p) =>
          p.categoryId?.categoryName === debouncedCategory &&
          p.categoryId &&
          !p.categoryId.isDeleted
      );
    }

    if (debouncedColor !== "All Colors" || debouncedSize !== "All Sizes") {
      filtered = filtered.filter((product) => {
        const productVariants = product.productVariantIds || [];
        return productVariants.some((variant) => {
          const colorMatches =
            debouncedColor === "All Colors" ||
            (variant.productColorId?.productColorName === debouncedColor &&
              variant.productColorId &&
              !variant.productColorId.isDeleted);
          const sizeMatches =
            debouncedSize === "All Sizes" ||
            (variant.productSizeId?.productSizeName === debouncedSize &&
              variant.productSizeId &&
              !variant.productSizeId.isDeleted);
          return colorMatches && sizeMatches;
        });
      });
    }

    if (debouncedMinPrice || debouncedMaxPrice) {
      filtered = filtered.filter((product) => {
        const productMinPrice = getMinPrice(product);
        if (productMinPrice === 0) return false;

        const min = debouncedMinPrice ? parseFloat(debouncedMinPrice) : 0;
        const max = debouncedMaxPrice ? parseFloat(debouncedMaxPrice) : Infinity;

        if (min > max) return false;

        return productMinPrice >= min && productMinPrice <= max;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product) =>
        product.productName?.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return getMinPrice(a) - getMinPrice(b);
        case "price-high":
          return getMinPrice(b) - getMinPrice(a);
        case "new": {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        case "popularity": {
          const popDateA = new Date(a.createdAt || 0).getTime();
          const popDateB = new Date(b.createdAt || 0).getTime();
          return popDateB - popDateA;
        }
        case "name":
        default:
          return (a.productName || "").localeCompare(b.productName || "");
      }
    });

    return sorted;
  }, [
    productsList,
    debouncedCategory,
    debouncedColor,
    debouncedSize,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortBy,
    searchQuery,
  ]);

  const handleFilterChange = useCallback((filterType, value) => {
    switch (filterType) {
      case "category":
        setSelectedCategory(value);
        break;
      case "color":
        setSelectedColor(value);
        break;
      case "size":
        setSelectedSize(value);
        break;
      case "minPrice": {
        const parsed = value === "" ? "" : Number(value);
        if (parsed === "" || (!isNaN(parsed) && parsed >= 0)) {
          setMinPrice(parsed);
          if (typeof parsed === "number" && typeof maxPrice === "number" && maxPrice < parsed) {
            setMaxPrice(parsed);
          }
        }
        break;
      }
      case "maxPrice": {
        const parsed = value === "" ? "" : Number(value);
        if (parsed === "" || (!isNaN(parsed) && parsed >= 0)) {
          setMaxPrice(parsed);
          if (typeof parsed === "number" && typeof minPrice === "number" && minPrice > parsed) {
            setMinPrice(parsed);
          }
        }
        break;
      }
      case "sortBy":
        setSortBy(value);
        break;
      default:
        console.warn(`Unknown filter type: ${filterType}`);
    }
  }, [maxPrice, minPrice]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory("All Categories");
    setSelectedColor("All Colors");
    setSelectedSize("All Sizes");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("name");
    setSearchQuery("");
  }, []);

  const hasActiveFilters =
    selectedCategory !== "All Categories" ||
    selectedColor !== "All Colors" ||
    selectedSize !== "All Sizes" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    sortBy !== "name" ||
    searchQuery !== "";

  return {
    selectedCategory,
    selectedColor,
    selectedSize,
    minPrice,
    maxPrice,
    sortBy,
    setSortBy,
    showMobileFilters,
    setShowMobileFilters,
    searchQuery,
    setSearchQuery,
    isFiltering,
    productsList,
    categoriesList,
    colorsList,
    sizesList,
    priceRange,
    activeProducts,
    handleFilterChange,
    clearAllFilters,
    hasActiveFilters,
  };
}

export default useProductGridFilter;
