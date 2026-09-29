'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui';
import styles from './error.module.css';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log runtime error to console (or telemetry service)
    console.error('App runtime error boundary caught:', error);
  }, [error]);

  const handleRetry = () => {
    if (typeof reset === 'function') {
      reset();
    }
  };

  return (
    <main className={styles.errorMain}>
      <div className={styles.errorCard}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={32} />
        </div>

        <h1 className={styles.errorTitle}>Something went wrong</h1>

        <p className={styles.errorDescription}>
          We encountered an unexpected glitch while loading this athletic gear. Please try again or
          head back to the store.
        </p>

        {error.digest && <p className={styles.errorDigest}>Error ID: {error.digest}</p>}

        <div className={styles.errorActions}>
          <Button variant="primary" onClick={handleRetry} icon={<RotateCcw size={16} />}>
            Try Again
          </Button>

          <Link href="/" className={styles.linkReset}>
            <Button variant="outline" icon={<Home size={16} />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
