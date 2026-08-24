import React from 'react'
import { cn } from '@/lib/cn'
import styles from './Badge.module.css'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'success'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div className={cn(styles.badge, styles[variant], className)} {...props} />
  )
}
