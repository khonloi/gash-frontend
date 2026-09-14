import React from 'react';
import { Skeleton } from '@/components/ui';
import styles from './page.module.css';

export default function CollectionLoading() {
  return (
    <main className={styles.pageContainer}>
      <div className="container">
        {/* Breadcrumb skeleton */}
        <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.5rem' }}>
          <Skeleton width="60px" height="16px" />
          <Skeleton width="10px" height="16px" />
          <Skeleton width="100px" height="16px" />
          <Skeleton width="10px" height="16px" />
          <Skeleton width="80px" height="16px" />
        </div>

        {/* Collection Hero Skeleton */}
        <div className={styles.hero} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton width="260px" height="40px" />
          <Skeleton width="60%" height="20px" />
        </div>

        {/* Content Layout */}
        <div className={styles.contentLayout}>
          {/* Sidebar Skeleton */}
          <div className={styles.sidebarWrapper} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Skeleton width="100%" height="40px" borderRadius="4px" />
            <Skeleton width="100%" height="180px" borderRadius="6px" />
            <Skeleton width="100%" height="180px" borderRadius="6px" />
            <Skeleton width="100%" height="180px" borderRadius="6px" />
          </div>

          {/* Main Content Skeleton */}
          <div className={styles.mainContent}>
            {/* Control Bar Skeleton */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="140px" height="36px" borderRadius="4px" />
              <Skeleton width="180px" height="36px" borderRadius="4px" />
            </div>

            {/* Product Grid Skeleton */}
            <div className={styles.productGrid}>
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    backgroundColor: 'var(--color-white)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Skeleton width="100%" height="220px" borderRadius="4px" />
                  <Skeleton width="40%" height="14px" />
                  <Skeleton width="90%" height="18px" />
                  <Skeleton width="50%" height="20px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
