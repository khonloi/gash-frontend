"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/Button/Button";
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
          &lt; Continue Shopping
        </Link>
        <h1 className={styles.title}>Shopping Cart</h1>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingBag
              size={64}
              style={{ color: "var(--color-border)", marginBottom: "1rem" }}
            />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link href="/">
              <Button variant="primary">Shop Now</Button>
            </Link>
          </div>
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

                  <div className={styles.quantityControl}>
                    <button
                      className={styles.quantityBtn}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className={styles.quantity}>{item.quantity}</span>
                    <button
                      className={styles.quantityBtn}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className={styles.itemPriceControls}>
                    <div>
                      <div className={styles.itemTotal}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
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
                  <span
                    className={styles.summaryLabel}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Applied at checkout
                  </span>
                </div>

                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Shipping fee</span>
                  <span
                    className={styles.summaryLabel}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Calculated at checkout
                  </span>
                </div>

                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span className={styles.totalLabel}>Total:</span>
                  <span className={styles.totalValue}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  style={{
                    width: "100%",
                    display: "block",
                    marginTop: "var(--space-6)",
                  }}
                >
                  <Button variant="primary" style={{ width: "100%" }}>
                    Check Out
                  </Button>
                </Link>

                <div
                  style={{
                    textAlign: "center",
                    marginTop: "0.5rem",
                    fontSize: "0.75rem",
                    color: "var(--color-sale-red)",
                  }}
                >
                  *Shipping fee and voucher applied at checkout
                </div>

                <div className={styles.paymentMethods}>
                  <div className={styles.paymentTitle}>Fast checkout with:</div>
                  <div className={styles.paymentIcons}>
                    {/* Placeholders for payment icons */}
                    <span style={{ fontWeight: "bold", color: "#003087" }}>
                      VISA
                    </span>
                    <span style={{ fontWeight: "bold", color: "#EB001B" }}>
                      MasterCard
                    </span>
                    <span style={{ fontWeight: "bold", color: "#0079C1" }}>
                      PayPal
                    </span>
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
