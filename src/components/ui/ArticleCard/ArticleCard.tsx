import React from 'react';
import Image from 'next/image';
import { ArrowRight, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Card } from '@/components/ui/Card';
import styles from './ArticleCard.module.css';

export interface ArticleCardProps {
  title: string;
  category: string;
  date: string;
  imageUrl: string;
  href?: string;
  readTime?: string;
}

export function ArticleCard({
  title,
  category,
  date,
  imageUrl,
  href = '#',
  readTime = '4 min read',
}: ArticleCardProps) {
  return (
    <Card href={href} variant="default" className={styles.card}>
      <div className={styles.imageContainer}>
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
        />
        <Badge variant="secondary" size="sm" className={styles.categoryBadge}>
          {category}
        </Badge>
      </div>

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <Calendar size={13} />
            {date}
          </span>
          <span className={styles.dot}>•</span>
          <span className={styles.metaItem}>{readTime}</span>
        </div>

        <h3 className={styles.title}>{title}</h3>

        <div className={styles.readMore}>
          <span>Read Article</span>
          <ArrowRight size={14} className={styles.arrow} />
        </div>
      </div>
    </Card>
  );
}
