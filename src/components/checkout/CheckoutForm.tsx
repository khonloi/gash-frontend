import React from 'react';
import Link from 'next/link';
import {
  Button,
  Input,
  Checkbox,
  RadioGroup,
} from '@/components/ui';
import { formatPrice } from '@/lib/format';
import {
  CheckoutFormData,
  CheckoutFormErrors,
  SHIPPING_OPTIONS,
  PAYMENT_OPTIONS,
} from '@/constants/checkout';
import styles from '@/app/checkout/page.module.css';

export interface CheckoutFormProps {
  formData: CheckoutFormData;
  errors: CheckoutFormErrors;
  shippingMethod: string;
  paymentMethod: string;
  isSubmitting: boolean;
  isAuthenticated: boolean;
  total: number;
  onInputChange: (field: keyof CheckoutFormData, value: string | boolean) => void;
  onShippingChange: (value: string) => void;
  onPaymentChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CheckoutForm({
  formData,
  errors,
  shippingMethod,
  paymentMethod,
  isSubmitting,
  isAuthenticated,
  total,
  onInputChange,
  onShippingChange,
  onPaymentChange,
  onSubmit,
}: CheckoutFormProps) {
  return (
    <div className={styles.leftColumn}>
      {/* Contact Information */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Contact Information</h2>
          {!isAuthenticated && (
            <span className={styles.sectionSubtitle}>
              Already have an account? <Link href="/login">Log in</Link>
            </span>
          )}
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="contact" className="sr-only">
            Email or mobile phone number
          </label>
          <Input
            id="contact"
            type="text"
            placeholder="Email or mobile phone number"
            inputSize="lg"
            value={formData.contact}
            onChange={(e) => onInputChange('contact', e.target.value)}
            hasError={Boolean(errors.contact)}
          />
          {errors.contact && <span className={styles.fieldError}>{errors.contact}</span>}
          <div className={styles.checkboxWrap}>
            <Checkbox
              checked={formData.keepUpdated}
              onChange={(checked) => onInputChange('keepUpdated', checked)}
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
            <label htmlFor="country" className="sr-only">
              Country or Region
            </label>
            <Input
              id="country"
              type="text"
              placeholder="Country/Region"
              value={formData.country}
              onChange={(e) => onInputChange('country', e.target.value)}
              inputSize="lg"
            />
          </div>
          <div>
            <label htmlFor="firstName" className="sr-only">
              First Name
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder="First Name"
              inputSize="lg"
              value={formData.firstName}
              onChange={(e) => onInputChange('firstName', e.target.value)}
              hasError={Boolean(errors.firstName)}
            />
            {errors.firstName && (
              <span className={styles.fieldError}>{errors.firstName}</span>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="sr-only">
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              placeholder="Last Name"
              inputSize="lg"
              value={formData.lastName}
              onChange={(e) => onInputChange('lastName', e.target.value)}
              hasError={Boolean(errors.lastName)}
            />
            {errors.lastName && <span className={styles.fieldError}>{errors.lastName}</span>}
          </div>
          <div className="grid-full-span">
            <label htmlFor="address" className="sr-only">
              Address
            </label>
            <Input
              id="address"
              type="text"
              placeholder="Address (Street name, house number)"
              inputSize="lg"
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              hasError={Boolean(errors.address)}
            />
            {errors.address && <span className={styles.fieldError}>{errors.address}</span>}
          </div>
          <div className="grid-full-span">
            <label htmlFor="apartment" className="sr-only">
              Apartment, suite, etc. (optional)
            </label>
            <Input
              id="apartment"
              type="text"
              placeholder="Apartment, suite, etc. (optional)"
              inputSize="lg"
              value={formData.apartment}
              onChange={(e) => onInputChange('apartment', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="city" className="sr-only">
              City
            </label>
            <Input
              id="city"
              type="text"
              placeholder="City"
              inputSize="lg"
              value={formData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              hasError={Boolean(errors.city)}
            />
            {errors.city && <span className={styles.fieldError}>{errors.city}</span>}
          </div>
          <div>
            <label htmlFor="postalCode" className="sr-only">
              Postal Code
            </label>
            <Input
              id="postalCode"
              type="text"
              placeholder="Postal Code (optional)"
              inputSize="lg"
              value={formData.postalCode}
              onChange={(e) => onInputChange('postalCode', e.target.value)}
            />
          </div>
          <div className="grid-full-span">
            <label htmlFor="phone" className="sr-only">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="Phone"
              inputSize="lg"
              value={formData.phone}
              onChange={(e) => onInputChange('phone', e.target.value)}
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
          onChange={onShippingChange}
          options={SHIPPING_OPTIONS}
        />
      </section>

      {/* Payment Method */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Payment Method</h2>
        <p className={styles.sectionDesc}>All transactions are secure and encrypted.</p>
        <RadioGroup
          name="payment"
          value={paymentMethod}
          onChange={onPaymentChange}
          options={PAYMENT_OPTIONS}
        />
      </section>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? 'Processing Order...' : `Complete Order • ${formatPrice(total)}`}
      </Button>
    </div>
  );
}
