import React from 'react';
import { Skeleton } from '@/components/ui';
import styles from './page.module.css';

export default function CheckoutLoading() {
  return (
    <div className={styles.checkoutPage}>
      <div className="container">
        <div className={styles.checkoutContainer}>
          <div className={styles.leftColumn}>
            <div className={styles.formSkeletonWrapper}>
              <Skeleton className={styles.formTitleSkeleton} />
              <Skeleton className={styles.inputFieldSkeleton} />
              <div className={styles.twoColRow}>
                <Skeleton className={styles.inputFieldSkeleton} />
                <Skeleton className={styles.inputFieldSkeleton} />
              </div>
              <Skeleton className={styles.inputFieldSkeleton} />
              <div className={styles.twoColRow}>
                <Skeleton className={styles.inputFieldSkeleton} />
                <Skeleton className={styles.inputFieldSkeleton} />
              </div>
              <Skeleton className={styles.inputFieldSkeleton} />
              <Skeleton className={styles.buttonSkeleton} />
            </div>
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.summarySkeletonWrapper}>
              <Skeleton className={styles.summaryTitleSkeleton} />
              <Skeleton className={styles.summaryItemSkeleton} />
              <Skeleton className={styles.summaryItemSkeleton} />
              <div className={styles.dividerSkeleton} />
              <Skeleton className={styles.summaryRowSkeleton} />
              <Skeleton className={styles.summaryRowSkeleton} />
              <Skeleton className={styles.summaryTotalSkeleton} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
