import React from 'react';
import { cn } from '@/lib/cn';
import styles from './SectionHeading.module.css';

export interface SectionHeadingProps {
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  align?: 'left' | 'center';
  noMargin?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  children,
  subtitle,
  as: Component = 'h2',
  align = 'left',
  noMargin = false,
  action,
  className = '',
}: SectionHeadingProps) {
  const isCentered = align === 'center';

  return (
    <div
      className={cn(
        styles.wrapper,
        isCentered && styles.wrapperCentered,
        noMargin && styles.noMargin,
        className
      )}
    >
      <div className={cn(styles.textGroup, isCentered && styles.centered)}>
        <Component className={cn(styles.heading, isCentered && styles.centeredHeading)}>
          {children}
        </Component>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
