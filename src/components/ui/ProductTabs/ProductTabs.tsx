'use client'

import React, { useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import styles from './ProductTabs.module.css'

interface ProductTabsProps {
  description: string | string[]
  specs: Record<string, string>
}

type TabKey = 'desc' | 'specs' | 'policy'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'desc', label: 'Description' },
  { key: 'specs', label: 'Specifications' },
  { key: 'policy', label: 'Return Policy' },
]

export function ProductTabs({ description, specs }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('desc')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % TABS.length
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length
    } else if (e.key === 'Home') {
      nextIndex = 0
    } else if (e.key === 'End') {
      nextIndex = TABS.length - 1
    } else {
      return
    }

    e.preventDefault()
    const nextTab = TABS[nextIndex]
    setActiveTab(nextTab.key)
    const targetBtn = document.getElementById(`tab-${nextTab.key}`)
    targetBtn?.focus()
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabList} role="tablist" aria-label="Product Information">
        {TABS.map((tab, idx) => {
          const isSelected = activeTab === tab.key
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`tabpanel-${tab.key}`}
              tabIndex={isSelected ? 0 : -1}
              className={`${styles.tabBtn} ${isSelected ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'desc' && (
          <div
            id="tabpanel-desc"
            role="tabpanel"
            aria-labelledby="tab-desc"
            tabIndex={0}
            className={styles.contentPane}
          >
            {typeof description === 'string' ? (
              <div 
                className={styles.htmlDescription} 
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} 
              />
            ) : Array.isArray(description) ? (
              <ul className={styles.descList}>
                {description.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {activeTab === 'specs' && (
          <div
            id="tabpanel-specs"
            role="tabpanel"
            aria-labelledby="tab-specs"
            tabIndex={0}
            className={styles.contentPane}
          >
            <div className={styles.tableWrapper}>
              <table className={styles.specsTable}>
                <tbody>
                  {Object.entries(specs).map(([key, value]) => (
                    <tr key={key}>
                      <td className={styles.specKey}>{key}</td>
                      <td className={styles.specValue}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'policy' && (
          <div
            id="tabpanel-policy"
            role="tabpanel"
            aria-labelledby="tab-policy"
            tabIndex={0}
            className={styles.contentPane}
          >
            <p><strong>1. Return Conditions:</strong> Products must be unwashed, unworn, and have original tags and packaging intact.</p>
            <p><strong>2. Timeframe:</strong> Returns are accepted within 30 days of successful delivery.</p>
            <p><strong>3. Shipping Fees:</strong> Free return shipping for items with manufacturing defects or incorrect deliveries.</p>
            <p>Please contact customer support for further assistance.</p>
          </div>
        )}
      </div>
    </div>
  )
}
