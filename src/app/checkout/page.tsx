import React from 'react';
import type { Metadata } from 'next';
import { CheckoutClientView } from './CheckoutClientView';

export const metadata: Metadata = {
  title: 'Checkout | JOCKSPORT',
  description: 'Complete your athletic sportswear purchase securely with JOCKSPORT.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Checkout | JOCKSPORT',
    description: 'Complete your athletic sportswear purchase securely with JOCKSPORT.',
  },
};

export default function CheckoutPage() {
  return <CheckoutClientView />;
}
