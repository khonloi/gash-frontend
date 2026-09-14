"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import styles from "./HeroCarousel.module.css";

interface SlideData {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  dateRange: string;
  ctaText: string;
  bgGradient: string;
  image: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    badge: "EXTRA 15% OFF*",
    title: "BACK TO YOUR ROUTINE",
    subtitle:
      "Exclusive for new members - Get $15 off on your first order over $100",
    dateRange: "Aug 6 - 19 (*Terms & conditions apply)",
    ctaText: "SHOP NOW",
    bgGradient: "linear-gradient(135deg, #003CD6 0%, #001B6B 100%)",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    badge: "ADIDAS SPECIAL SALE",
    title: "ULTRA BOOST & RUNNING",
    subtitle:
      "Elevate your speed and endurance with pinnacle energy-return technology",
    dateRange: "Applied on selected styles only",
    ctaText: "EXPLORE NOW",
    bgGradient: "linear-gradient(135deg, #0C1C30 0%, #1A365D 100%)",
    image:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    badge: "NEW ARRIVALS 2026",
    title: "SUMMER TRAINING GEAR",
    subtitle:
      "4-way stretch, ultra-breathable athletic apparel engineered for peak performance",
    dateRange: "Buy 2 get 1 training accessory free",
    ctaText: "VIEW COLLECTION",
    bgGradient: "linear-gradient(135deg, #005F73 0%, #0A9396 100%)",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
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
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  const slide = slides[currentSlide];

  return (
    <div
      className={styles.heroSection}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.carouselContainer}>
        <div
          className={styles.slideCard}
          style={{ background: slide.bgGradient }}
        >
          {/* Background Image with Overlay */}
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={currentSlide === 0}
            sizes="100vw"
            className={styles.bgImage}
          />
          <div className={styles.overlay} />

          {/* Slide Content constrained to container width */}
          <div className={styles.contentContainer}>
            <div className={styles.content}>
              <div className={styles.discountCallout}>
                <span className={styles.highlightBadge}>{slide.badge}</span>
              </div>

              <h1 className={styles.title}>{slide.title}</h1>
              <p className={styles.subtitle}>{slide.subtitle}</p>
              <span className={styles.dateRange}>{slide.dateRange}</span>

              <div className={styles.ctaWrapper}>
                <button className={styles.sharpCta}>
                  <span>{slide.ctaText}</span>
                  <Play size={14} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>

          {/* Prev / Next Arrows */}
          <button
            onClick={prevSlide}
            className={`${styles.arrowBtn} ${styles.prevBtn}`}
            aria-label="Previous slide"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            onClick={nextSlide}
            className={`${styles.arrowBtn} ${styles.nextBtn}`}
            aria-label="Next slide"
          >
            <ChevronRight size={26} />
          </button>

          {/* Dot Indicators */}
          <div className={styles.dots}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ""}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Floating Best Price Circular Badge */}
        <div className={styles.badgeWrapper}>
          <div className={styles.floatingPromoBadge}>
            <div className={styles.badgeCircle}>
              <span className={styles.badgeTop}>Best</span>
              <span className={styles.badgeBottom}>Deals</span>
              <div className={styles.badgePill}>
                <span>SHOP NOW</span>
                <Play size={10} fill="currentColor" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
