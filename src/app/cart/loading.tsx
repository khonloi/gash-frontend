import React from 'react';
import { Skeleton } from '@/components/ui';
import styles from './page.module.css';

export default function CartLoading() {
  return (
    <div className={styles.cartPage}>
      <div className="container">
        <Skeleton className={styles.breadcrumbSkeleton} />
        <Skeleton className={styles.titleSkeleton} />

        <div className={styles.content}>
          <div className={styles.itemList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.itemSkeleton}>
                <Skeleton className={styles.itemImageSkeleton} />
                <div className={styles.itemDetailsSkeleton}>
                  <Skeleton className={styles.itemCategorySkeleton} />
                  <Skeleton className={styles.itemTitleSkeleton} />
                  <Skeleton className={styles.itemPriceSkeleton} />
                </div>
                <Skeleton className={styles.itemActionSkeleton} />
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <Skeleton className={styles.summarySkeleton} />
          </div>
        </div>
      </div>
    </div>
  );
}
