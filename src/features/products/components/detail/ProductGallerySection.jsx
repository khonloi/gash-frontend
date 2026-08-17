import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const THUMBNAILS_PER_PAGE = 4;

/**
 * Product image gallery component with main image display and thumbnail carousel.
 */
export default function ProductGallerySection({
  productName = "Product",
  selectedImage,
  visibleThumbnails = [],
  allThumbnails = [],
  thumbnailIndex = 0,
  onOpenLightbox,
  onImageClick,
  onPrevThumbnail,
  onNextThumbnail,
}) {
  return (
    <div className="flex-1 sm:flex-[3] max-w-full sm:max-w-[420px] flex flex-col gap-3">
      {/* Main Image */}
      <div className="flex justify-center items-start w-full">
        <img
          src={selectedImage || "/placeholder-image.png"}
          alt={productName}
          onClick={onOpenLightbox}
          onError={(e) => {
            e.target.src = "/placeholder-image.png";
            e.target.alt = `Not available for ${productName}`;
          }}
          loading="lazy"
          role="button"
          tabIndex={0}
          className="w-full max-h-[360px] object-contain bg-gray-50 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
          aria-label={`Open lightbox for ${productName} image`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onOpenLightbox();
              e.preventDefault();
            }
          }}
        />
      </div>

      {/* Horizontal Thumbnail Slider */}
      <div className="flex items-center justify-center gap-2 relative">
        <button
          className="bg-white border-2 border-gray-300 rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed flex-shrink-0"
          onClick={onPrevThumbnail}
          disabled={thumbnailIndex === 0}
          aria-label="Previous thumbnails"
          type="button"
        >
          <ChevronLeft className="w-4 h-4 text-gray-900" />
        </button>
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-full">
          {visibleThumbnails.map((thumbnail, index) => (
            <div
              key={thumbnail._id || index}
              className={`border-2 p-1 cursor-pointer rounded transition-colors flex-shrink-0 ${
                selectedImage === thumbnail.imageUrl
                  ? "border-amber-400"
                  : "border-gray-300 hover:border-amber-400"
              }`}
              onClick={() => onImageClick(thumbnail)}
              role="button"
              tabIndex={0}
              aria-label={`Select thumbnail ${thumbnailIndex + index + 1} for ${productName}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onImageClick(thumbnail);
                  e.preventDefault();
                }
              }}
            >
              <img
                src={thumbnail.imageUrl}
                alt={`${productName} thumbnail ${thumbnailIndex + index + 1}`}
                loading="lazy"
                className="w-[50px] h-[50px] object-contain"
              />
            </div>
          ))}
        </div>
        <button
          className="bg-white border-2 border-gray-300 rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-600 focus:outline-none disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed flex-shrink-0"
          onClick={onNextThumbnail}
          disabled={thumbnailIndex >= allThumbnails.length - THUMBNAILS_PER_PAGE}
          aria-label="Next thumbnails"
          type="button"
        >
          <ChevronRight className="w-4 h-4 text-gray-900" />
        </button>
      </div>
    </div>
  );
}
