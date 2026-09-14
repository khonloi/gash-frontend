import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './CategoryCircle.module.css'

export interface CategoryCircleProps {
  title: string
  href: string
  imageUrl: string
  icon?: React.ReactNode
}

export function CategoryCircle({ title, href, imageUrl, icon }: CategoryCircleProps) {
  return (
    <Link href={href} className={styles.categoryItem}>
      <div className={styles.circleContainer}>
        <Image
          src={imageUrl}
          alt={title}
          width={140}
          height={140}
          className={styles.image}
        />
        {icon && (
          <div className={styles.iconBadge}>
            {icon}
          </div>
        )}
      </div>
      <span className={styles.title}>{title}</span>
    </Link>
  )
}
