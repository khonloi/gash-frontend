import React from 'react';
import type { Metadata } from 'next';
import { CartClientView } from './CartClientView';

export const metadata: Metadata = {
  title: 'Shopping Cart | JOCKSPORT',
  description: 'Review your selected performance sportswear, shoes, and training apparel at JOCKSPORT.',
  openGraph: {
    title: 'Shopping Cart | JOCKSPORT',
    description: 'Review your selected performance sportswear, shoes, and training apparel at JOCKSPORT.',
  },
};

export default function CartPage() {
  return <CartClientView />;
}
