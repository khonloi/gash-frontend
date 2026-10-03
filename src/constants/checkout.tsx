import React from 'react';
import {
  RadioOption,
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  ApplePayLogo,
  PayPalLogo,
  CodLogo,
} from '@/components/ui';

export interface CheckoutFormData {
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

export interface CheckoutFormErrors {
  contact?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
}

export interface OrderConfirmationData {
  orderId: string;
  date: string;
  customerName: string;
  shippingAddress: string;
  total: number;
  itemCount: number;
}

export const SHIPPING_OPTIONS: RadioOption[] = [
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

export const PAYMENT_OPTIONS: RadioOption[] = [
  {
    value: 'credit_card',
    title: 'Credit or Debit Card',
    description: 'Visa, Mastercard, American Express',
    rightElement: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <VisaLogo size={14} />
        <MastercardLogo size={20} />
        <AmexLogo size={18} />
      </div>
    ),
  },
  {
    value: 'apple_pay',
    title: 'Apple Pay',
    description: 'Fast, secure checkout with Touch ID or Face ID',
    rightElement: <ApplePayLogo size={18} />,
  },
  {
    value: 'paypal',
    title: 'PayPal',
    description: 'Pay via PayPal balance or linked account',
    rightElement: <PayPalLogo size={16} />,
  },
  {
    value: 'cod',
    title: 'Cash on Delivery (COD)',
    description: 'Pay with cash upon delivery of your order',
    rightElement: <CodLogo size={18} />,
  },
];
