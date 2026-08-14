import { useState, useMemo, useCallback } from "react";

/**
 * Hook for managing product variants, color & size selection, stock status, and indexing
 * @param {Array} variants - List of product variants
 * @param {string} productId - Current product ID for state storage
 * @param {Function} [onImageChange] - Callback to update main image when variant changes
 * @param {Function} [setStoredState] - Optional state persistence updater
 */
export function useVariantSelection(variants = [], productId, onImageChange, setStoredState) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  // Index active variants by color, size, and composite key
  const variantIndex = useMemo(() => {
    const index = { byColor: {}, bySize: {}, byColorSize: {} };
    const activeVariants = variants.filter(
      (v) => !v.variantStatus || v.variantStatus === "active"
    );

    activeVariants.forEach((variant) => {
      const color =
        variant.productColorId && !variant.productColorId.isDeleted
          ? variant.productColorId.productColorName
          : null;
      const size =
        variant.productSizeId && !variant.productSizeId.isDeleted
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

  // Find lowest price active variant
  const lowestPriceVariant = useMemo(() => {
    const activeVariants = variants.filter(
      (v) => !v.variantStatus || v.variantStatus === "active"
    );
    if (activeVariants.length === 0) return null;

    return activeVariants.reduce((lowest, variant) => {
      if (!lowest || variant.variantPrice < lowest.variantPrice) {
        return variant;
      }
      return lowest;
    }, null);
  }, [variants]);

  // Check if selected variant is currently in stock
  const isInStock = useMemo(() => {
    if (!selectedVariant) return false;
    return (
      selectedVariant.variantStatus !== "discontinued" &&
      selectedVariant.stockQuantity > 0
    );
  }, [selectedVariant]);

  const handleColorClick = useCallback(
    (color) => {
      if (!color) return;
      setSelectedColor(color);
      setSelectedSize(null);
      setSelectedVariant(null);

      const colorVariants = variantIndex.byColor[color];
      if (colorVariants && colorVariants.length > 0 && colorVariants[0].variantImage) {
        if (onImageChange) {
          onImageChange(colorVariants[0].variantImage);
        }
      }

      if (setStoredState && productId) {
        setStoredState((prev) => ({
          ...prev,
          [productId]: { ...prev[productId], selectedColor: color, selectedSize: null },
        }));
      }
    },
    [productId, setStoredState, variantIndex, onImageChange]
  );

  const handleSizeClick = useCallback(
    (size) => {
      if (!size) return;
      setSelectedSize(size);

      const variant = selectedColor
        ? variantIndex.byColorSize[`${selectedColor}-${size}`] || null
        : variantIndex.bySize[size]?.[0] || null;
      setSelectedVariant(variant);

      if (variant?.variantImage && onImageChange) {
        onImageChange(variant.variantImage);
      }

      if (setStoredState && productId) {
        setStoredState((prev) => ({
          ...prev,
          [productId]: { ...prev[productId], selectedSize: size },
        }));
      }
    },
    [selectedColor, productId, setStoredState, variantIndex, onImageChange]
  );

  const selectVariantDirectly = useCallback(
    (variant) => {
      if (!variant) {
        setSelectedColor(null);
        setSelectedSize(null);
        setSelectedVariant(null);
        if (setStoredState && productId) {
          setStoredState((prev) => ({
            ...prev,
            [productId]: { ...prev[productId], selectedColor: null, selectedSize: null },
          }));
        }
        return;
      }

      const color = variant.productColorId?.productColorName || null;
      const size = variant.productSizeId?.productSizeName || null;

      setSelectedColor(color);
      setSelectedSize(size);
      setSelectedVariant(variant);

      if (setStoredState && productId) {
        setStoredState((prev) => ({
          ...prev,
          [productId]: { ...prev[productId], selectedColor: color, selectedSize: size },
        }));
      }
    },
    [productId, setStoredState]
  );

  return {
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
  };
}

export default useVariantSelection;
