import React from 'react';
import Image from 'next/image';
import { CartItem } from '@/store/useCartStore';
import { Button, Input } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import styles from '@/app/checkout/page.module.css';

export interface CheckoutSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

export function CheckoutSummary({
  items,
  subtotal,
  shippingFee,
  total,
}: CheckoutSummaryProps) {
  return (
    <div className={styles.rightColumn}>
      <div className={styles.summaryItems}>
        {items.map((item) => (
          <div key={item.id} className={styles.summaryItem}>
            <div className={styles.itemImageWrap}>
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="64px"
                  className={styles.itemImage}
                />
              ) : (
                <div className={styles.imagePlaceholder} />
              )}
              <span className={styles.itemBadge}>{item.quantity}</span>
            </div>
            <div className={styles.itemDetails}>
              <span className={styles.itemTitle}>{item.title}</span>
              <span className={styles.itemVariant}>
                {item.color} {item.size && `/ ${item.size}`}
              </span>
            </div>
            <span className={styles.itemPrice}>
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Discount Code */}
      <div className={styles.discountForm}>
        <label htmlFor="discount" className="sr-only">
          Discount code
        </label>
        <Input
          id="discount"
          type="text"
          placeholder="Discount code"
          inputSize="md"
          className={styles.discountInput}
        />
        <Button type="button" variant="outline" size="md">
          Apply
        </Button>
      </div>

      {/* Totals */}
      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <span className={styles.totalValue}>{formatPrice(subtotal)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Shipping</span>
          <span className={styles.totalValue}>
            {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
          </span>
        </div>
        <div className={`${styles.totalRow} ${styles.final}`}>
          <span>Total</span>
          <span className={styles.totalValue}>
            <span className={styles.totalCurrency}>USD</span>
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
