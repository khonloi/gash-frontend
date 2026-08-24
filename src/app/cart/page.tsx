"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { Button, QuantitySelector, EmptyState } from "@/components/ui";
import styles from "./page.module.css";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } =
    useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={styles.cartPage}>
        <div className="container" />
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
                  A <span className={styles.promoHighlight}>$10 VOUCHER</span>{" "}
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

                <div className={styles.checkoutBtnWrap}>
                  <Button
                    as={Link}
                    href="/checkout"
                    variant="primary"
                    size="lg"
                    fullWidth
                  >
                    Check Out
                  </Button>
                </div>

                <div className={styles.checkoutNotice}>
                  *Shipping fee and voucher applied at checkout
                </div>

                <div className={styles.paymentMethods}>
                  <div className={styles.paymentTitle}>Fast checkout with:</div>
                  <div className={styles.paymentIcons}>
                    <span className={styles.paymentVisa}>VISA</span>
                    <span className={styles.paymentMastercard}>MasterCard</span>
                    <span className={styles.paymentPaypal}>PayPal</span>
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
