'use client'

import React, { useEffect, useState } from 'react'
import { useToastStore } from '@/store/useToastStore'
import { Toast } from './Toast'
import styles from './Toast.module.css'

export function ToastContainer() {
  const { toasts } = useToastStore()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
