'use client';

import React, { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { ErrorView } from '@/components/ui/ErrorView/ErrorView';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Product route error boundary caught:', error);
  }, [error]);

  return (
    <ErrorView
      title="Product details unavailable"
      description="We couldn't retrieve the specifications, images, and pricing for this product. Please try refreshing or explore other athletic gear."
      error={error}
      onRetry={reset}
      retryLabel="Reload Product"
      secondaryAction={{
        label: 'Browse Collections',
        href: '/collections/all',
        icon: <ShoppingBag size={16} />,
      }}
      badgeText="Product Error"
    />
  );
}
