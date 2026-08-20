import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import styles from './Button.module.css'

// Utility function to merge classes using clsx (we can expand this later if we add tailwind-merge)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'sharp' | 'pill-green' | 'pill-navy' | 'outline' | 'ghost' | 'primary'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  children?: React.ReactNode
  icon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'sharp', size = 'md', children, icon, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          styles.button,
          styles[variant],
          styles[size],
          className
        )}
        {...props}
      >
        {children && <span>{children}</span>}
        {icon && <span className={styles.icon}>{icon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
