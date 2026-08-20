import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import styles from './Badge.module.css'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'success'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div className={cn(styles.badge, styles[variant], className)} {...props} />
  )
}
