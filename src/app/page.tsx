import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { HeroCarousel, PromoBanner } from '@/components/ui';
import {
  CategorySectionSkeleton,
  DynamicCategorySection,
  ProductShelfSkeleton,
  DynamicProductsSection,
  BrandsSectionSkeleton,
  DynamicBrandsSection,
  DynamicSportsSection,
  TrustSection,
} from '@/components/home';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'JOCKSPORT | Official Athletic & Performance Sportswear',
  description:
    'Explore authentic sportswear, high-performance running shoes, and premium training gear from top global athletic brands at JOCKSPORT.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'JOCKSPORT | Official Athletic & Performance Sportswear',
    description:
      'Explore authentic sportswear, high-performance running shoes, and premium training gear from top global athletic brands at JOCKSPORT.',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JOCKSPORT | Official Athletic & Performance Sportswear',
    description:
      'Explore authentic sportswear, high-performance running shoes, and premium training gear from top global athletic brands at JOCKSPORT.',
  },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jocksport.com';

export default function Home() {
  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'JOCKSPORT | Official Athletic Footwear & Sportswear',
    description:
      'Explore authentic sportswear, high-performance running shoes, and premium training gear from top global athletic brands at JOCKSPORT.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'SiteNavigationElement',
          position: 1,
          name: 'Running Collection',
          url: `${siteUrl}/collections/running`,
        },
        {
          '@type': 'SiteNavigationElement',
          position: 2,
          name: 'Footwear Collection',
          url: `${siteUrl}/collections/footwear`,
        },
        {
          '@type': 'SiteNavigationElement',
          position: 3,
          name: 'Apparel Collection',
          url: `${siteUrl}/collections/apparel`,
        },
        {
          '@type': 'SiteNavigationElement',
          position: 4,
          name: 'Training Collection',
          url: `${siteUrl}/collections/training`,
        },
      ],
    },
  };

  return (
    <main id="main-content" className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      {/* 1. Hero Section Carousel */}
      <HeroCarousel />

      {/* 2. Categories Section */}
      <Suspense fallback={<CategorySectionSkeleton />}>
        <DynamicCategorySection />
      </Suspense>

      {/* 3. Featured Deals / Hot Products */}
      <Suspense
        fallback={
          <ProductShelfSkeleton title="Featured Deals" className={styles.productsSection} />
        }
      >
        <DynamicProductsSection
          type="featured"
          title="Featured Deals"
          className={styles.productsSection}
        />
      </Suspense>

      {/* 4. Wide Campaign Banner 1 */}
      <PromoBanner
        badge="SUMMER SPLASH 2026"
        title="AQUATIC GEAR & CASHBACK VOUCHER"
        subtitle="Receive an instant $15 cashback voucher when purchasing any Speedo competition goggles, racing swimsuits, or anti-fog equipment."
        dateRange="Valid: Aug 15 - Sep 30, 2026 • Limited Stock Available"
        ctaText="EXPLORE SPEEDO"
        href="/collections/all"
        bgGradient="linear-gradient(135deg, #0052CC 0%, #001B6B 100%)"
        imageUrl="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80"
      />

      {/* 5. New Collections */}
      <Suspense
        fallback={
          <ProductShelfSkeleton title="New Collections" className={styles.collectionsSection} />
        }
      >
        <DynamicProductsSection
          type="new"
          title="New Collections"
          className={styles.collectionsSection}
        />
      </Suspense>

      {/* 6. Featured Collections */}
      <Suspense
        fallback={
          <ProductShelfSkeleton
            title="Featured Collections"
            className={styles.featuredGridSection}
          />
        }
      >
        <DynamicProductsSection
          type="collections"
          title="Featured Collections"
          className={styles.featuredGridSection}
        />
      </Suspense>

      {/* 7. Top Brands Grid */}
      <Suspense fallback={<BrandsSectionSkeleton />}>
        <DynamicBrandsSection />
      </Suspense>

      {/* 8. Wide Campaign Banner 2 */}
      <PromoBanner
        badge="SEASON 26/27 DROPS"
        title="OFFICIAL CLUB KITS & CUSTOM PRINTING"
        subtitle="Get your favorite club jersey with authentic player name and number printing. Premier League, La Liga, Serie A & Champions League editions."
        dateRange="Free Authentic League Badge with every purchase"
        ctaText="CUSTOMIZE YOUR JERSEY"
        href="/collections/all"
        reverse={true}
        bgGradient="linear-gradient(135deg, #0C1C30 0%, #153258 100%)"
        imageUrl="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80"
      />

      {/* 9. Favorite Sports */}
      <Suspense fallback={null}>
        <DynamicSportsSection />
      </Suspense>

      {/* 10. Trust / Value Guarantee Features */}
      <TrustSection />
    </main>
  );
}
