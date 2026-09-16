'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, CheckCircle2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';
import { useIsMounted } from '@/hooks/useIsMounted';
import {
  Button,
  Input,
  Checkbox,
  RadioGroup,
  Breadcrumb,
  EmptyState,
  RadioOption,
  Skeleton,
} from '@/components/ui';
import { formatPrice } from '@/lib/format';
import styles from './page.module.css';

interface FormData {
  contact: string;
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  postalCode: string;
  phone: string;
  keepUpdated: boolean;
}

interface FormErrors {
  contact?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
}

interface OrderConfirmation {
  orderId: string;
  date: string;
  customerName: string;
  shippingAddress: string;
  total: number;
  itemCount: number;
}

export function CheckoutClientView() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { addToast } = useToastStore();
  const mounted = useIsMounted();

  const [formData, setFormData] = useState<FormData>({
    contact: '',
    country: 'Vietnam',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
    phone: '',
    keepUpdated: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderConfirmation | null>(null);

  const subtotal = getTotalPrice();
  const shippingFee = subtotal > 0 && shippingMethod === 'standard' ? 30 : shippingMethod === 'express' ? 50 : 0;
  const total = subtotal + shippingFee;

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for that field as user types
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Contact (email or phone)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
    if (!formData.contact.trim()) {
      newErrors.contact = 'Email or phone number is required.';
    } else if (!emailRegex.test(formData.contact) && !phoneRegex.test(formData.contact)) {
      newErrors.contact = 'Please enter a valid email address or phone number.';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast('Please correct the errors in the form before continuing.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate order processing API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const orderNumber = `JS-${Math.floor(100000 + Math.random() * 900000)}`;
      const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

      const confirmedOrder: OrderConfirmation = {
        orderId: orderNumber,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        customerName: `${formData.firstName} ${formData.lastName}`,
        shippingAddress: `${formData.address}${formData.apartment ? ', ' + formData.apartment : ''}, ${formData.city}, ${formData.country}`,
        total: total,
        itemCount: itemCount,
      };

      clearCart();
      setCompletedOrder(confirmedOrder);
      addToast(`Order ${orderNumber} placed successfully!`, 'success');
    } catch {
      addToast('An error occurred while placing your order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SSR Loading Skeleton
  if (!mounted) {
    return (
      <div className={styles.checkoutPage}>
        <div className="container">
          <div style={{ marginBottom: '2rem', width: '220px' }}>
            <Skeleton width="220px" height="32px" />
          </div>
          <div className={styles.checkoutContainer}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <Skeleton width="100%" height="200px" borderRadius="8px" />
              <Skeleton width="100%" height="320px" borderRadius="8px" />
            </div>
            <div>
              <Skeleton width="100%" height="380px" borderRadius="10px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order Confirmation Screen
  if (completedOrder) {
    return (
      <div className={styles.checkoutPage}>
        <div className="container">
          <div className={styles.confirmationContainer}>
            <div className={styles.confirmBadge}>
              <CheckCircle2 size={36} />
            </div>

            <h1 className={styles.sectionTitle} style={{ fontSize: '2rem', margin: '0' }}>
              Order Confirmed!
            </h1>

            <span className={styles.orderNumber}>
              Order Ref: {completedOrder.orderId}
            </span>

            <p className={styles.sectionDesc} style={{ maxWidth: '440px' }}>
              Thank you, <strong>{completedOrder.customerName}</strong>. Your order has been placed and is being prepared for shipment.
            </p>

            <div className={styles.orderSummaryBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Date:</span>
                <strong>{completedOrder.date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Deliver to:</span>
                <strong>{completedOrder.shippingAddress}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Items:</span>
                <strong>{completedOrder.itemCount} items</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                <span style={{ fontWeight: 700 }}>Total Paid:</span>
                <strong style={{ color: 'var(--color-sale-red)', fontSize: '1.1rem' }}>
                  {formatPrice(completedOrder.total)}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="lg" icon={<ArrowRight size={16} />}>
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart fallback
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
    { label: 'Cart', href: '/cart' },
    { label: 'Information' },
    { label: 'Shipping' },
    { label: 'Payment' },
  ];

  const shippingOptions: RadioOption[] = [
    {
      value: 'standard',
      title: 'Standard Shipping',
      description: '3-5 business days',
      rightElement: <span>$30.00</span>,
    },
    {
      value: 'express',
      title: 'Express Shipping',
      description: '1-2 business days',
      rightElement: <span>$50.00</span>,
    },
  ];

  const paymentOptions: RadioOption[] = [
    {
      value: 'cod',
      title: 'Cash on Delivery (COD)',
      description: 'Pay with cash upon delivery.',
    },
    {
      value: 'credit_card',
      title: 'Credit Card',
      description: 'Visa, Mastercard, AMEX, JCB',
    },
    {
      value: 'momo',
      title: 'MoMo E-Wallet',
      description: 'Pay via MoMo App',
    },
    {
      value: 'vnpay',
      title: 'VNPay QR',
      description: 'Scan QR with any Banking App',
    },
  ];

  return (
    <div className={styles.checkoutPage}>
      <div className="container">
        <form onSubmit={handleOrderSubmit} className={styles.checkoutContainer}>
          {/* Left Column - Forms */}
          <div className={styles.leftColumn}>
            <Breadcrumb items={breadcrumbItems} />

            {/* Contact Information */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Contact Information</h2>
                <span className={styles.sectionSubtitle}>
                  Already have an account? <Link href="/login">Log in</Link>
                </span>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="contact" className="sr-only">Email or mobile phone number</label>
                <Input
                  id="contact"
                  type="text"
                  placeholder="Email or mobile phone number"
                  inputSize="lg"
                  value={formData.contact}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  hasError={Boolean(errors.contact)}
                />
                {errors.contact && <span className={styles.fieldError}>{errors.contact}</span>}
                <div className={styles.checkboxWrap}>
                  <Checkbox
                    checked={formData.keepUpdated}
                    onChange={(checked) => handleInputChange('keepUpdated', checked)}
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
                  <label htmlFor="country" className="sr-only">Country or Region</label>
                  <Input
                    id="country"
                    type="text"
                    placeholder="Country/Region"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    inputSize="lg"
                  />
                </div>
                <div>
                  <label htmlFor="firstName" className="sr-only">First Name</label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First Name"
                    inputSize="lg"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    hasError={Boolean(errors.firstName)}
                  />
                  {errors.firstName && <span className={styles.fieldError}>{errors.firstName}</span>}
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">Last Name</label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last Name"
                    inputSize="lg"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    hasError={Boolean(errors.lastName)}
                  />
                  {errors.lastName && <span className={styles.fieldError}>{errors.lastName}</span>}
                </div>
                <div className="grid-full-span">
                  <label htmlFor="address" className="sr-only">Address</label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Address (Street name, house number)"
                    inputSize="lg"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    hasError={Boolean(errors.address)}
                  />
                  {errors.address && <span className={styles.fieldError}>{errors.address}</span>}
                </div>
                <div className="grid-full-span">
                  <label htmlFor="apartment" className="sr-only">Apartment, suite, etc. (optional)</label>
                  <Input
                    id="apartment"
                    type="text"
                    placeholder="Apartment, suite, etc. (optional)"
                    inputSize="lg"
                    value={formData.apartment}
                    onChange={(e) => handleInputChange('apartment', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="sr-only">City</label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="City"
                    inputSize="lg"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    hasError={Boolean(errors.city)}
                  />
                  {errors.city && <span className={styles.fieldError}>{errors.city}</span>}
                </div>
                <div>
                  <label htmlFor="postalCode" className="sr-only">Postal Code</label>
                  <Input
                    id="postalCode"
                    type="text"
                    placeholder="Postal Code (optional)"
                    inputSize="lg"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  />
                </div>
                <div className="grid-full-span">
                  <label htmlFor="phone" className="sr-only">Phone</label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone"
                    inputSize="lg"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    hasError={Boolean(errors.phone)}
                  />
                  {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing Order...' : `Complete Order • ${formatPrice(total)}`}
            </Button>
          </div>

          {/* Right Column - Order Summary */}
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
              <label htmlFor="discount" className="sr-only">Discount code</label>
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
        </form>
      </div>
    </div>
  );
}
