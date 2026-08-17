import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import styles from './BrandCollectionCard.module.css'

export interface BrandCollectionCardProps {
  brand: string
  title: string
  imageUrl: string
  href?: string
  badgeText?: string
}

export function BrandCollectionCard({
  brand,
  title,
  imageUrl,
  href = '#',
  badgeText,
}: BrandCollectionCardProps) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.header}>
        {badgeText && <span className={styles.badge}>{badgeText}</span>}
        <span className={styles.brand}>{brand}</span>
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={title} className={styles.image} />
      </div>

      <div className={styles.footer}>
        <span className={styles.ctaText}>SHOP NOW</span>
        <ChevronRight size={16} className={styles.chevron} />
      </div>
    </Link>
  )
}
