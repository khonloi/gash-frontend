'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useOrderStore } from '@/store/useOrderStore';
import { useToastStore } from '@/store/useToastStore';
import { Button, Badge, BadgeProps, Skeleton } from '@/components/ui';
import { Order } from '@/types/order';
import styles from './page.module.css';

export default function OrderDetailClientView({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { currentOrder, loading, error, fetchOrderById, cancelOrder, clearCurrentOrder } =
    useOrderStore();
  const { addToast } = useToastStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchOrderById(orderId)
      .catch(() => {
        addToast('Failed to load order details', 'error');
      })
      .finally(() => setIsInitializing(false));

    return () => {
      clearCurrentOrder();
    };
  }, [orderId, fetchOrderById, clearCurrentOrder, addToast]);

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

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setIsCancelling(true);
    try {
      await cancelOrder(orderId, 'User requested cancellation');
      addToast('Order cancelled successfully', 'success');
    } catch {
      addToast('Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isInitializing || loading) {
    return (
      <div className={`container ${styles.orderDetailPage}`}>
        <Skeleton className={styles.headerSkeleton} />
        <div className={styles.detailsGrid}>
          <div className={styles.mainColumn}>
            <Skeleton className={styles.orderHeaderSkeleton} />
            <Skeleton className={styles.orderItemsSkeleton} />
          </div>
          <div>
            <Skeleton className={styles.orderSummarySkeleton} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentOrder) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <p className="text-muted-foreground mb-8">
          We couldn&apos;t find the order you&apos;re looking for.
        </p>
        <Button onClick={() => router.push('/orders')}>Back to Orders</Button>
      </div>
    );
  }

  const order = currentOrder;
  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <Link
            href="/orders"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
            <Badge variant={getStatusVariant(order.status)} className="capitalize text-sm">
              {order.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {canCancel && (
          <Button variant="destructive" onClick={handleCancelOrder} disabled={isCancelling}>
            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Items List */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Items Ordered</h2>
            <div className="space-y-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 border-b last:border-0 pb-6 last:pb-0">
                  <div className="w-24 h-24 bg-muted rounded-md overflow-hidden relative flex-shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex justify-between">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      {(item.size || item.color) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.color && <span>Color: {item.color}</span>}
                          {item.size && item.color && <span> | </span>}
                          {item.size && <span>Size: {item.size}</span>}
                        </p>
                      )}
                      <p className="text-sm font-medium mt-2">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-semibold text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground font-normal mt-1">
                          ${item.price.toFixed(2)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation Reason */}
          {order.cancelReason && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-6">
              <h3 className="font-semibold mb-1">Cancellation Reason</h3>
              <p className="text-sm">{order.cancelReason}</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Summary */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping ({order.shippingMethod})</span>
                <span>{order.shippingFee > 0 ? `$${order.shippingFee.toFixed(2)}` : 'Free'}</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Payment Info */}
          <div className="bg-card border rounded-xl p-6 space-y-6">
            <div>
              <h2 className="font-semibold mb-2">Shipping Details</h2>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
                  {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ''}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Payment Details</h2>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Method: <span className="uppercase">{order.paymentMethod.replace('_', ' ')}</span>
                </p>
                <p>
                  Status: <span className="capitalize">{order.paymentStatus}</span>
                </p>
              </div>
            </div>

            {(order.contactEmail || order.contactPhone) && (
              <div>
                <h2 className="font-semibold mb-2">Contact Info</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  {order.contactEmail && <p>{order.contactEmail}</p>}
                  {order.contactPhone && <p>{order.contactPhone}</p>}
                </div>
              </div>
            )}

            {order.notes && (
              <div>
                <h2 className="font-semibold mb-2">Order Notes</h2>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
