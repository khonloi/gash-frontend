import React from 'react';
import { SectionHeading, SportCard } from '@/components/ui';
import { fetchProductStats } from '@/services/productService';
import styles from '@/app/page.module.css';

export const SPORT_IMAGES: Record<string, string> = {
  RUNNING: '/images/sports/sport-running.png',
  FOOTBALL: '/images/sports/sport-football.png',
  BASKETBALL: '/images/sports/sport-basketball.png',
  TRAINING: '/images/sports/sport-training.png',
  TENNIS: '/images/sports/sport-tennis.png',
  SWIMMING: '/images/sports/sport-swimming.png',
  OUTDOOR: '/images/sports/sport-outdoor.png',
  CLIMBING: '/images/climbing.png',
  APPAREL: '/images/sports/sport-apparel.png',
  FOOTWEAR: '/images/sports/sport-footwear.png',
  ACCESSORIES: '/images/sports/sport-accessories.png',
};

export const DEFAULT_SPORTS = [
  {
    title: 'RUNNING',
    href: '/collections/running',
    imageUrl: SPORT_IMAGES.RUNNING,
  },
  {
    title: 'FOOTBALL',
    href: '/collections/football',
    imageUrl: SPORT_IMAGES.FOOTBALL,
  },
  {
    title: 'BASKETBALL',
    href: '/collections/basketball',
    imageUrl: SPORT_IMAGES.BASKETBALL,
  },
  {
    title: 'TRAINING',
    href: '/collections/training',
    imageUrl: SPORT_IMAGES.TRAINING,
  },
  {
    title: 'TENNIS',
    href: '/collections/tennis',
    imageUrl: SPORT_IMAGES.TENNIS,
  },
  {
    title: 'SWIMMING',
    href: '/collections/swimming',
    imageUrl: SPORT_IMAGES.SWIMMING,
  },
];

const SPORT_DISCIPLINES = new Set([
  'RUNNING',
  'FOOTBALL',
  'SWIMMING',
  'TRAINING',
  'OUTDOOR',
  'CLIMBING',
  'BASKETBALL',
  'TENNIS',
]);

export async function DynamicSportsSection() {
  const stats = await fetchProductStats();
  const mappedStats = stats
    .map((s) => {
      const title = (s.category || '').toUpperCase();
      const slug = s.category?.toLowerCase().replace(/\s+/g, '-') || 'all';
      const defaultMatch = DEFAULT_SPORTS.find((d) => d.title === title);
      return {
        title,
        href: `/collections/${slug}`,
        imageUrl: SPORT_IMAGES[title] || defaultMatch?.imageUrl || DEFAULT_SPORTS[0].imageUrl,
      };
    })
    .filter((s) => Boolean(s.title));

  const sportDisciplines = mappedStats.filter((s) => SPORT_DISCIPLINES.has(s.title));
  const seenTitles = new Set(sportDisciplines.map((s) => s.title));
  const backfilled = [...sportDisciplines];

  for (const fallback of DEFAULT_SPORTS) {
    if (backfilled.length >= 6) break;
    if (!seenTitles.has(fallback.title)) {
      backfilled.push(fallback);
      seenTitles.add(fallback.title);
    }
  }

  const sports = backfilled.slice(0, 6);

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
