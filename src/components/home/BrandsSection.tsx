import React from 'react';
import Link from 'next/link';
import { SectionHeading, BrandLogo } from '@/components/ui';
import { fetchProducts } from '@/services/productService';
import styles from '@/app/page.module.css';

export const DEFAULT_BRANDS = [
  'NIKE',
  'ADIDAS',
  'PUMA',
  'UNDER ARMOUR',
  'ASICS',
  'NEW BALANCE',
  'REEBOK',
  'JORDAN',
  'MIZUNO',
  'SPEEDO',
  'WILSON',
  '+ MORE BRANDS',
];

export function BrandsSectionSkeleton() {
  return (
    <section className={styles.brandsSection}>
      <div className="container">
        <SectionHeading>Top Featured Brands</SectionHeading>
        <div className={styles.brandsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.brandBox}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export async function DynamicBrandsSection() {
  const allProducts = await fetchProducts({ limit: 50 });
  const dbBrands = Array.from(new Set(allProducts.map((p) => p.brand))).filter(Boolean);

  let dynamicBrands = dbBrands.slice(0, 11);
  if (dynamicBrands.length === 0) {
    dynamicBrands = DEFAULT_BRANDS;
  } else if (dynamicBrands.length < 12 && !dynamicBrands.includes('+ MORE BRANDS')) {
    dynamicBrands.push('+ MORE BRANDS');
  }

  return (
    <section className={styles.brandsSection}>
      <div className="container">
        <SectionHeading>Top Featured Brands</SectionHeading>
        <div className={styles.brandsGrid}>
          {dynamicBrands.map((brand: string) => (
            <Link
              key={brand}
              href={
                brand === '+ MORE BRANDS'
                  ? '/collections/all'
                  : `/collections/all?brand=${encodeURIComponent(brand)}`
              }
              className={styles.brandBox}
              aria-label={`Shop ${brand} products`}
            >
              <BrandLogo brand={brand} size={30} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
