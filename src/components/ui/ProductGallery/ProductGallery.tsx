"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui";
import styles from "./ProductGallery.module.css";

interface ProductGalleryProps {
  images: string[];
  isNew?: boolean;
}

export function ProductGallery({ images = [], isNew }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = images.length > 0 ? images : [''];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImageWrapper}>
        {isNew && (
          <div className={styles.badgeNew}>
            <Badge variant="success">NEW</Badge>
          </div>
        )}
        {safeImages[activeIndex] ? (
          <Image
            src={safeImages[activeIndex]}
            alt={`Product view ${activeIndex + 1}`}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
            className={styles.mainImage}
          />
        ) : (
          <div className={styles.noImage}>
            No Image Available
          </div>
        )}

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={handlePrev}
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
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
              type="button"
              className={`${styles.thumbnailBtn} ${idx === activeIndex ? styles.activeThumbnail : ""}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1}`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                sizes="76px"
                className={styles.thumbnailImg}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
