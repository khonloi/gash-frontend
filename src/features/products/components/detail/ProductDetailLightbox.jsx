import React from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Full-screen lightbox modal for product image gallery with zoom and pagination controls.
 */
export default function ProductDetailLightbox({
  isOpen,
  onClose,
  allThumbnails = [],
  lightboxIndex = 0,
  zoomLevel = 1,
  productName = "Product",
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-full z-[1000] flex items-center justify-center"
      role="dialog"
      aria-label="Image lightbox"
    >
      <div
        className="absolute top-0 left-0 w-full h-full bg-black/80 cursor-pointer"
        onClick={onClose}
      />
      <div className="relative max-w-[90%] max-h-[90%] bg-white rounded-xl p-4 sm:p-5 flex items-center justify-center shadow-sm border border-gray-200">
        <button
          className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 bg-white border-2 border-gray-300 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <X className="w-4 h-4 text-gray-900" />
        </button>
        <button
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
          onClick={onPrev}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5 text-gray-900" />
        </button>
        <button
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
          onClick={onNext}
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5 text-gray-900" />
        </button>
        <div className="max-w-[800px] max-h-[600px] overflow-hidden flex items-center justify-center">
          <img
            src={allThumbnails[lightboxIndex]?.imageUrl || "/placeholder-image.png"}
            alt={`${productName} image ${lightboxIndex + 1}`}
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-w-full max-h-[600px] object-contain transition-transform"
            onError={(e) => {
              e.target.src = "/placeholder-image.png";
              e.target.alt = `Not available for ${productName}`;
            }}
          />
        </div>
        <div className="absolute bottom-2 sm:bottom-3 flex items-center gap-3">
          <button
            className="bg-white border-2 border-gray-300 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
            onClick={onZoomIn}
            disabled={zoomLevel >= 3}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-900" />
          </button>
          <button
            className="bg-white border-2 border-gray-300 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-amber-500 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
            onClick={onZoomOut}
            disabled={zoomLevel <= 1}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-gray-900" />
          </button>
          <span className="text-gray-900 text-xs sm:text-sm bg-white border border-gray-300 px-2.5 py-1 rounded-md shadow-sm">
            {lightboxIndex + 1} / {allThumbnails.length}
          </span>
        </div>
      </div>
    </div>
  );
}
