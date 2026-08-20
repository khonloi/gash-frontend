'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Check, SlidersHorizontal } from 'lucide-react'
import styles from './FilterSidebar.module.css'

export type FilterOption = {
  id: string
  label: string
  count?: number
  colorCode?: string // For color swatches
}

export type FilterCategory = {
  id: string
  title: string
  options: FilterOption[]
  type: 'checkbox' | 'color'
}

export type FilterState = Record<string, string[]>

interface FilterSidebarProps {
  categories: FilterCategory[]
  activeFilters: FilterState
  onFilterChange: (categoryId: string, optionId: string) => void
  onClearFilters?: () => void
}

export function FilterSidebar({ categories, activeFilters, onFilterChange, onClearFilters }: FilterSidebarProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  )

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const totalActiveFilters = Object.values(activeFilters).reduce(
    (acc, arr) => acc + (arr?.length || 0),
    0
  )

  return (
    <aside className={styles.sidebar}>
      {/* Mobile Accordion Header Button */}
      <button 
        className={styles.mobileToggleBtn}
        onClick={() => setIsMobileExpanded(prev => !prev)}
        aria-expanded={isMobileExpanded}
      >
        <div className={styles.mobileToggleLeft}>
          <SlidersHorizontal size={18} />
          <span className={styles.title}>Filter Products</span>
          {totalActiveFilters > 0 && (
            <span className={styles.activeBadge}>{totalActiveFilters}</span>
          )}
        </div>
        <div className={styles.mobileToggleRight}>
          <span className={styles.toggleStatus}>
            {isMobileExpanded ? 'Hide' : 'Show'}
          </span>
          <ChevronDown 
            size={18} 
            className={`${styles.mobileChevron} ${isMobileExpanded ? styles.chevronRotated : ''}`} 
          />
        </div>
      </button>

      {/* Desktop Static Header */}
      <div className={styles.desktopHeader}>
        <div className={styles.desktopHeaderContent}>
          <SlidersHorizontal size={18} />
          <h2 className={styles.title}>Filter</h2>
        </div>
        {totalActiveFilters > 0 && (
          <span className={styles.activeBadge}>{totalActiveFilters}</span>
        )}
      </div>

      {/* Categories Accordion */}
      <div className={`${styles.categoriesWrapper} ${isMobileExpanded ? styles.categoriesExpanded : ''}`}>
        <div className={styles.categories}>
        {categories.map(category => {
          const isExpanded = expandedCategories[category.id]
          
          return (
            <div key={category.id} className={styles.category}>
              <button 
                className={styles.categoryHeader} 
                onClick={() => toggleCategory(category.id)}
                aria-expanded={isExpanded}
              >
                <span className={styles.categoryTitle}>{category.title}</span>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isExpanded && (
                <div className={styles.optionsList}>
                  {category.type === 'checkbox' && category.options.map(option => {
                    const isActive = activeFilters[category.id]?.includes(option.id)
                    return (
                      <label key={option.id} className={styles.checkboxLabel}>
                        <div className={`${styles.checkbox} ${isActive ? styles.checkboxActive : ''}`}>
                          {isActive && <Check size={12} strokeWidth={3} />}
                        </div>
                        <input
                          type="checkbox"
                          className={styles.hiddenInput}
                          checked={isActive || false}
                          onChange={() => onFilterChange(category.id, option.id)}
                        />
                        <span className={styles.optionLabel}>{option.label}</span>
                        {option.count !== undefined && (
                          <span className={styles.optionCount}>({option.count})</span>
                        )}
                      </label>
                    )
                  })}

                  {category.type === 'color' && (
                    <div className={styles.colorGrid}>
                      {category.options.map(option => {
                        const isActive = activeFilters[category.id]?.includes(option.id)
                        return (
                          <button
                            key={option.id}
                            className={`${styles.colorButton} ${isActive ? styles.colorActive : ''}`}
                            onClick={() => onFilterChange(category.id, option.id)}
                            title={option.label}
                            aria-label={`Select color ${option.label}`}
                          >
                            <span 
                              className={styles.colorSwatch} 
                              style={{ backgroundColor: option.colorCode || '#ccc' }} 
                            />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </aside>
  )
}
