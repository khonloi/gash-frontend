'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Button, QuantitySelector, EmptyState, Skeleton } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import styles from './page.module.css';

export function CartClientView() {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();
  const mounted = useIsMounted();

  // SSR & Hydration Loading Skeleton
  if (!mounted) {
    return (
      <div className={styles.cartPage}>
        <div className="container">
          <Skeleton className={styles.breadcrumbSkeleton} />
          <Skeleton className={styles.titleSkeleton} />

          <div className={styles.content}>
            <div className={styles.itemList}>
              {[1, 2].map((i) => (
                <div key={i} className={styles.itemSkeleton}>
                  <Skeleton className={styles.itemImageSkeleton} />
                  <div className={styles.itemDetailsSkeleton}>
                    <Skeleton className={styles.itemCategorySkeleton} />
                    <Skeleton className={styles.itemTitleSkeleton} />
                    <Skeleton className={styles.itemPriceSkeleton} />
                  </div>
                  <Skeleton className={styles.itemActionSkeleton} />
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <Skeleton className={styles.summarySkeleton} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <main id="main-content" className={styles.cartPage}>
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
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill sizes="120px" />
                    ) : (
                      <div className={styles.imagePlaceholder} />
                    )}
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

                  <div className={styles.itemUnitPrice}>{formatPrice(item.price)}</div>

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

                  <div className={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary */}
            <div className={styles.summary}>
              <div className={styles.promoBanner}>
                <h3>REGISTER NOW | RECEIVE</h3>
                <p>
                  A <span className={styles.promoHighlight}>$10 VOUCHER</span> FOR YOUR FIRST ORDER
                </p>
              </div>

              <div className={styles.summaryContent}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>({totalItems}) items</span>
                  <span className={styles.summaryValue}>{formatPrice(subtotal)}</span>
                </div>

                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Discount</span>
                  <span className={styles.summaryHint}>Applied at checkout</span>
                </div>

                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Shipping fee</span>
                  <span className={styles.summaryHint}>Calculated at checkout</span>
                </div>

                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span className={styles.totalLabel}>Total:</span>
                  <span className={styles.totalValue}>{formatPrice(subtotal)}</span>
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
    </main>
  );
}
