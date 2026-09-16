'use client'

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { Button, QuantitySelector, EmptyState } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import styles from "./CartSidebar.module.css";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const mounted = useIsMounted();
  const sidebarRef = useFocusTrap<HTMLElement>(isOpen, onClose);

  if (!mounted) return null;

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
        onClick={onClose}
      />

      <aside
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart Drawer"
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.header}>
          <h2>Shopping Cart</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close cart"
          >
            <X size={24} />
          </Button>
        </div>

        <div className={styles.content}>
          {items.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={48} />}
              title="Your cart is empty"
              description="Your cart is currently empty."
              action={
                <Button onClick={onClose} variant="primary">
                  Continue Shopping
                </Button>
              }
            />
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
                      />
                    ) : (
                      <div className={styles.imagePlaceholder} />
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
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className={styles.itemPrice}>
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotalRow}>
              <span className={styles.subtotalLabel}>Subtotal</span>
              <span className={styles.subtotalValue}>
                {formatPrice(getTotalPrice())}
              </span>
            </div>

            <div className={styles.actions}>
              <Button
                as={Link}
                href="/checkout"
                onClick={onClose}
                variant="primary"
                fullWidth
              >
                Check Out
              </Button>
              <Button
                as={Link}
                href="/cart"
                onClick={onClose}
                variant="outline"
                fullWidth
              >
                View Cart
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
