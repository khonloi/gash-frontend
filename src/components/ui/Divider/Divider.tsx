import React from 'react'
import { cn } from '@/lib/cn'
import styles from './Divider.module.css'

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

export function Divider({
  orientation = 'horizontal',
  className = '',
  ...props
}: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(styles.divider, styles[orientation], className)}
      {...props}
    />
  )
}
