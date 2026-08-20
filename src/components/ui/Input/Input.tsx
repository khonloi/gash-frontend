import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import styles from './Input.module.css'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          styles.input,
          hasError && styles.inputError,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
