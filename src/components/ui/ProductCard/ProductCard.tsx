'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
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
          <Badge variant="destructive" className={styles.discountBadge}>-{discountPercent}%</Badge>
        )}
        <Link href={`/products/${id}`} className={styles.imageLink}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} className={styles.image} />
        </Link>
        <Button
          variant="primary"
          size="sm"
          className={styles.quickAddBtn}
          onClick={(e) => {
            e.preventDefault()
            addItem({
              productId: id,
              title,
              brand,
              price: salePrice || originalPrice,
              imageUrl,
              quantity: 1,
            })
          }}
          title="Add to Cart"
          icon={<ShoppingBag size={15} />}
        >
          Add to Cart
        </Button>
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
