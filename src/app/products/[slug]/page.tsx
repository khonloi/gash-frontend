'use client'

import React from 'react'
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb'
import { ProductGallery } from '@/components/ui/ProductGallery/ProductGallery'
import { ProductInfo } from '@/components/ui/ProductInfo/ProductInfo'
import { ProductTabs } from '@/components/ui/ProductTabs/ProductTabs'
import { ProductCard } from '@/components/ui/ProductCard/ProductCard'
import { FrontendProduct } from '@/types/product'
import { fetchProductByHandle, fetchProducts } from '@/services/productService'
import styles from './page.module.css'

export default function ProductDetailPage({ params }: { params: any }) {
  const [product, setProduct] = React.useState<FrontendProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = React.useState<FrontendProduct[]>([]);

  React.useEffect(() => {
    const loadProduct = async () => {
      const p = await params;
      if (p?.slug) {
        const data = await fetchProductByHandle(p.slug);
        setProduct(data);

        // Fetch related products (for demo, just fetch all and take first 4)
        const allProducts = await fetchProducts();
        setRelatedProducts(allProducts.filter(item => item.handle !== p.slug).slice(0, 4));
      }
    };
    loadProduct();
  }, [params]);

  if (!product) {
    return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>Loading product...</div>;
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/collections/all' },
    { label: product.title },
  ]

  return (
    <main className={styles.pageContainer}>
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
              colors={product.colors.map((c, i) => ({ id: `color-${i}`, name: c, imageUrl: product.images[0] || '' }))}
              sizes={product.sizes.map((s, i) => ({ id: `size-${i}`, label: s, inStock: true }))}
              fit="Regular"
            />
          </div>
        </div>

        <ProductTabs 
          description={product.description}
          specs={product.specs}
        />

        <section className={styles.relatedSection}>
          <h2 className="heading-section">You Might Also Like</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map(p => (
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
  )
}
