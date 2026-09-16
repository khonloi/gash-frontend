import { MetadataRoute } from 'next'
import { fetchProducts } from '@/services/productService'
import { FrontendProduct } from '@/types/product'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jocksport.com'

  try {
    // Fetch top products for the sitemap
    // Note: We use a larger limit to capture the catalog, but Next.js sitemaps can paginate if needed.
    const products = await fetchProducts({ limit: 500 })

    const productUrls: MetadataRoute.Sitemap = products.map((product: FrontendProduct) => ({
      url: `${baseUrl}/products/${product.handle || product.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    const staticUrls: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/collections/all`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }
    ]

    return [...staticUrls, ...productUrls]
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
    
    // Fallback to static URLs if API fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/collections/all`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }
    ]
  }
}
