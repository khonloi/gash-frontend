import React from 'react';
import type { Metadata } from 'next';
import { CheckoutClientView } from './CheckoutClientView';

export const metadata: Metadata = {
  title: 'Checkout | JOCKSPORT',
  description: 'Complete your athletic sportswear purchase securely with JOCKSPORT.',
  openGraph: {
    title: 'Checkout | JOCKSPORT',
    description: 'Complete your athletic sportswear purchase securely with JOCKSPORT.',
  },
};

export default function CheckoutPage() {
  return <CheckoutClientView />;
}
