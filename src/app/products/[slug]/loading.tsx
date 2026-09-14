import React from 'react';
import { Skeleton } from '@/components/ui';
import styles from './page.module.css';

export default function ProductDetailLoading() {
  return (
    <main className={styles.pageContainer}>
      <div className="container">
        {/* Breadcrumb skeleton */}
        <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem' }}>
          <Skeleton width="60px" height="16px" />
          <Skeleton width="10px" height="16px" />
          <Skeleton width="80px" height="16px" />
          <Skeleton width="10px" height="16px" />
          <Skeleton width="180px" height="16px" />
        </div>

        {/* 2-column top section */}
        <div className={styles.productTopSection}>
          <div className={styles.galleryWrapper}>
            <Skeleton width="100%" height="520px" borderRadius="12px" />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <Skeleton width="76px" height="76px" borderRadius="6px" />
              <Skeleton width="76px" height="76px" borderRadius="6px" />
              <Skeleton width="76px" height="76px" borderRadius="6px" />
            </div>
          </div>

          <div className={styles.infoWrapper} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Skeleton width="120px" height="16px" />
            <Skeleton width="85%" height="38px" />
            <Skeleton width="35%" height="32px" />
            <div style={{ display: 'flex', gap: '0.75rem', margin: '0.5rem 0' }}>
              <Skeleton width="56px" height="56px" borderRadius="6px" />
              <Skeleton width="56px" height="56px" borderRadius="6px" />
              <Skeleton width="56px" height="56px" borderRadius="6px" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} width="100%" height="44px" borderRadius="6px" />
              ))}
            </div>
            <Skeleton width="100%" height="54px" borderRadius="8px" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div style={{ marginTop: '3rem' }}>
          <Skeleton width="100%" height="240px" borderRadius="8px" />
        </div>
      </div>
    </main>
  );
}
