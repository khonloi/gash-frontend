'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import styles from './HeroCarousel.module.css';

interface SlideData {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  dateRange: string;
  ctaText: string;
  href: string;
  bgGradient: string;
  image: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    badge: 'EXTRA 15% OFF*',
    title: 'BACK TO YOUR ROUTINE',
    subtitle: 'Exclusive for new members - Get $15 off on your first order over $100',
    dateRange: 'Aug 6 - 19 (*Terms & conditions apply)',
    ctaText: 'SHOP NOW',
    href: '/collections/all',
    bgGradient: 'linear-gradient(135deg, #003CD6 0%, #001B6B 100%)',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    badge: 'ADIDAS SPECIAL SALE',
    title: 'ULTRA BOOST & RUNNING',
    subtitle: 'Elevate your speed and endurance with pinnacle energy-return technology',
    dateRange: 'Applied on selected styles only',
    ctaText: 'EXPLORE NOW',
    href: '/collections/running',
    bgGradient: 'linear-gradient(135deg, #0C1C30 0%, #1A365D 100%)',
    image:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 3,
    badge: 'NEW ARRIVALS 2026',
    title: 'SUMMER TRAINING GEAR',
    subtitle: '4-way stretch, ultra-breathable athletic apparel engineered for peak performance',
    dateRange: 'Buy 2 get 1 training accessory free',
    ctaText: 'VIEW COLLECTION',
    href: '/collections/training',
    bgGradient: 'linear-gradient(135deg, #005F73 0%, #0A9396 100%)',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, []);

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    if (mediaQuery?.matches || isPaused) return;

    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (document.hidden) return;
      timer = setInterval(() => {
        nextSlide();
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timer) clearInterval(timer);
      } else {
        startTimer();
      }
    };

    startTimer();

    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches && timer) {
        clearInterval(timer);
      }
    };

    mediaQuery?.addEventListener('change', handleMotionChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      mediaQuery?.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [nextSlide, isPaused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  return (
    <section
      className={styles.heroSection}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.carouselContainer} aria-live={isPaused ? 'polite' : 'off'}>
        <div className={styles.slidesViewport}>
          {slides.map((s, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={s.id}
                className={`${styles.slideCard} ${isActive ? styles.activeSlide : ''}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${index + 1} of ${slides.length}: ${s.title}`}
                aria-hidden={!isActive}
                style={{ background: s.bgGradient }}
              >
                {/* Background Image with Overlay */}
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className={styles.bgImage}
                />
                <div className={styles.overlay} />

                {/* Slide Content constrained to container width */}
                <div className={styles.contentContainer}>
                  <div className={styles.content}>
                    <div className={styles.discountCallout}>
                      <span className={styles.highlightBadge}>{s.badge}</span>
                    </div>

                    <h1 className={styles.title}>{s.title}</h1>
                    <p className={styles.subtitle}>{s.subtitle}</p>
                    <span className={styles.dateRange}>{s.dateRange}</span>

                    <div className={styles.ctaWrapper}>
                      <Link href={s.href} className={styles.sharpCta} tabIndex={isActive ? 0 : -1}>
                        <span>{s.ctaText}</span>
                        <Play size={14} fill="currentColor" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prev / Next Arrows */}
        <button
          onClick={prevSlide}
          className={`${styles.arrowBtn} ${styles.prevBtn}`}
          aria-label="Previous slide"
          type="button"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className={`${styles.arrowBtn} ${styles.nextBtn}`}
          aria-label="Next slide"
          type="button"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dot Indicators */}
        <div className={styles.dots} role="tablist" aria-label="Carousel slides">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === currentSlide}
              aria-current={index === currentSlide ? 'true' : undefined}
              onClick={() => setCurrentSlide(index)}
              onKeyDown={handleKeyDown}
              className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Floating Best Price Circular Badge */}
        <div className={styles.badgeWrapper}>
          <Link
            href="/collections/all"
            className={styles.floatingPromoBadge}
            aria-label="Shop best deals collection"
          >
            <div className={styles.badgeCircle}>
              <span className={styles.badgeTop}>Best</span>
              <span className={styles.badgeBottom}>Deals</span>
              <div className={styles.badgePill}>
                <span>SHOP NOW</span>
                <Play size={10} fill="currentColor" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
