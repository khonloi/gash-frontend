'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button, Drawer, QuantitySelector, EmptyState } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import styles from './CartSidebar.module.css';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const totalItemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  const title = (
    <span className={styles.headerTitleGroup}>
      <span>Shopping Cart</span>
      {totalItemCount > 0 && (
        <span className={styles.countBadge} aria-label={`${totalItemCount} items in cart`}>
          {totalItemCount}
        </span>
      )}
    </span>
  );

  const footer =
    items.length > 0 ? (
      <div className={styles.footerContent}>
        <div className={styles.subtotalRow}>
          <span className={styles.subtotalLabel}>Subtotal</span>
          <span className={`${styles.subtotalValue} tabular-nums`}>{formatPrice(totalPrice)}</span>
        </div>

        <div className={styles.actions}>
          <Button
            as={Link}
            href="/checkout"
            onClick={onClose}
            variant="primary"
            shape="rounded"
            fullWidth
          >
            Check Out
          </Button>
          <Button
            as={Link}
            href="/cart"
            onClick={onClose}
            variant="outline"
            shape="rounded"
            fullWidth
          >
            View Cart
          </Button>
        </div>
      </div>
    ) : undefined;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="sm"
      className={styles.sidebar}
      bodyClassName={styles.content}
      footerClassName={styles.footer}
      closeLabel="Close cart"
      ariaLabel="Shopping Cart Drawer"
    >
      {items.length === 0 ? (
        <div className={styles.emptyContainer}>
          <EmptyState
            variant="ghost"
            size="sm"
            icon={<ShoppingBag size={48} className={styles.emptyIcon} />}
            title="Your cart is empty"
            description="Looks like you haven't added any gear to your cart yet."
            action={
              <Button onClick={onClose} variant="primary" shape="rounded">
                Continue Shopping
              </Button>
            }
          />
        </div>
      ) : (
        <div className={styles.itemList}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemImage}>
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className={styles.thumbImage}
                  />
                ) : (
                  <div className={styles.imagePlaceholder} aria-hidden="true">
                    <ShoppingBag size={24} className={styles.placeholderIcon} />
                  </div>
                )}
              </div>

              <div className={styles.itemDetails}>
                <div>
                  <div className={styles.itemBrand}>{item.brand}</div>
                  <div className={styles.itemName}>{item.title}</div>
                  <div className={styles.itemOptions}>
                    {item.color && <span>{item.color}</span>}
                    {item.color && item.size && <span> / </span>}
                    {item.size && <span>{item.size}</span>}
                  </div>
                </div>

                <div className={styles.itemActions}>
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
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className={`${styles.itemPrice} tabular-nums`}>
                    {formatPrice(item.price)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
