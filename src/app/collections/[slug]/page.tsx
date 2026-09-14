import React from 'react';
import type { Metadata } from 'next';
import { fetchProducts } from '@/services/productService';
import { CollectionClientView } from '@/components/collection/CollectionClientView';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Collection';

  return {
    title: `${title} Collection | JOCKSPORT`,
    description: `Shop authentic ${title} sportswear, performance gear, and athletic equipment at JOCKSPORT.`,
    openGraph: {
      title: `${title} Collection | JOCKSPORT`,
      description: `Explore the official ${title} lineup featuring world-class sport performance gear.`,
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const initialProducts = await fetchProducts();

  return (
    <CollectionClientView
      key={slug}
      initialProducts={initialProducts}
      slug={slug}
    />
  );
}
