import React from 'react';
import { RadioOption } from '@/components/ui';

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
    rightElement: React.createElement('span', null, '$30.00'),
  },
  {
    value: 'express',
    title: 'Express Shipping',
    description: '1-2 business days',
    rightElement: React.createElement('span', null, '$50.00'),
  },
];

export const PAYMENT_OPTIONS: RadioOption[] = [
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
