import React from 'react';
import { Sparkles } from 'lucide-react';
import { SectionHeading, CategoryCircle } from '@/components/ui';
import { fetchProductStats } from '@/services/productService';
import styles from '@/app/page.module.css';

export const CATEGORY_IMAGES: Record<string, string> = {
  running:
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=400&q=80',
  footwear:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
  shoes:
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
  apparel:
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
  training:
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
  accessories:
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80',
  football:
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
  basketball:
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=400&q=80',
  tennis:
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=400&q=80',
  swimming:
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
};

export const DEFAULT_CATEGORIES = [
  { title: 'Running', href: '/collections/running', imageUrl: CATEGORY_IMAGES.running },
  { title: 'Footwear', href: '/collections/footwear', imageUrl: CATEGORY_IMAGES.footwear },
  { title: 'Apparel', href: '/collections/apparel', imageUrl: CATEGORY_IMAGES.apparel },
  { title: 'Training', href: '/collections/training', imageUrl: CATEGORY_IMAGES.training },
  { title: 'Accessories', href: '/collections/accessories', imageUrl: CATEGORY_IMAGES.accessories },
  { title: 'Football', href: '/collections/football', imageUrl: CATEGORY_IMAGES.football },
];

export function CategorySectionSkeleton() {
  return (
    <section className={styles.categorySection}>
      <div className="container">
        <SectionHeading>Shop by Category</SectionHeading>
        <div className={styles.categoryGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                className="skeleton"
                style={{ width: '120px', height: '120px', borderRadius: '50%' }}
              />
              <div className="skeleton" style={{ width: '80px', height: '20px' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function DynamicCategorySection() {
  const stats = await fetchProductStats();
  let categories = stats.map((s) => {
    const name = String(s.category || 'Other');
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const imageUrl = CATEGORY_IMAGES[slug] || CATEGORY_IMAGES.running;
    return {
      title: name,
      href: `/collections/${slug}`,
      imageUrl,
      icon: <Sparkles size={18} />,
    };
  });

  if (categories.length === 0) {
    categories = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      icon: <Sparkles size={18} />,
    }));
  }

  return (
    <section className={styles.categorySection}>
      <div className="container">
        <SectionHeading>Shop by Category</SectionHeading>
        <div className={styles.categoryGrid}>
          {categories.slice(0, 6).map((cat) => (
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
