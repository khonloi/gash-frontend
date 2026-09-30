import { Metadata } from 'next';
import OrdersClientView from './OrdersClientView';

export const metadata: Metadata = {
  title: 'My Orders | JOCKSPORT',
  description: 'View and track your athletic gear order history at JOCKSPORT.',
};

export default function OrdersPage() {
  return <OrdersClientView />;
}
