'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useOrderQuery, useCancelOrderMutation } from '@/hooks/useOrders';
import { useToastStore } from '@/store/useToastStore';
import { Button, Badge, BadgeProps, EmptyState, Skeleton } from '@/components/ui';
import { Order } from '@/types/order';
import styles from './page.module.css';

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'credit_card':
      return 'Credit / Debit Card (Visa, Mastercard, AMEX)';
    case 'apple_pay':
      return 'Apple Pay';
    case 'paypal':
      return 'PayPal';
    case 'cod':
      return 'Cash on Delivery (COD)';
    default:
      return method.replace('_', ' ').toUpperCase();
  }
}

export default function OrderDetailClientView({ orderId }: { orderId: string }) {
  const { data: currentOrder, isLoading, error } = useOrderQuery(orderId);
  const cancelOrderMutation = useCancelOrderMutation();
  const { addToast } = useToastStore();

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

    try {
      await cancelOrderMutation.mutateAsync({ orderId, reason: 'User requested cancellation' });
      addToast('Order cancelled successfully', 'success');
    } catch {
      addToast('Failed to cancel order', 'error');
    }
  };

  if (isLoading) {
    return (
      <main id="main-content" className={`container ${styles.orderDetailPage}`}>
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
      </main>
    );
  }

  if (error || !currentOrder) {
    return (
      <main id="main-content" className={`container ${styles.orderDetailPage}`}>
        <EmptyState
          title="Order Not Found"
          description="We couldn't find the order you're looking for."
          action={
            <Button as={Link} href="/orders">
              Back to Orders
            </Button>
          }
        />
      </main>
    );
  }

  const order = currentOrder;
  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <main id="main-content" className={`container ${styles.orderDetailPage}`}>
      <div className={styles.topBar}>
        <div>
          <Link href="/orders" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
          <div className={styles.headerTitleRow}>
            <h1 className={styles.orderHeading}>Order #{order.orderNumber}</h1>
            <Badge variant={getStatusVariant(order.status)} size="md">
              {order.status}
            </Badge>
          </div>
          <p className={styles.orderDateText}>
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {canCancel && (
          <Button
            variant="destructive"
            onClick={handleCancelOrder}
            isLoading={cancelOrderMutation.isPending}
          >
            Cancel Order
          </Button>
        )}
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.mainColumn}>
          {/* Items List */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Items Ordered</h2>
            <div className={styles.itemsList}>
              {order.items.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <div className={styles.itemImageWrap}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className={styles.itemImagePlaceholder}>No Img</div>
                    )}
                  </div>
                  <div className={styles.itemDetails}>
                    <div>
                      <h3 className={styles.itemTitle}>{item.name}</h3>
                      <p className={styles.itemSku}>SKU: {item.sku}</p>
                      {(item.size || item.color) && (
                        <p className={styles.itemVariant}>
                          {item.color && <span>Color: {item.color}</span>}
                          {item.size && item.color && <span> | </span>}
                          {item.size && <span>Size: {item.size}</span>}
                        </p>
                      )}
                      <p className={styles.itemQty}>Qty: {item.quantity}</p>
                    </div>
                    <div className={styles.itemPriceCol}>
                      ${(item.price * item.quantity).toFixed(2)}
                      {item.quantity > 1 && (
                        <p className={styles.itemUnitPrice}>${item.price.toFixed(2)} each</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation Reason */}
          {order.cancelReason && (
            <div className={styles.cancelReasonBox}>
              <h3 className={styles.cancelReasonTitle}>Cancellation Reason</h3>
              <p>{order.cancelReason}</p>
            </div>
          )}
        </div>

        <div className={styles.sideColumn}>
          {/* Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order Summary</h2>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping ({order.shippingMethod})</span>
                <span>{order.shippingFee > 0 ? `$${order.shippingFee.toFixed(2)}` : 'Free'}</span>
              </div>
              <div className={styles.summaryRowTotal}>
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Payment Info */}
          <div className={styles.card}>
            <div className={styles.infoSection}>
              <h2 className={styles.infoTitle}>Shipping Details</h2>
              <div className={styles.infoText}>
                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {order.shippingAddress.fullName}
                </p>
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

            <div className={styles.infoSection}>
              <h2 className={styles.infoTitle}>Payment Details</h2>
              <div className={styles.infoText}>
                <p>Method: {getPaymentMethodLabel(order.paymentMethod)}</p>
                <p>
                  Status: <span style={{ textTransform: 'capitalize' }}>{order.paymentStatus}</span>
                </p>
              </div>
            </div>

            {(order.contactEmail || order.contactPhone) && (
              <div className={styles.infoSection}>
                <h2 className={styles.infoTitle}>Contact Info</h2>
                <div className={styles.infoText}>
                  {order.contactEmail && <p>{order.contactEmail}</p>}
                  {order.contactPhone && <p>{order.contactPhone}</p>}
                </div>
              </div>
            )}

            {order.notes && (
              <div className={styles.infoSection}>
                <h2 className={styles.infoTitle}>Order Notes</h2>
                <p className={styles.infoText}>{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
