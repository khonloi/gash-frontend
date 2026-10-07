'use client';

import React, { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { ErrorView } from '@/components/ui/ErrorView/ErrorView';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CartError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Cart route error boundary caught:', error);
  }, [error]);

  return (
    <ErrorView
      title="Unable to load your shopping cart"
      description="We couldn't retrieve your current basket items. Your selections are safely preserved—try reloading or continue browsing athletic gear."
      error={error}
      onRetry={reset}
      retryLabel="Reload Cart"
      secondaryAction={{
        label: 'Browse Collections',
        href: '/collections/all',
        icon: <ShoppingBag size={16} />,
      }}
      badgeText="Cart Error"
    />
  );
}
