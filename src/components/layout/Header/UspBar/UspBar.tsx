import React from 'react'
import { Truck, RotateCcw, ShieldCheck, Ticket } from 'lucide-react'
import styles from './UspBar.module.css'

export function UspBar() {
  const usps = [
    {
      icon: <Truck size={20} className={styles.icon} />,
      text: 'Free delivery on orders over $50',
    },
    {
      icon: <RotateCcw size={20} className={styles.icon} />,
      text: 'Free 30-day easy returns',
    },
    {
      icon: <ShieldCheck size={20} className={styles.icon} />,
      text: '100% Genuine & Authentic guarantee',
    },
    {
      icon: <Ticket size={20} className={styles.icon} />,
      text: 'Sign up & get $10 voucher',
    },
  ]

  return (
    <div className={styles.uspSection}>
      <div className={`container ${styles.uspContainer}`}>
        {usps.map((usp, index) => (
          <div key={index} className={styles.uspItem}>
            {usp.icon}
            <span className={styles.uspText}>{usp.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
