import React from 'react';
import { SectionHeading, SportCard } from '@/components/ui';
import { fetchProductStats } from '@/services/productService';
import styles from '@/app/page.module.css';

export const DEFAULT_SPORTS = [
  {
    title: 'RUNNING',
    href: '/collections/running',
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'FOOTBALL',
    href: '/collections/football',
    imageUrl:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'BASKETBALL',
    href: '/collections/basketball',
    imageUrl:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'TRAINING',
    href: '/collections/training',
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'TENNIS',
    href: '/collections/tennis',
    imageUrl:
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'SWIMMING',
    href: '/collections/swimming',
    imageUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
  },
];

export async function DynamicSportsSection() {
  const stats = await fetchProductStats();
  let sports = stats
    .map((s) => {
      const title = (s.category || '').toUpperCase();
      const slug = s.category?.toLowerCase().replace(/\s+/g, '-') || 'all';
      const defaultMatch = DEFAULT_SPORTS.find((d) => d.title === title);
      return {
        title,
        href: `/collections/${slug}`,
        imageUrl: defaultMatch?.imageUrl || DEFAULT_SPORTS[0].imageUrl,
      };
    })
    .filter((s) => Boolean(s.title));

  if (sports.length === 0) {
    sports = DEFAULT_SPORTS;
  }

  return (
    <section className={styles.sportsSection}>
      <div className="container">
        <SectionHeading>Favorite Sports</SectionHeading>
        <div className={styles.sportsGrid}>
          {sports.map((sport) => (
            <SportCard
              key={sport.title}
              title={sport.title}
              href={sport.href}
              imageUrl={sport.imageUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
