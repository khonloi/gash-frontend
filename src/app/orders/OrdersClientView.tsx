'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrderStore } from '@/store/useOrderStore';
import { SectionHeading, Button, Badge, BadgeProps, EmptyState, Skeleton } from '@/components/ui';
import { Order } from '@/types/order';
import styles from './page.module.css';

export default function OrdersClientView() {
  const { orders, loading, fetchMyOrders } = useOrderStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    fetchMyOrders().finally(() => setIsInitialized(true));
  }, [fetchMyOrders]);

  const getStatusVariant = (status: Order['status']): BadgeProps['variant'] => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'confirmed':
      case 'processing':
        return 'primary';
      case 'shipped':
        return 'secondary';
      case 'delivered':
        return 'success';
      case 'cancelled':
      case 'refunded':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading && !isInitialized) {
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
                <Badge variant={getStatusVariant(order.status)} className={styles.statusBadge}>
                  {order.status}
                </Badge>
              </div>
              <p className={styles.orderDate}>
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className={styles.orderMeta}>
                Total: ${order.total.toFixed(2)} ({order.items.length} items)
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
