import React from 'react'
import Link from 'next/link'
import { Play } from 'lucide-react'
import styles from './PromoBanner.module.css'

export interface PromoBannerProps {
  badge?: string
  title: string
  subtitle: string
  dateRange?: string
  ctaText?: string
  href?: string
  bgGradient?: string
  imageUrl?: string
  reverse?: boolean
}

export function PromoBanner({
  badge,
  title,
  subtitle,
  dateRange,
  ctaText = 'SHOP NOW',
  href = '#',
  bgGradient = 'linear-gradient(135deg, #003CD6 0%, #001B6B 100%)',
  imageUrl,
  reverse = false,
}: PromoBannerProps) {
  return (
    <section className={styles.bannerSection}>
      <div className="container">
        <div
          className={`${styles.bannerCard} ${reverse ? styles.reverse : ''}`}
          style={{ background: bgGradient }}
        >
          {imageUrl && (
            <div
              className={styles.bgImage}
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}
          <div className={styles.overlay} />

          <div className={styles.content}>
            {badge && <span className={styles.badge}>{badge}</span>}
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>
            {dateRange && <span className={styles.dateRange}>{dateRange}</span>}

            <div className={styles.ctaWrapper}>
              <Link href={href} className={styles.sharpCta}>
                <span>{ctaText}</span>
                <Play size={14} fill="currentColor" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
