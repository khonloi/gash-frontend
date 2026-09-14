import React from 'react';
import { Skeleton } from '@/components/ui';

export default function RootLoading() {
  return (
    <main style={{ paddingBottom: '4rem' }}>
      {/* Hero Banner Skeleton */}
      <div style={{ width: '100%', height: '480px', backgroundColor: 'var(--color-bg-muted)' }}>
        <Skeleton width="100%" height="100%" borderRadius="0" />
      </div>

      <div className="container" style={{ marginTop: '3rem' }}>
        {/* Section Heading Skeleton */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="220px" height="32px" />
          <Skeleton width="160px" height="18px" />
        </div>

        {/* Product Cards Grid Skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {Array.from({ length: 10 }).map((_, idx) => (
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
    </main>
  );
}
