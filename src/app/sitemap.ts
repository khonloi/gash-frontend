import { MetadataRoute } from 'next';
import { fetchProducts } from '@/services/productService';
import { FrontendProduct } from '@/types/product';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jocksport.com';

  const categorySlugs = ['all', 'men', 'women', 'kids', 'accessories', 'sale'];

  const categoryUrls: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${baseUrl}/collections/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: slug === 'all' ? 0.9 : 0.85,
  }));

  const rootUrl: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  try {
    // Fetch products for the sitemap
    const products = await fetchProducts({ limit: 100 });

    const productUrls: MetadataRoute.Sitemap = products.map((product: FrontendProduct) => ({
      url: `${baseUrl}/products/${product.handle || product.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...rootUrl, ...categoryUrls, ...productUrls];
  } catch (error) {
    console.error('Failed to generate product sitemap items:', error);
    return [...rootUrl, ...categoryUrls];
  }
}
