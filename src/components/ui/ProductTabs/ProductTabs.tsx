'use client'

import React, { useState } from 'react'
import styles from './ProductTabs.module.css'

interface ProductTabsProps {
  description: string[]
  specs: Record<string, string>
}

export function ProductTabs({ description, specs }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'policy'>('desc')

  return (
    <div className={styles.container}>
      <div className={styles.tabList}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'desc' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('desc')}
        >
          Description
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'specs' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('specs')}
        >
          Specifications
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'policy' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('policy')}
        >
          Return Policy
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'desc' && (
          <div className={styles.contentPane}>
            <ul className={styles.descList}>
              {description.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className={styles.contentPane}>
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
        )}

        {activeTab === 'policy' && (
          <div className={styles.contentPane}>
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
