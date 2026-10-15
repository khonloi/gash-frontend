'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { isDemoModeActive, setDemoMode } from '@/lib/apiClient';
import { resetDemoState } from '@/demo/mockApiHandler';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Sparkles, X, RotateCcw } from 'lucide-react';
import styles from './DemoModeBanner.module.css';

const subscribeToStorage = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

export function DemoModeBanner() {
  const isMounted = useIsMounted();
  const isActive = useSyncExternalStore(
    subscribeToStorage,
    () => isDemoModeActive(),
    () => false
  );
  const [isOpen, setIsOpen] = useState(false);

  if (!isMounted) {
    return null;
  }

  const handleToggle = () => {
    const nextState = !isActive;
    setDemoMode(nextState);
    // Reload page to re-trigger server/client component requests with new mode
    window.location.reload();
  };

  const handleResetData = () => {
    resetDemoState();
    window.location.reload();
  };

  return (
    <aside className={styles.container} aria-label="Demo Mode Control Panel">
      <button
        type="button"
        className={styles.triggerButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="demo-panel-overlay"
      >
        <span
          className={`${styles.statusDot} ${isActive ? styles.statusDotActive : ''}`}
          aria-hidden="true"
        />
        <Sparkles size={14} aria-hidden="true" />
        <span>Demo: {isActive ? 'ON' : 'OFF'}</span>
      </button>

      {isOpen && (
        <div id="demo-panel-overlay" className={styles.modalOverlay} role="region">
          <div className={styles.header}>
            <div className={styles.title}>
              <Sparkles size={16} />
              <span>Offline Demo Mode</span>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close demo settings"
            >
              <X size={16} />
            </button>
          </div>

          <p className={styles.description}>
            When Demo Mode is enabled, all catalog queries, cart mutations, and checkout steps are
            simulated locally with stateful mock services.
          </p>

          <div className={styles.actionRow}>
            <span className={styles.toggleLabel}>Active Status</span>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              className={`${styles.toggleSwitch} ${isActive ? styles.toggleSwitchActive : ''}`}
              onClick={handleToggle}
              aria-label="Toggle Demo Mode"
            >
              <span
                className={`${styles.toggleSlider} ${isActive ? styles.toggleSliderActive : ''}`}
              />
            </button>
          </div>

          <button
            type="button"
            className={styles.resetButton}
            onClick={handleResetData}
            title="Reset in-memory cart, user, and orders to initial fixtures"
          >
            <RotateCcw size={12} style={{ display: 'inline', marginRight: '6px' }} />
            Reset Fixtures & State
          </button>
        </div>
      )}
    </aside>
  );
}
