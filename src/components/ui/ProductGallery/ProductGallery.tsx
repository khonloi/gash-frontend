"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ProductGallery.module.css";

interface ProductGalleryProps {
  images: string[];
  isNew?: boolean;
}

export function ProductGallery({ images, isNew }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImageWrapper}>
        {isNew && <span className={styles.badgeNew}>NEW</span>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex]}
          alt={`Product view ${activeIndex + 1}`}
          className={styles.mainImage}
        />

        {images.length > 1 && (
          <>
            <button
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={handlePrev}
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={handleNext}
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className={styles.thumbnailList}>
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`${styles.thumbnailBtn} ${idx === activeIndex ? styles.activeThumbnail : ""}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className={styles.thumbnailImg}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
