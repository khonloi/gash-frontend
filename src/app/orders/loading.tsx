import React from 'react';
import { SectionHeading, Skeleton } from '@/components/ui';
import styles from './page.module.css';

export default function OrdersLoading() {
  return (
    <div className={`container ${styles.ordersPage}`}>
      <SectionHeading as="h1">My Orders</SectionHeading>
      <Skeleton className={styles.subtitleSkeleton} />
      <div className={styles.orderListSkeleton}>
        <Skeleton className={styles.orderCardSkeleton} />
        <Skeleton className={styles.orderCardSkeleton} />
        <Skeleton className={styles.orderCardSkeleton} />
      </div>
    </div>
  );
}
