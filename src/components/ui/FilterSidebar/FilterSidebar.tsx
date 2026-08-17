'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
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
}

export function FilterSidebar({ categories, activeFilters, onFilterChange }: FilterSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  )

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Filter</h2>
      </div>

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
    </aside>
  )
}
