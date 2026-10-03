'use client';

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import styles from './CollectionControlBar.module.css';

export interface CollectionControlBarProps {
  totalCount: number;
  sortValue: string;
  onSortChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
}

export function CollectionControlBar({
  totalCount,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange,
  className = '',
}: CollectionControlBarProps) {
  return (
    <div className={`${styles.controlBar} ${className}`}>
      <div className={styles.left}>
        <span className={styles.productCount}>
          <strong className={styles.countNumber}>{totalCount}</strong> Products
        </span>
      </div>

      <div className={styles.right}>
        <div className={styles.sortWrapper}>
          <label htmlFor="sort-select" className={styles.sortLabel}>
            Sort by:
          </label>
          <div className={styles.selectWrapper}>
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
        </div>

        <div className={styles.viewToggle} role="group" aria-label="View mode">
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <List size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
