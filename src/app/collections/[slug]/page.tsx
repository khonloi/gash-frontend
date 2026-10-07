import React from 'react';
import type { Metadata } from 'next';
import { fetchProducts, fetchProductStats } from '@/services/productService';
import { CollectionClientView } from '@/components/collection/CollectionClientView';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jocksport.com';

export const revalidate = 3600; // 1 hour ISR

export async function generateStaticParams() {
  const stats = await fetchProductStats();
  const slugs = stats
    .map((s) =>
      String(s.category || '')
        .toLowerCase()
        .replace(/\s+/g, '-')
    )
    .filter(Boolean);

  return [{ slug: 'all' }, ...slugs.map((slug) => ({ slug }))];
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug || 'all';
  const title = normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1);
  const pageTitle = `${title} Collection | Official Athletic Footwear & Sportswear - JOCKSPORT`;
  const pageDescription = `Shop authentic ${title} sportswear, performance gear, running shoes, and athletic equipment from Nike, Adidas, Puma, and more at JOCKSPORT.`;
  const canonicalUrl = `${siteUrl}/collections/${normalizedSlug}`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: 'JOCKSPORT',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialQuery = resolvedSearchParams?.q || '';
  const initialProducts = await fetchProducts();

  const normalizedSlug = slug || 'all';
  const title = normalizedSlug.charAt(0).toUpperCase() + normalizedSlug.slice(1);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Collections',
            item: `${siteUrl}/collections/all`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: title,
            item: `${siteUrl}/collections/${normalizedSlug}`,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${title} Collection`,
        description: `Shop authentic ${title} sportswear and athletic equipment at JOCKSPORT.`,
        url: `${siteUrl}/collections/${normalizedSlug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionClientView
        key={`${slug}-${initialQuery}`}
        initialProducts={initialProducts}
        slug={slug}
        initialQuery={initialQuery}
      />
    </>
  );
}
