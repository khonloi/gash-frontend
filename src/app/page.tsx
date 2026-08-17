'use client'

import styles from './page.module.css'
import { Header } from '@/components/layout/Header/Header'
import { useCartStore } from '@/store/useCartStore'

export default function Home() {
  const addItem = useCartStore((state) => state.addItem)

  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Elevate Your <span className="gradient-text">Performance</span>
            </h1>
            <p className={styles.subtitle}>
              Discover premium athletic gear designed to push your boundaries. Experience unmatched quality and style for the modern athlete.
            </p>
            <div className={styles.actions}>
              <button className={styles.primaryButton}>Shop Collection</button>
              <button className={styles.secondaryButton} onClick={addItem}>
                Add Demo Item to Cart
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
