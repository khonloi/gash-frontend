import React from 'react';
import Image, { ImageProps } from 'next/image';
import { Grid } from 'lucide-react';
import clsx from 'clsx';
import styles from './Logos.module.css';

export interface BrandLogoProps extends Omit<Partial<ImageProps>, 'src' | 'alt'> {
  size?: number;
  className?: string;
}

export function NikeLogo({ size = 32, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 2.8);
  return (
    <Image
      src="/logos/brands/nike.svg"
      alt="Nike"
      aria-label="Nike"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function AdidasLogo({ size = 32, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 1.45);
  return (
    <Image
      src="/logos/brands/adidas.svg"
      alt="Adidas"
      aria-label="Adidas"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function PumaLogo({ size = 32, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 1.2);
  return (
    <Image
      src="/logos/brands/puma.svg"
      alt="Puma"
      aria-label="Puma"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function UnderArmourLogo({ size = 32, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 1.3);
  return (
    <Image
      src="/logos/brands/under-armour.svg"
      alt="Under Armour"
      aria-label="Under Armour"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function AsicsLogo({ size = 30, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 2.8);
  return (
    <Image
      src="/logos/brands/asics.svg"
      alt="Asics"
      aria-label="Asics"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function NewBalanceLogo({ size = 30, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 1.4);
  return (
    <Image
      src="/logos/brands/new-balance.svg"
      alt="New Balance"
      aria-label="New Balance"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function ReebokLogo({ size = 28, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 2.2);
  return (
    <Image
      src="/logos/brands/reebok.svg"
      alt="Reebok"
      aria-label="Reebok"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function JordanLogo({ size = 32, className, style, ...props }: BrandLogoProps) {
  return (
    <Image
      src="/logos/brands/jordan.svg"
      alt="Air Jordan"
      aria-label="Air Jordan"
      width={size}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function MizunoLogo({ size = 28, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 1.8);
  return (
    <Image
      src="/logos/brands/mizuno.svg"
      alt="Mizuno"
      aria-label="Mizuno"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function SpeedoLogo({ size = 22, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 4.5);
  return (
    <Image
      src="/logos/brands/speedo.svg"
      alt="Speedo"
      aria-label="Speedo"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function WilsonLogo({ size = 26, className, style, ...props }: BrandLogoProps) {
  const width = Math.round(size * 3.8);
  return (
    <Image
      src="/logos/brands/wilson.svg"
      alt="Wilson"
      aria-label="Wilson"
      width={width}
      height={size}
      unoptimized
      style={{ objectFit: 'contain', maxHeight: size, ...style }}
      className={clsx(styles.logoImg, className)}
      {...props}
    />
  );
}

export function MoreBrandsLogo({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <div className={clsx(styles.moreBrands, className)}>
      <Grid size={size} />
      <span>+ MORE BRANDS</span>
    </div>
  );
}

const BRAND_COMPONENT_MAP: Record<string, React.ComponentType<BrandLogoProps>> = {
  NIKE: NikeLogo,
  ADIDAS: AdidasLogo,
  PUMA: PumaLogo,
  'UNDER ARMOUR': UnderArmourLogo,
  ASICS: AsicsLogo,
  'NEW BALANCE': NewBalanceLogo,
  REEBOK: ReebokLogo,
  JORDAN: JordanLogo,
  'AIR JORDAN': JordanLogo,
  MIZUNO: MizunoLogo,
  SPEEDO: SpeedoLogo,
  WILSON: WilsonLogo,
};

interface BrandDispatcherProps extends BrandLogoProps {
  brand: string;
}

export function BrandLogo({ brand, size = 32, className, ...props }: BrandDispatcherProps) {
  const normalized = (brand || '').trim().toUpperCase();

  if (normalized === '+ MORE BRANDS' || normalized === 'MORE BRANDS') {
    return <MoreBrandsLogo size={16} className={className} />;
  }

  const Component = BRAND_COMPONENT_MAP[normalized];
  if (Component) {
    return <Component size={size} className={className} {...props} />;
  }

  return <span className={clsx(styles.fallbackBrand, className)}>{brand}</span>;
}
