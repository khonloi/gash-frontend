import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Breadcrumb,
  ProductGallery,
  ProductInfo,
  ProductTabs,
  ProductCard,
  SectionHeading,
} from '@/components/ui';
import { fetchProductByHandle, fetchProducts } from '@/services/productService';
import styles from './page.module.css';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductByHandle(slug);

  if (!product) {
    return {
      title: 'Product Not Found | JOCKSPORT',
      description: 'The requested product could not be found.',
    };
  }

  const plainDescription = product.description
    ? product.description.replace(/<[^>]*>/g, '').slice(0, 160)
    : `Shop the authentic ${product.title} by ${product.brand} at JOCKSPORT.`;

  return {
    title: `${product.title} | ${product.brand} - JOCKSPORT`,
    description: plainDescription,
    openGraph: {
      title: `${product.title} | ${product.brand} - JOCKSPORT`,
      description: plainDescription,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await fetchProductByHandle(slug);

  if (!product) {
    notFound();
  }

  const allProducts = await fetchProducts();
  const relatedProducts = allProducts
    .filter((item) => item.handle !== slug && item.id !== product.id)
    .slice(0, 4);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/collections/all' },
    { label: product.title },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images?.length > 0 ? product.images : [product.imageUrl],
    description: product.description
      ? product.description.replace(/<[^>]*>/g, '').slice(0, 300)
      : undefined,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://jocksport.com/products/${product.handle}`,
    },
  };

  return (
    <main className={styles.pageContainer}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        <div className={styles.productTopSection}>
          <div className={styles.galleryWrapper}>
            <ProductGallery images={product.images} isNew={product.isNew} />
          </div>
          <div className={styles.infoWrapper}>
            <ProductInfo
              brand={product.brand}
              title={product.title}
              category={product.category}
              sku={product.sku}
              price={product.price}
              originalPrice={product.originalPrice}
              colors={product.colors.map((c, i) => ({
                id: `color-${i}`,
                name: c,
                imageUrl: product.images[0] || '',
              }))}
              sizes={product.sizes.map((s, i) => ({
                id: `size-${i}`,
                label: s,
                inStock: true,
              }))}
              fit="Regular"
            />
          </div>
        </div>

        <ProductTabs
          description={product.description}
          specs={product.specs}
        />

        <section className={styles.relatedSection}>
          <SectionHeading>You Might Also Like</SectionHeading>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                handle={p.handle}
                brand={p.brand}
                title={p.title}
                salePrice={p.salePrice}
                originalPrice={p.originalPrice}
                discountPercent={p.discountPercent ?? undefined}
                imageUrl={p.imageUrl}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
