import React from 'react';
import type { Metadata } from 'next';
import { fetchProducts, fetchProductStats } from '@/services/productService';
import { CollectionClientView } from '@/components/collection/CollectionClientView';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string }>;
}

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
  const title = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Collection';

  return {
    title: `${title} Collection | JOCKSPORT`,
    description: `Shop authentic ${title} sportswear, performance gear, and athletic equipment at JOCKSPORT.`,
    alternates: {
      canonical: `/collections/${slug || 'all'}`,
    },
    openGraph: {
      title: `${title} Collection | JOCKSPORT`,
      description: `Explore the official ${title} lineup featuring world-class sport performance gear.`,
    },
  };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialQuery = resolvedSearchParams?.q || '';
  const initialProducts = await fetchProducts();

  return (
    <CollectionClientView
      key={`${slug}-${initialQuery}`}
      initialProducts={initialProducts}
      slug={slug}
      initialQuery={initialQuery}
    />
  );
}
