import React from 'react'
import { cn } from '@/lib/cn'
import styles from './SectionHeading.module.css'

export interface SectionHeadingProps {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4'
  noMargin?: boolean
  action?: React.ReactNode
  className?: string
}

export function SectionHeading({
  children,
  as: Component = 'h2',
  noMargin = false,
  action,
  className = '',
}: SectionHeadingProps) {
  if (action) {
    return (
      <div className={cn(styles.wrapper, noMargin && styles.noMargin, className)}>
        <Component className={styles.heading}>{children}</Component>
        <div className={styles.action}>{action}</div>
      </div>
    )
  }

  return (
    <Component
      className={cn(
        styles.heading,
        noMargin && styles.noMargin,
        className
      )}
    >
      {children}
    </Component>
  )
}
