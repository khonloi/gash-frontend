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
      <div className={`container ${styles.ordersPage}`}>
        <SectionHeading as="h1">My Orders</SectionHeading>
        <Skeleton className={styles.subtitleSkeleton} />
        <div className={styles.orderListSkeleton}>
          <Skeleton className={styles.orderCardSkeleton} />
          <Skeleton className={styles.orderCardSkeleton} />
          <Skeleton className={styles.orderCardSkeleton} />
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <EmptyState
          title="No Orders Found"
          description="You haven't placed any orders yet."
          action={
            <Link href="/products">
              <Button>Start Shopping</Button>
            </Link>
          }
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <SectionHeading as="h1">My Orders</SectionHeading>
      <p className="text-muted-foreground -mt-4 mb-8">View and track your recent orders.</p>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-6 border rounded-xl bg-card"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                <Badge variant={getStatusVariant(order.status)} className="capitalize">
                  {order.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm font-medium">
                Total: ${order.total.toFixed(2)} ({order.items.length} items)
              </p>
            </div>

            <Link href={`/orders/${order._id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
