import React from 'react';
import { Skeleton } from '@/components/ui';
import styles from './page.module.css';

export default function ProductDetailLoading() {
  return (
    <main className={styles.pageContainer}>
      <div className="container">
        {/* Breadcrumb skeleton */}
        <div className={styles.breadcrumbSkeleton}>
          <Skeleton className={styles.breadcrumbItemSmall} />
          <Skeleton className={styles.breadcrumbSeparator} />
          <Skeleton className={styles.breadcrumbItemMedium} />
          <Skeleton className={styles.breadcrumbSeparator} />
          <Skeleton className={styles.breadcrumbItemLarge} />
        </div>

        {/* 2-column top section */}
        <div className={styles.productTopSection}>
          <div className={styles.galleryWrapper}>
            <Skeleton className={styles.galleryMainImageSkeleton} />
            <div className={styles.galleryThumbnailsSkeleton}>
              <Skeleton className={styles.galleryThumbnailItemSkeleton} />
              <Skeleton className={styles.galleryThumbnailItemSkeleton} />
              <Skeleton className={styles.galleryThumbnailItemSkeleton} />
            </div>
          </div>

          <div className={`${styles.infoWrapper} ${styles.infoSkeleton}`}>
            <Skeleton className={styles.infoCategorySkeleton} />
            <Skeleton className={styles.infoTitleSkeleton} />
            <Skeleton className={styles.infoPriceSkeleton} />
            <div className={styles.swatchesSkeleton}>
              <Skeleton className={styles.infoSwatchItemSkeleton} />
              <Skeleton className={styles.infoSwatchItemSkeleton} />
              <Skeleton className={styles.infoSwatchItemSkeleton} />
            </div>
            <div className={styles.sizesGridSkeleton}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className={styles.infoSizeItemSkeleton} />
              ))}
            </div>
            <Skeleton className={styles.infoButtonSkeleton} />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className={styles.tabsSkeleton}>
          <Skeleton className={styles.tabsContentSkeleton} />
        </div>
      </div>
    </main>
  );
}
