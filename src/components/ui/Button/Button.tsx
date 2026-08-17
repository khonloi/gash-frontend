import React from 'react'
import styles from './Button.module.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'sharp' | 'pill-green' | 'pill-navy' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  icon?: React.ReactNode
}

export function Button({
  variant = 'sharp',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </button>
  )
}
