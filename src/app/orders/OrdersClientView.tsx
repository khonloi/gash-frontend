'use client';

import Link from 'next/link';
import { useMyOrdersQuery } from '@/hooks/useOrders';
import { SectionHeading, Button, Badge, EmptyState, Skeleton } from '@/components/ui';
import { formatDate, formatPrice, getOrderStatusVariant } from '@/lib/format';
import styles from './page.module.css';

export default function OrdersClientView() {
  const { data, isLoading } = useMyOrdersQuery();
  const orders = data?.orders ?? [];

  if (isLoading) {
    return (
      <main id="main-content" className={`container ${styles.ordersPage}`}>
        <SectionHeading as="h1">My Orders</SectionHeading>
        <Skeleton className={styles.subtitleSkeleton} />
        <div className={styles.orderListSkeleton}>
          <Skeleton className={styles.orderCardSkeleton} />
          <Skeleton className={styles.orderCardSkeleton} />
          <Skeleton className={styles.orderCardSkeleton} />
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main id="main-content" className={`container ${styles.ordersPage}`}>
        <EmptyState
          title="No Orders Found"
          description="You haven't placed any orders yet."
          action={
            <Button as={Link} href="/collections/all">
              Start Shopping
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main id="main-content" className={`container ${styles.ordersPage}`}>
      <SectionHeading as="h1">My Orders</SectionHeading>
      <p className={styles.subtitle}>View and track your recent orders.</p>

      <div className={styles.orderList}>
        {orders.map((order) => (
          <div key={order._id} className={styles.orderCard}>
            <div className={styles.orderInfo}>
              <div className={styles.orderHeaderRow}>
                <h3 className={styles.orderNumber}>Order #{order.orderNumber}</h3>
                <Badge variant={getOrderStatusVariant(order.status)} className={styles.statusBadge}>
                  {order.status}
                </Badge>
              </div>
              <p className={styles.orderDate}>Placed on {formatDate(order.createdAt)}</p>
              <p className={styles.orderMeta}>
                Total: {formatPrice(order.total)} ({order.items.length} items)
              </p>
            </div>

            <Button as={Link} href={`/orders/${order._id}`} variant="outline" size="sm">
              View Details
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
