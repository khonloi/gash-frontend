'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Button, QuantitySelector, EmptyState, Skeleton } from '@/components/ui';
import styles from './page.module.css';

export function CartClientView() {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } =
    useCartStore();
  const mounted = useIsMounted();

  // SSR & Hydration Loading Skeleton
  if (!mounted) {
    return (
      <div className={styles.cartPage}>
        <div className="container">
          <div style={{ marginBottom: '1.5rem', width: '160px' }}>
            <Skeleton width="160px" height="20px" />
          </div>
          <div style={{ marginBottom: '2rem', width: '220px' }}>
            <Skeleton width="220px" height="36px" />
          </div>

          <div className={styles.content}>
            <div className={styles.itemList}>
              {[1, 2].map((i) => (
                <div key={i} className={styles.item} style={{ gap: '1.5rem' }}>
                  <Skeleton width="120px" height="120px" borderRadius="8px" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <Skeleton width="100px" height="16px" />
                    <Skeleton width="80%" height="22px" />
                    <Skeleton width="60px" height="16px" />
                  </div>
                  <Skeleton width="80px" height="24px" />
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <Skeleton width="100%" height="320px" borderRadius="10px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <div className={styles.cartPage}>
      <div className="container">
        <Link href="/" className={styles.continueShopping}>
          ← Continue Shopping
        </Link>
        <h1 className={styles.title}>Shopping Cart</h1>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={64} />}
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet."
            action={
              <Button as={Link} href="/" variant="primary" size="lg">
                Shop Now
              </Button>
            }
          />
        ) : (
          <div className={styles.content}>
            {/* Left Column: Cart Items */}
            <div className={styles.itemList}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="120px"
                    />
                  </div>

                  <div className={styles.itemDetails}>
                    <div className={styles.itemBrand}>{item.brand}</div>
                    <div className={styles.itemName}>{item.title}</div>
                    <div className={styles.itemOptions}>
                      {item.color && <span>{item.color}</span>}
                      {item.color && item.size && <span> / </span>}
                      {item.size && <span>{item.size}</span>}
                    </div>
                  </div>

                  <div className={styles.itemUnitPrice}>
                    ${item.price.toFixed(2)}
                  </div>

                  <div className={styles.quantityWrapper}>
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(newQty) => updateQuantity(item.id, newQty)}
                      size="sm"
                    />
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => removeItem(item.id)}
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.itemTotal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary */}
            <div className={styles.summary}>
              <div className={styles.promoBanner}>
                <h3>REGISTER NOW | RECEIVE</h3>
                <p>
                  A <span className={styles.promoHighlight}>$10 VOUCHER</span>{' '}
                  FOR YOUR FIRST ORDER
                </p>
              </div>

              <div className={styles.summaryContent}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>
                    ({totalItems}) items
                  </span>
                  <span className={styles.summaryValue}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Discount</span>
                  <span className={styles.summaryHint}>
                    Applied at checkout
                  </span>
                </div>

                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Shipping fee</span>
                  <span className={styles.summaryHint}>
                    Calculated at checkout
                  </span>
                </div>

                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span className={styles.totalLabel}>Total:</span>
                  <span className={styles.totalValue}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <Link href="/checkout" className={styles.checkoutLink}>
                  <Button variant="primary" size="lg" fullWidth>
                    Proceed to Checkout
                  </Button>
                </Link>

                <div className={styles.trustBadges}>
                  <div className={styles.badgeItem}>
                    <span>🔒</span> 100% Secure Checkout
                  </div>
                  <div className={styles.badgeItem}>
                    <span>⚡</span> Express Delivery Available
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
