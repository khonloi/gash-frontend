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

import { CheckoutFormData, CheckoutFormErrors, OrderConfirmationData } from '@/types/order';

export type { CheckoutFormData, CheckoutFormErrors, OrderConfirmationData };

export const SHIPPING_METHODS = {
  standard: {
    id: 'standard',
    title: 'Standard Shipping',
    description: '3-5 business days',
    price: 30,
  },
  express: {
    id: 'express',
    title: 'Express Shipping',
    description: '1-2 business days',
    price: 50,
  },
} as const;

export const SHIPPING_OPTIONS: RadioOption[] = [
  {
    value: SHIPPING_METHODS.standard.id,
    title: SHIPPING_METHODS.standard.title,
    description: SHIPPING_METHODS.standard.description,
    rightElement: <span>${SHIPPING_METHODS.standard.price.toFixed(2)}</span>,
  },
  {
    value: SHIPPING_METHODS.express.id,
    title: SHIPPING_METHODS.express.title,
    description: SHIPPING_METHODS.express.description,
    rightElement: <span>${SHIPPING_METHODS.express.price.toFixed(2)}</span>,
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
