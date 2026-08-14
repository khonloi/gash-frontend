import { useState, useMemo, useCallback, useEffect } from "react";

const THUMBNAILS_PER_PAGE = 4;

/**
 * Hook for managing product image gallery, lightbox, thumbnails, and zooming
 * @param {Array} images - Product image array
 * @param {Array} variants - Product variant array
 * @param {string} productId - Product ID for reset triggers
 * @param {Function} [onVariantSelectFromImage] - Optional callback when thumbnail with variant is clicked
 */
export function useImageGallery(images = [], variants = [], productId, onVariantSelectFromImage) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Reset thumbnail index when product changes
  useEffect(() => {
    setThumbnailIndex(0);
  }, [productId]);

  // Aggregate all thumbnails from main images, gallery images, and variant images
  const allThumbnails = useMemo(() => {
    const thumbnails = [];
    const seenImages = new Set();

    const mainImage = images.find((img) => img.isMain && img.imageUrl);
    if (mainImage) {
      thumbnails.push({
        _id: mainImage._id,
        imageUrl: mainImage.imageUrl,
        isMain: true,
        variant: null,
      });
      seenImages.add(mainImage.imageUrl);
    }

    images.forEach((img) => {
      if (img.imageUrl && !seenImages.has(img.imageUrl)) {
        thumbnails.push({
          _id: img._id,
          imageUrl: img.imageUrl,
          isMain: img.isMain || false,
          variant: null,
        });
        seenImages.add(img.imageUrl);
      }
    });

    variants
      .filter((v) => (!v.variantStatus || v.variantStatus === "active") && v.variantImage)
      .forEach((variant) => {
        if (!seenImages.has(variant.variantImage)) {
          thumbnails.push({
            _id: variant._id,
            imageUrl: variant.variantImage,
            isMain: false,
            variant: variant,
          });
          seenImages.add(variant.variantImage);
        }
      });

    return thumbnails;
  }, [images, variants]);

  // Visible window of thumbnails based on pagination
  const visibleThumbnails = useMemo(() => {
    return allThumbnails.slice(
      thumbnailIndex,
      thumbnailIndex + THUMBNAILS_PER_PAGE
    );
  }, [allThumbnails, thumbnailIndex]);

  const handleImageClick = useCallback(
    (thumbnail) => {
      setSelectedImage(thumbnail.imageUrl);
      if (onVariantSelectFromImage) {
        onVariantSelectFromImage(thumbnail.variant);
      }
    },
    [onVariantSelectFromImage]
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

  return {
    selectedImage,
    setSelectedImage,
    thumbnailIndex,
    setThumbnailIndex,
    isLightboxOpen,
    lightboxIndex,
    zoomLevel,
    allThumbnails,
    visibleThumbnails,
    handleImageClick,
    handleOpenLightbox,
    handleCloseLightbox,
    handlePrevImage,
    handleNextImage,
    handleZoomIn,
    handleZoomOut,
    handlePrevThumbnail,
    handleNextThumbnail,
  };
}

export default useImageGallery;
