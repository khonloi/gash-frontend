'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import styles from './Checkbox.module.css'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: React.ReactNode
  count?: number
  disabled?: boolean
  className?: string
  id?: string
  name?: string
}

export function Checkbox({
  checked,
  onChange,
  label,
  count,
  disabled = false,
  className = '',
  id,
  name,
}: CheckboxProps) {
  return (
    <label className={cn(styles.label, disabled && styles.disabled, className)}>
      <input
        id={id}
        name={name}
        type="checkbox"
        className={styles.hiddenInput}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className={cn(styles.box, checked && styles.checked)}>
        {checked && <Check size={12} strokeWidth={3} />}
      </div>
      {label && <span className={styles.text}>{label}</span>}
      {count !== undefined && <span className={styles.count}>({count})</span>}
    </label>
  )
}
