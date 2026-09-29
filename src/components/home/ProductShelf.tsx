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
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div
                className="skeleton"
                style={{ width: '100%', aspectRatio: '4/5', borderRadius: '4px' }}
              />
              <div
                className="skeleton"
                style={{ width: '60%', height: '16px', marginTop: '0.5rem' }}
              />
              <div className="skeleton" style={{ width: '40%', height: '16px' }} />
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
  } else {
    // In a real app, these would be separate API endpoints (e.g. /products/new)
    // For now, we fetch all (deduplicated by react/cache) and slice
    const allProducts = await fetchProducts();
    if (type === 'new') {
      products =
        allProducts.slice(10, 20).length >= 10
          ? allProducts.slice(10, 20)
          : allProducts.slice(0, 10);
    } else {
      products =
        allProducts.slice(20, 30).length >= 10
          ? allProducts.slice(20, 30)
          : allProducts.slice(0, 10);
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
