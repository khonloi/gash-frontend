'use client'

import Link from 'next/link'
import styles from './Header.module.css'
import { useCartStore } from '@/store/useCartStore'

export function Header() {
  const items = useCartStore((state) => state.items)

  return (
    <header className={styles.header}>
      <Link href="/" className={`${styles.logo} gradient-text`}>
        Jocksport
      </Link>
      <nav className={styles.nav}>
        <Link href="/collections" className={styles.navLink}>Collections</Link>
        <Link href="/about" className={styles.navLink}>About</Link>
        <button className={styles.cartButton}>
          Cart
          {items > 0 && <span className={styles.badge}>{items}</span>}
        </button>
      </nav>
    </header>
  )
}
