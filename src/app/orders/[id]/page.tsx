import { Metadata } from 'next';
import OrderDetailClientView from './OrderDetailClientView';

export const metadata: Metadata = {
  title: 'Order Details | Gash',
  description: 'View details of your order',
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailClientView orderId={params.id} />;
}
