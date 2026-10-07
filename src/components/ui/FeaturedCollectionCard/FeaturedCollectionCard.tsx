import React from 'react';
import { Play } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Card } from '@/components/ui/Card';
import styles from './FeaturedCollectionCard.module.css';

export interface FeaturedCollectionCardProps {
  category: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  href?: string;
  brandsText?: string;
}

export function FeaturedCollectionCard({
  category,
  title,
  subtitle,
  imageUrl,
  href = '#',
  brandsText,
}: FeaturedCollectionCardProps) {
  return (
    <Card href={href} variant="plain" className={styles.card}>
      <div className={styles.bgImage} style={{ backgroundImage: `url(${imageUrl})` }} />
      <div className={styles.overlay} />

      <div className={styles.content}>
        {brandsText && <span className={styles.brandsText}>{brandsText}</span>}
        <Badge variant="outline" size="sm" className={styles.categoryBadge}>
          {category}
        </Badge>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <div className={styles.ctaWrapper}>
        <div className={styles.sharpCta}>
          <span>SHOP NOW</span>
          <Play size={12} fill="currentColor" />
        </div>
      </div>
    </Card>
  );
}
