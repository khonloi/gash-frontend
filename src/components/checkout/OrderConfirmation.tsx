import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import { OrderConfirmationData } from '@/constants/checkout';
import styles from '@/app/checkout/page.module.css';

export interface OrderConfirmationProps {
  order: OrderConfirmationData;
}

export function OrderConfirmation({ order }: OrderConfirmationProps) {
  return (
    <div className={styles.checkoutPage}>
      <div className="container">
        <div className={styles.confirmationContainer}>
          <div className={styles.confirmBadge}>
            <CheckCircle2 size={36} />
          </div>

          <h1 className={styles.confirmationTitle}>Order Confirmed!</h1>

          <span className={styles.orderNumber}>Order Ref: {order.orderId}</span>

          <p className={styles.confirmationDesc}>
            Thank you, <strong>{order.customerName}</strong>. Your order has been placed and is
            being prepared for shipment.
          </p>

          <div className={styles.orderSummaryBox}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Date:</span>
              <strong>{order.date}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Deliver to:</span>
              <strong>{order.shippingAddress}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Items:</span>
              <strong>{order.itemCount} items</strong>
            </div>
            <div className={styles.summaryTotalRow}>
              <span className={styles.summaryTotalLabel}>Total Paid:</span>
              <strong className={styles.summaryTotalValue}>{formatPrice(order.total)}</strong>
            </div>
          </div>

          <div className={styles.confirmationActions}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" icon={<ArrowRight size={16} />}>
                Continue Shopping
              </Button>
            </Link>
            <Link href="/orders" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="lg" icon={<Package size={16} />}>
                View My Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
