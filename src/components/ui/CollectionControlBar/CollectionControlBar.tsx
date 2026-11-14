'use client';

import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Select, SelectOption } from '@/components/ui/Select/Select';
import styles from './CollectionControlBar.module.css';

const SORT_OPTIONS: SelectOption[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'best_selling', label: 'Best Selling' },
];

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
        <span className={`${styles.productCount} tabular-nums`}>
          <strong className={styles.countNumber}>{totalCount}</strong> Products
        </span>
      </div>

      <div className={styles.right}>
        <div className={styles.sortWrapper}>
          <label htmlFor="sort-select" className={styles.sortLabel}>
            Sort by:
          </label>
          <Select
            id="sort-select"
            selectSize="md"
            containerClassName={styles.selectContainer}
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            options={SORT_OPTIONS}
          />
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
