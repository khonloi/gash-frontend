import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'
import styles from './SportCard.module.css'

export interface SportCardProps {
  title: string
  imageUrl: string
  href?: string
}

export function SportCard({ title, imageUrl, href = '#' }: SportCardProps) {
  return (
    <Link href={href} className={styles.card}>
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        className={styles.bgImage}
      />
      <div className={styles.overlay} />

      <div className={styles.titleWrapper}>
        <span className={styles.title}>{title}</span>
        <Play size={10} fill="currentColor" className={styles.icon} />
      </div>
    </Link>
  )
}
