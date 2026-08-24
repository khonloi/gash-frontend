'use client'

import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import styles from './QuantitySelector.module.css'

export interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  size = 'md',
  disabled = false,
  className = '',
  ariaLabel = 'Quantity selector',
}: QuantitySelectorProps) {
  const isMinDisabled = disabled || value <= min
  const isMaxDisabled = disabled || (max !== undefined && value >= max)

  const handleDecrease = () => {
    if (!isMinDisabled) {
      onChange(Math.max(min, value - 1))
    }
  }

  const handleIncrease = () => {
    if (!isMaxDisabled) {
      onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)
    }
  }

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

  return (
    <div
      className={cn(styles.wrapper, styles[size], className)}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={styles.btn}
        onClick={handleDecrease}
        disabled={isMinDisabled}
        aria-label="Decrease quantity"
      >
        <Minus size={iconSize} />
      </button>
      <span className={styles.value} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={styles.btn}
        onClick={handleIncrease}
        disabled={isMaxDisabled}
        aria-label="Increase quantity"
      >
        <Plus size={iconSize} />
      </button>
    </div>
  )
}
