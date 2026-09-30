import React from 'react';
import { Skeleton } from '@/components/ui';
import styles from './page.module.css';

export default function CollectionLoading() {
  return (
    <main className={styles.pageContainer}>
      <div className="container">
        {/* Breadcrumb skeleton */}
        <div className={styles.breadcrumbSkeleton}>
          <Skeleton className={styles.breadcrumbItemSmall} />
          <Skeleton className={styles.breadcrumbSeparator} />
          <Skeleton className={styles.breadcrumbItemMedium} />
          <Skeleton className={styles.breadcrumbSeparator} />
          <Skeleton className={styles.breadcrumbItemCurrent} />
        </div>

        {/* Collection Hero Skeleton */}
        <div className={`${styles.hero} ${styles.heroSkeleton}`}>
          <Skeleton className={styles.heroTitleSkeleton} />
          <Skeleton className={styles.heroDescSkeleton} />
        </div>

        {/* Content Layout */}
        <div className={styles.contentLayout}>
          {/* Sidebar Skeleton */}
          <div className={`${styles.sidebarWrapper} ${styles.sidebarSkeleton}`}>
            <Skeleton className={styles.sidebarTitleSkeleton} />
            <Skeleton className={styles.sidebarSectionSkeleton} />
            <Skeleton className={styles.sidebarSectionSkeleton} />
            <Skeleton className={styles.sidebarSectionSkeleton} />
          </div>

          {/* Main Content Skeleton */}
          <div className={styles.mainContent}>
            {/* Control Bar Skeleton */}
            <div className={styles.controlBarSkeleton}>
              <Skeleton className={styles.controlBarFilterBtnSkeleton} />
              <Skeleton className={styles.controlBarSortSkeleton} />
            </div>

            {/* Product Grid Skeleton */}
            <div className={styles.productGrid}>
              {Array.from({ length: 9 }).map((_, idx) => (
                <div key={idx} className={styles.productCardSkeleton}>
                  <Skeleton className={styles.cardImageSkeleton} />
                  <Skeleton className={styles.cardCategorySkeleton} />
                  <Skeleton className={styles.cardTitleSkeleton} />
                  <Skeleton className={styles.cardPriceSkeleton} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
