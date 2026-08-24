'use client'

import React from 'react'
import { cn } from '@/lib/cn'
import styles from './RadioGroup.module.css'

export interface RadioOption {
  value: string
  title: React.ReactNode
  description?: React.ReactNode
  rightElement?: React.ReactNode
  disabled?: boolean
}

export interface RadioGroupProps {
  name: string
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  className?: string
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  className = '',
}: RadioGroupProps) {
  return (
    <div className={cn(styles.group, className)} role="radiogroup">
      {options.map((opt) => {
        const isSelected = value === opt.value
        return (
          <label
            key={opt.value}
            className={cn(
              styles.option,
              isSelected && styles.selected,
              opt.disabled && styles.disabled
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              disabled={opt.disabled}
              onChange={() => onChange(opt.value)}
              className={styles.radioInput}
            />
            <div className={styles.content}>
              <span className={styles.title}>{opt.title}</span>
              {opt.description && (
                <span className={styles.description}>{opt.description}</span>
              )}
            </div>
            {opt.rightElement && <div className={styles.right}>{opt.rightElement}</div>}
          </label>
        )
      })}
    </div>
  )
}
