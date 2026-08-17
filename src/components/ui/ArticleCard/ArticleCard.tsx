import React from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import styles from './ArticleCard.module.css'

export interface ArticleCardProps {
  title: string
  category: string
  date: string
  imageUrl: string
  href?: string
  readTime?: string
}

export function ArticleCard({
  title,
  category,
  date,
  imageUrl,
  href = '#',
  readTime = '4 min read',
}: ArticleCardProps) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={title} className={styles.image} />
        <span className={styles.category}>{category}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Calendar size={13} />
            {date}
          </span>
          <span className={styles.dot}>•</span>
          <span className={styles.metaItem}>{readTime}</span>
        </div>

        <h3 className={styles.title}>{title}</h3>

        <div className={styles.readMore}>
          <span>Read Article</span>
          <ArrowRight size={14} className={styles.arrow} />
        </div>
      </div>
    </Link>
  )
}
