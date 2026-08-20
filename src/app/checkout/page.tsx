"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import styles from "./page.module.css";

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = getTotalPrice();
  const shippingFee = subtotal > 0 && shippingMethod === "standard" ? 30 : 0;
  const total = subtotal + shippingFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (!mounted) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyDesc}>Loading checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <div className="container">
          <div className={styles.emptyState}>
            <ShoppingBag size={64} className={styles.emptyIcon} />
            <h1 className={styles.emptyTitle}>Your cart is empty</h1>
            <p className={styles.emptyDesc}>
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link href="/" className={styles.continueShoppingBtn}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className="container">
        <div className={styles.checkoutContainer}>
          {/* Left Column - Forms */}
          <div className={styles.leftColumn}>
            {/* Breadcrumb */}
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <Link href="/cart" style={{ color: "var(--color-text)" }}>
                Cart
              </Link>
              <ChevronRight size={14} />
              <span style={{ fontWeight: 500, color: "var(--color-text)" }}>
                Information
              </span>
              <ChevronRight size={14} />
              <span>Shipping</span>
              <ChevronRight size={14} />
              <span>Payment</span>
            </div>

            {/* Contact Info */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact Information</h2>
              <div className={styles.inputGroup}>
                <input
                  type="email"
                  placeholder="Email or mobile phone number"
                  className={styles.input}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.875rem",
                    marginTop: "8px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                  Keep me up to date on news and exclusive offers
                </label>
              </div>
            </section>

            {/* Shipping Address */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Shipping Address</h2>
              <div className={styles.formGrid}>
                <div
                  className={styles.inputGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <input
                    type="text"
                    placeholder="Country/Region"
                    defaultValue="Vietnam"
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    placeholder="First Name"
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    placeholder="Last Name"
                    className={styles.input}
                  />
                </div>
                <div
                  className={styles.inputGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <input
                    type="text"
                    placeholder="Address"
                    className={styles.input}
                  />
                </div>
                <div
                  className={styles.inputGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <input
                    type="text"
                    placeholder="Apartment, suite, etc. (optional)"
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    placeholder="City"
                    className={styles.input}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    placeholder="Postal Code"
                    className={styles.input}
                  />
                </div>
                <div
                  className={styles.inputGroup}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <input
                    type="tel"
                    placeholder="Phone"
                    className={styles.input}
                  />
                </div>
              </div>
            </section>

            {/* Shipping Method */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Shipping Method</h2>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked={shippingMethod === "standard"}
                    onChange={() => setShippingMethod("standard")}
                    className={styles.radioInput}
                  />
                  <div className={styles.radioLabel}>
                    <span className={styles.radioTitle}>Standard Shipping</span>
                    <span className={styles.radioDesc}>3-5 business days</span>
                  </div>
                  <span className={styles.radioTitle}>$30.00</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="shipping"
                    value="express"
                    checked={shippingMethod === "express"}
                    onChange={() => setShippingMethod("express")}
                    className={styles.radioInput}
                  />
                  <div className={styles.radioLabel}>
                    <span className={styles.radioTitle}>Express Shipping</span>
                    <span className={styles.radioDesc}>1-2 business days</span>
                  </div>
                  <span className={styles.radioTitle}>$50.00</span>
                </label>
              </div>
            </section>

            {/* Payment Method */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Payment Method</h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                  marginBottom: "8px",
                }}
              >
                All transactions are secure and encrypted.
              </p>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className={styles.radioInput}
                  />
                  <div className={styles.radioLabel}>
                    <span className={styles.radioTitle}>
                      Cash on Delivery (COD)
                    </span>
                    <span className={styles.radioDesc}>
                      Pay with cash upon delivery.
                    </span>
                  </div>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="payment"
                    value="credit_card"
                    checked={paymentMethod === "credit_card"}
                    onChange={() => setPaymentMethod("credit_card")}
                    className={styles.radioInput}
                  />
                  <div className={styles.radioLabel}>
                    <span className={styles.radioTitle}>Credit Card</span>
                    <span className={styles.radioDesc}>
                      Visa, Mastercard, AMEX, JCB
                    </span>
                  </div>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="payment"
                    value="momo"
                    checked={paymentMethod === "momo"}
                    onChange={() => setPaymentMethod("momo")}
                    className={styles.radioInput}
                  />
                  <div className={styles.radioLabel}>
                    <span className={styles.radioTitle}>MoMo E-Wallet</span>
                    <span className={styles.radioDesc}>Pay via MoMo App</span>
                  </div>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="payment"
                    value="vnpay"
                    checked={paymentMethod === "vnpay"}
                    onChange={() => setPaymentMethod("vnpay")}
                    className={styles.radioInput}
                  />
                  <div className={styles.radioLabel}>
                    <span className={styles.radioTitle}>VNPay QR</span>
                    <span className={styles.radioDesc}>
                      Scan QR code with banking app
                    </span>
                  </div>
                </label>
              </div>
            </section>

            <button className={styles.submitBtn}>Complete Order</button>
          </div>

          {/* Right Column - Order Summary */}
          <div className={styles.rightColumn}>
            <div className={styles.summaryItems}>
              {items.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.itemImageWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className={styles.itemImage}
                    />
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

            <div className={styles.discountForm}>
              <input
                type="text"
                placeholder="Discount code"
                className={styles.discountInput}
              />
              <button className={styles.discountBtn}>Apply</button>
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span style={{ color: "var(--color-text)", fontWeight: 500 }}>
                  {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
                </span>
              </div>
              <div className={`${styles.totalRow} ${styles.final}`}>
                <span>Total</span>
                <div>
                  <span className={styles.totalCurrency}>USD</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
