import { Metadata } from 'next';
import OrderDetailClientView from './OrderDetailClientView';

export const metadata: Metadata = {
  title: 'Order Details | JOCKSPORT',
  description: 'View details of your athletic gear order at JOCKSPORT.',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailClientView orderId={id} />;
}
