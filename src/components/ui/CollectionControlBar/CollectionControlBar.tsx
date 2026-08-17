'use client'

import React from 'react'
import { LayoutGrid, List } from 'lucide-react'
import styles from './CollectionControlBar.module.css'

interface CollectionControlBarProps {
  totalCount: number
  sortValue: string
  onSortChange: (value: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export function CollectionControlBar({
  totalCount,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange
}: CollectionControlBarProps) {
  return (
    <div className={styles.controlBar}>
      <div className={styles.left}>
        <span className={styles.productCount}>{totalCount} Products</span>
      </div>
      
      <div className={styles.right}>
        <div className={styles.sortWrapper}>
          <label htmlFor="sort-select" className={styles.sortLabel}>Sort by:</label>
          <select 
            id="sort-select"
            className={styles.sortSelect}
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
            <option value="best_selling">Best Selling</option>
          </select>
        </div>

        <div className={styles.viewToggle}>
          <button 
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
          >
            <List size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
