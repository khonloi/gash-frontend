import { Metadata } from 'next';
import OrdersClientView from './OrdersClientView';

export const metadata: Metadata = {
  title: 'My Orders | JOCKSPORT',
  description: 'View and track your athletic gear order history at JOCKSPORT.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersPage() {
  return <OrdersClientView />;
}
