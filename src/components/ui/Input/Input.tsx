import React from 'react'
import { cn } from '@/lib/cn'
import styles from './Input.module.css'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'sm' | 'md' | 'lg'
  hasError?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', inputSize = 'md', hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          styles.input,
          styles[inputSize],
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
