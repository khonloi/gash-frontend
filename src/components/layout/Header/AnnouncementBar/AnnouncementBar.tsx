import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import styles from './AnnouncementBar.module.css'

export function AnnouncementBar() {
  return (
    <div className={styles.bar}>
      <div className={`container ${styles.content}`}>
        <span className={styles.text}>
          <strong>ADIDAS | UP TO 40% OFF</strong> - Discover the hottest sportswear, running shoes & gear
        </span>
        <Link href="#" className={styles.cta}>
          <span>Shop Now</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}
