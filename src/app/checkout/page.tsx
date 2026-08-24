"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import {
  Button,
  Input,
  Checkbox,
  RadioGroup,
  Breadcrumb,
  EmptyState,
  RadioOption,
} from "@/components/ui";
import styles from "./page.module.css";

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [keepUpdated, setKeepUpdated] = useState(false);

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
      <div className={styles.checkoutPage}>
        <div className="container">
          <EmptyState
            title="Loading checkout..."
            description="Please wait while we prepare your order summary."
          />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <div className="container">
          <EmptyState
            icon={<ShoppingBag size={64} />}
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet."
            action={
              <Button as={Link} href="/" variant="primary" size="lg">
                Continue Shopping
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Cart", href: "/cart" },
    { label: "Information" },
    { label: "Shipping" },
    { label: "Payment" },
  ];

  const shippingOptions: RadioOption[] = [
    {
      value: "standard",
      title: "Standard Shipping",
      description: "3-5 business days",
      rightElement: <span>$30.00</span>,
    },
    {
      value: "express",
      title: "Express Shipping",
      description: "1-2 business days",
      rightElement: <span>$50.00</span>,
    },
  ];

  const paymentOptions: RadioOption[] = [
    {
      value: "cod",
      title: "Cash on Delivery (COD)",
      description: "Pay with cash upon delivery.",
    },
    {
      value: "credit_card",
      title: "Credit Card",
      description: "Visa, Mastercard, AMEX, JCB",
    },
    {
      value: "momo",
      title: "MoMo E-Wallet",
      description: "Pay via MoMo App",
    },
    {
      value: "vnpay",
      title: "VNPay QR",
      description: "Scan QR code with banking app",
    },
  ];

  return (
    <div className={styles.checkoutPage}>
      <div className="container">
        <div className={styles.checkoutContainer}>
          {/* Left Column - Forms */}
          <div className={styles.leftColumn}>
            <Breadcrumb items={breadcrumbItems} />

            {/* Contact Info */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact Information</h2>
              <div className={styles.inputGroup}>
                <Input
                  type="email"
                  placeholder="Email or mobile phone number"
                  inputSize="lg"
                />
                <div className={styles.checkboxWrap}>
                  <Checkbox
                    checked={keepUpdated}
                    onChange={setKeepUpdated}
                    label="Keep me up to date on news and exclusive offers"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Shipping Address</h2>
              <div className={styles.formGrid}>
                <div className="grid-full-span">
                  <Input
                    type="text"
                    placeholder="Country/Region"
                    defaultValue="Vietnam"
                    inputSize="lg"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="First Name"
                    inputSize="lg"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Last Name"
                    inputSize="lg"
                  />
                </div>
                <div className="grid-full-span">
                  <Input
                    type="text"
                    placeholder="Address"
                    inputSize="lg"
                  />
                </div>
                <div className="grid-full-span">
                  <Input
                    type="text"
                    placeholder="Apartment, suite, etc. (optional)"
                    inputSize="lg"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="City"
                    inputSize="lg"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Postal Code"
                    inputSize="lg"
                  />
                </div>
                <div className="grid-full-span">
                  <Input
                    type="tel"
                    placeholder="Phone"
                    inputSize="lg"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Method */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Shipping Method</h2>
              <RadioGroup
                name="shipping"
                value={shippingMethod}
                onChange={setShippingMethod}
                options={shippingOptions}
              />
            </section>

            {/* Payment Method */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Payment Method</h2>
              <p className={styles.sectionDesc}>
                All transactions are secure and encrypted.
              </p>
              <RadioGroup
                name="payment"
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={paymentOptions}
              />
            </section>

            <Button variant="primary" size="lg" fullWidth>
              Complete Order
            </Button>
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
              <div className={styles.discountInput}>
                <Input placeholder="Discount code" inputSize="md" />
              </div>
              <Button variant="outline" size="md">
                Apply
              </Button>
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span className={styles.totalValue}>
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span className={styles.totalValue}>
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
