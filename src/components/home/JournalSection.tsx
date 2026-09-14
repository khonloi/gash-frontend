'use client';

import React, { useState } from 'react';
import { SectionHeading, ArticleCard } from '@/components/ui';
import { journalArticles } from '@/lib/mockData';
import styles from '@/app/page.module.css';

const FILTERS = ['All', 'Training', 'Running', 'Football', 'Swimming'] as const;

export function JournalSection() {
  const [journalFilter, setJournalFilter] = useState<string>('All');

  const filteredArticles =
    journalFilter === 'All'
      ? journalArticles
      : journalArticles.filter(
          (art) => art.category.toUpperCase() === journalFilter.toUpperCase()
        );

  return (
    <section className={styles.journalSection}>
      <div className="container">
        <div className={styles.journalHeader}>
          <SectionHeading>Sport & Performance Journal</SectionHeading>

          {/* Filter tabs */}
          <div className={styles.filterPills}>
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`${styles.filterPill} ${
                  journalFilter === filter ? styles.activePill : ''
                }`}
                onClick={() => setJournalFilter(filter)}
              >
                {filter === 'All' ? 'All Stories' : filter}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.articlesGrid}>
          {filteredArticles.map((article, idx) => (
            <ArticleCard key={idx} {...article} />
          ))}
        </div>
      </div>
    </section>
  );
}
