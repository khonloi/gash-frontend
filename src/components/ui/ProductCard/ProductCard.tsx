'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useToastStore } from '@/store/useToastStore'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { formatPrice } from '@/lib/format'
import styles from './ProductCard.module.css'

export interface ProductCardProps {
  id: string
  handle?: string
  brand: string
  title: string
  originalPrice: number
  salePrice: number
  discountPercent?: number
  imageUrl?: string
  category?: string
}

export function ProductCard({
  id,
  handle,
  brand,
  title,
  originalPrice,
  salePrice,
  discountPercent,
  imageUrl,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const addToast = useToastStore((state) => state.addToast)
  const productSlug = handle || id

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {discountPercent && (
          <Badge variant="destructive" className={styles.discountBadge}>-{discountPercent}%</Badge>
        )}
        <Link href={`/products/${productSlug}`} className={styles.imageLink} aria-label={`View ${title}`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className={styles.image}
            />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}
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
              imageUrl: imageUrl || '',
              quantity: 1,
            })
            addToast(`Added "${title}" to your cart`, 'success')
          }}
          title="Add to Cart"
          aria-label={`Add ${title} to Cart`}
          icon={<ShoppingBag size={15} />}
        >
          Add to Cart
        </Button>
      </div>

      <div className={styles.content}>
        <span className={styles.brand}>{brand}</span>
        <Link href={`/products/${productSlug}`} className={styles.titleLink}>
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
