import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeading, ProductCard } from '@/components/ui';
import { fetchProducts, fetchFeaturedProducts } from '@/services/productService';
import styles from '@/app/page.module.css';

export interface ProductShelfSkeletonProps {
  title: string;
  className: string;
}

export function ProductShelfSkeleton({ title, className }: ProductShelfSkeletonProps) {
  return (
    <section className={className}>
      <div className="container">
        <SectionHeading>{title}</SectionHeading>
        <div className={styles.productsGrid}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={styles.shelfCardSkeleton}>
              <div className={`skeleton ${styles.shelfImageSkeleton}`} />
              <div className={`skeleton ${styles.shelfTitleSkeleton}`} />
              <div className={`skeleton ${styles.shelfPriceSkeleton}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export interface DynamicProductsSectionProps {
  type: 'featured' | 'new' | 'collections';
  title: string;
  className: string;
}

export async function DynamicProductsSection({
  type,
  title,
  className,
}: DynamicProductsSectionProps) {
  let products = [];

  if (type === 'featured') {
    products = await fetchFeaturedProducts(10);
  } else if (type === 'new') {
    products = await fetchProducts({ sort: '-createdAt', limit: 10 });
    // Fallback if sorting returned empty or fewer items
    if (products.length === 0) {
      products = await fetchProducts({ limit: 10 });
    }
  } else {
    // Featured collections shelf
    products = await fetchProducts({ page: 2, limit: 10 });
    if (products.length === 0) {
      products = await fetchProducts({ limit: 10 });
    }
  }

  if (products.length === 0) {
    return null;
  }

  const viewAllAction = (
    <Link href="/collections/all" className={styles.viewAllLink} aria-label={`View all ${title}`}>
      <span>View all products</span>
      <ArrowRight size={16} />
    </Link>
  );

  return (
    <section className={className}>
      <div className="container">
        <SectionHeading action={viewAllAction}>{title}</SectionHeading>

        <div className={styles.productsGrid}>
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              {...prod}
              discountPercent={prod.discountPercent ?? undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
