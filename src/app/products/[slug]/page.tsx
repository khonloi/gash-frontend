'use client'

import React from 'react'
import { Breadcrumb } from '@/components/ui/Breadcrumb/Breadcrumb'
import { ProductGallery } from '@/components/ui/ProductGallery/ProductGallery'
import { ProductInfo } from '@/components/ui/ProductInfo/ProductInfo'
import { ProductTabs } from '@/components/ui/ProductTabs/ProductTabs'
import { ProductCard } from '@/components/ui/ProductCard/ProductCard'
import { mockProductDetail, mockRelatedProducts } from '@/lib/mockData'
import styles from './page.module.css'

export default function ProductDetailPage({ params }: { params: any }) {
  // Normally we would fetch the product based on params.slug.
  // For this mock, we use the single detailed product we defined.
  const product = mockProductDetail

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
              colors={product.colors}
              sizes={product.sizes}
              fit={product.fit}
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
            {mockRelatedProducts.map(p => (
              <ProductCard 
                key={p.id}
                id={p.id}
                brand={p.brand}
                title={p.title}
                salePrice={p.salePrice}
                originalPrice={p.originalPrice}
                discountPercent={p.discountPercent}
                imageUrl={p.imageUrl}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
