import React from 'react';
import Image, { ImageProps } from 'next/image';
import clsx from 'clsx';
import styles from './Logos.module.css';

export interface PaymentLogoProps extends Omit<Partial<ImageProps>, 'src' | 'alt'> {
  size?: number;
  className?: string;
}

export function VisaLogo({ size = 18, className, style, ...props }: PaymentLogoProps) {
  const width = Math.round(size * 3.0);
  return (
    <Image
      src="/logos/payments/visa.svg"
      alt="Visa"
      aria-label="Visa"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function MastercardLogo({ size = 24, className, style, ...props }: PaymentLogoProps) {
  const width = Math.round(size * 1.3);
  return (
    <Image
      src="/logos/payments/mastercard.svg"
      alt="Mastercard"
      aria-label="Mastercard"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function AmexLogo({ size = 22, className, style, ...props }: PaymentLogoProps) {
  const width = Math.round(size * 1.6);
  return (
    <Image
      src="/logos/payments/amex.svg"
      alt="American Express"
      aria-label="American Express"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function ApplePayLogo({ size = 20, className, style, ...props }: PaymentLogoProps) {
  const width = Math.round(size * 2.4);
  return (
    <Image
      src="/logos/payments/apple-pay.svg"
      alt="Apple Pay"
      aria-label="Apple Pay"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function PayPalLogo({ size = 18, className, style, ...props }: PaymentLogoProps) {
  const width = Math.round(size * 3.6);
  return (
    <Image
      src="/logos/payments/paypal.svg"
      alt="PayPal"
      aria-label="PayPal"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function CodLogo({ size = 20, className, style, ...props }: PaymentLogoProps) {
  const width = Math.round(size * 2.6);
  return (
    <Image
      src="/logos/payments/cod.svg"
      alt="Cash on Delivery"
      aria-label="Cash on Delivery"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}
