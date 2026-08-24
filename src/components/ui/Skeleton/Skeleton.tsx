import React from 'react'
import { cn } from '@/lib/cn'
import styles from './Skeleton.module.css'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  borderRadius?: string | number
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  borderRadius,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const dynamicStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    ...style,
  }

  return (
    <div
      className={cn(styles.skeleton, styles[variant], className)}
      style={dynamicStyle}
      aria-hidden="true"
      {...props}
    />
  )
}
