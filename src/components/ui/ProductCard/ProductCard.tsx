'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import styles from './ProductCard.module.css'

export interface ProductCardProps {
  id: string
  brand: string
  title: string
  originalPrice: number
  salePrice: number
  discountPercent?: number
  imageUrl: string
  category?: string
}

export function ProductCard({
  id,
  brand,
  title,
  originalPrice,
  salePrice,
  discountPercent,
  imageUrl,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
  }

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {discountPercent && (
          <span className={styles.discountBadge}>-{discountPercent}%</span>
        )}
        <Link href={`/products/${id}`} className={styles.imageLink}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} className={styles.image} />
        </Link>
        <button
          className={styles.quickAddBtn}
          onClick={(e) => {
            e.preventDefault()
            addItem()
          }}
          title="Add to Cart"
        >
          <ShoppingBag size={18} />
          <span>Add to Cart</span>
        </button>
      </div>

      <div className={styles.content}>
        <span className={styles.brand}>{brand}</span>
        <Link href={`/products/${id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{title}</h3>
        </Link>

        <div className={styles.pricing}>
          <span className={styles.salePrice}>{formatPrice(salePrice)}</span>
          {originalPrice > salePrice && (
            <span className={styles.originalPrice}>{formatPrice(originalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
