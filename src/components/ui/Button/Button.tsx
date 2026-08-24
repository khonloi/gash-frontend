import React from 'react'
import { cn } from '@/lib/cn'
import styles from './Button.module.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'sharp' | 'pill-green' | 'pill-navy' | 'outline' | 'ghost' | 'primary' | 'success' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  fullWidth?: boolean
  children?: React.ReactNode
  icon?: React.ReactNode
  as?: any
  href?: string
  target?: string
  rel?: string
}

export const Button = React.forwardRef<any, ButtonProps>(
  (
    {
      variant = 'sharp',
      size = 'md',
      fullWidth = false,
      children,
      icon,
      className = '',
      as: Component = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          fullWidth && styles.fullWidth,
          className
        )}
        {...props}
      >
        {children && <span>{children}</span>}
        {icon && <span className={styles.icon}>{icon}</span>}
      </Component>
    )
  }
)

Button.displayName = 'Button'
