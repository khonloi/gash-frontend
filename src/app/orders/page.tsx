import { Metadata } from 'next';
import OrdersClientView from './OrdersClientView';

export const metadata: Metadata = {
  title: 'My Orders | Gash',
  description: 'View your order history',
};

export default function OrdersPage() {
  return <OrdersClientView />;
}
