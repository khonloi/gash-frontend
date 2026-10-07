import React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import styles from './SportCard.module.css';

export interface SportCardProps {
  title: string;
  imageUrl: string;
  href?: string;
}

const DEFAULT_SPORT_IMAGE =
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

export function SportCard({ title, imageUrl, href = '#' }: SportCardProps) {
  const safeImage = imageUrl && imageUrl.trim().length > 0 ? imageUrl : DEFAULT_SPORT_IMAGE;

  return (
    <Card href={href} variant="plain" className={styles.card} aria-label={`Explore ${title} gear`}>
      <Image
        src={safeImage}
        alt={title}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        className={styles.bgImage}
      />
      <div className={styles.overlay} />

      <div className={styles.titleWrapper}>
        <span className={styles.title}>{title}</span>
        <Play size={10} fill="currentColor" className={styles.icon} />
      </div>
    </Card>
  );
}
