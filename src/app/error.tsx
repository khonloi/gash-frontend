'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui';

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
    <main
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        backgroundColor: 'var(--color-bg-light)',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: 'var(--color-white)',
          padding: '2.5rem 2rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 30px rgba(12, 28, 48, 0.08)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--color-sale-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <AlertTriangle size={32} />
        </div>

        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--color-navy)',
            lineHeight: 1.2,
          }}
        >
          Something went wrong
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            margin: '0',
          }}
        >
          We encountered an unexpected glitch while loading this athletic gear.
          Please try again or head back to the store.
        </p>

        {error.digest && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-bg-muted)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            width: '100%',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="primary"
            onClick={handleRetry}
            icon={<RotateCcw size={16} />}
          >
            Try Again
          </Button>

          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button
              variant="outline"
              icon={<Home size={16} />}
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
