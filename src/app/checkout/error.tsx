'use client';

import React, { useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { ErrorView } from '@/components/ui/ErrorView/ErrorView';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CheckoutError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Checkout route error boundary caught:', error);
  }, [error]);

  return (
    <ErrorView
      title="Checkout session interrupted"
      description="An unexpected issue occurred while preparing your checkout. Rest assured, no payment or card was charged. You can safely try again or return to your cart."
      error={error}
      onRetry={reset}
      retryLabel="Retry Checkout"
      secondaryAction={{
        label: 'Return to Cart',
        href: '/cart',
        icon: <ShoppingCart size={16} />,
      }}
      badgeText="Checkout Error"
    />
  );
}
