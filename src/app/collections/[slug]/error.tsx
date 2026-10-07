'use client';

import React, { useEffect } from 'react';
import { Layers } from 'lucide-react';
import { ErrorView } from '@/components/ui/ErrorView/ErrorView';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CollectionError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Collection route error boundary caught:', error);
  }, [error]);

  return (
    <ErrorView
      title="Failed to load collection"
      description="We encountered an issue fetching products in this category. Please try again or explore our complete sportswear catalog."
      error={error}
      onRetry={reset}
      retryLabel="Reload Products"
      secondaryAction={{
        label: 'All Collections',
        href: '/collections/all',
        icon: <Layers size={16} />,
      }}
      badgeText="Catalog Error"
    />
  );
}
