import React from 'react';
import { Sparkles } from 'lucide-react';
import { SectionHeading, CategoryCircle } from '@/components/ui';
import styles from '@/app/page.module.css';

export const CATEGORY_IMAGES: Record<string, string> = {
  climbing: '/images/climbing.png',
  football: '/images/football.png',
  running: '/images/running.png',
  swimming: '/images/swimming.png',
  training: '/images/training.png',
};

export const DEFAULT_CATEGORIES = [
  { title: 'Climbing', href: '/collections/climbing', imageUrl: CATEGORY_IMAGES.climbing },
  { title: 'Football', href: '/collections/football', imageUrl: CATEGORY_IMAGES.football },
  { title: 'Running', href: '/collections/running', imageUrl: CATEGORY_IMAGES.running },
  { title: 'Swimming', href: '/collections/swimming', imageUrl: CATEGORY_IMAGES.swimming },
  { title: 'Training', href: '/collections/training', imageUrl: CATEGORY_IMAGES.training },
];

export function CategorySectionSkeleton() {
  return (
    <section className={styles.categorySection}>
      <div className="container">
        <SectionHeading>Shop by Category</SectionHeading>
        <div className={styles.categoryGrid}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.categoryItemSkeleton}>
              <div className={`skeleton ${styles.categorySkeletonBox}`} />
              <div className={`skeleton ${styles.categoryTitleSkeleton}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function DynamicCategorySection() {
  const categories = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    icon: <Sparkles size={18} />,
  }));

  return (
    <section className={styles.categorySection}>
      <div className="container">
        <SectionHeading>Shop by Category</SectionHeading>
        <div className={styles.categoryGrid}>
          {categories.map((cat) => (
            <CategoryCircle
              key={cat.title}
              title={cat.title}
              href={cat.href}
              imageUrl={cat.imageUrl}
              icon={cat.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
