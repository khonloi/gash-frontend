"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HeroCarousel } from "@/components/ui/HeroCarousel/HeroCarousel";
import { CategoryCircle } from "@/components/ui/CategoryCircle/CategoryCircle";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import { PromoBanner } from "@/components/ui/PromoBanner/PromoBanner";
import { BrandCollectionCard } from "@/components/ui/BrandCollectionCard/BrandCollectionCard";
import { FeaturedCollectionCard } from "@/components/ui/FeaturedCollectionCard/FeaturedCollectionCard";
import { SportCard } from "@/components/ui/SportCard/SportCard";
import { ArticleCard } from "@/components/ui/ArticleCard/ArticleCard";
import {
  Sparkles,
  Activity,
  Dumbbell,
  Mountain,
  Waves,
  Trophy,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Headphones,
  RotateCcw,
} from "lucide-react";
import {
  categories,
  hotProducts,
  newCollections,
  featuredCollections,
  favoriteSports,
  journalArticles,
  brands,
} from "@/lib/mockData";
import styles from "./page.module.css";

export default function Home() {
  const [journalFilter, setJournalFilter] = useState("All");

  const filteredArticles =
    journalFilter === "All"
      ? journalArticles
      : journalArticles.filter(
          (art) => art.category.toUpperCase() === journalFilter.toUpperCase(),
        );

  return (
    <main className={styles.main}>
      {/* 1. Hero Section Carousel */}
      <HeroCarousel />

      {/* 2. Categories Section */}
      <section className={styles.categorySection}>
        <div className="container">
          <h2 className="heading-section">Shop by Category</h2>
          <div className={styles.categoryGrid}>
            {categories.map((cat, idx) => (
              <CategoryCircle
                key={idx}
                title={cat.title}
                href={cat.href}
                imageUrl={cat.imageUrl}
                icon={cat.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Deals / Hot Products */}
      <section className={styles.productsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.titleWithIcon}>
              <h2 className="heading-section" style={{ marginBottom: 0 }}>
                Featured Deals
              </h2>
            </div>
            <Link href="/collections/all" className={styles.viewAllLink}>
              <span>View all products</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.productsGrid}>
            {hotProducts.map((prod) => (
              <ProductCard key={prod.id} {...prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Wide Campaign Banner 1 (Speedo Summer Splash) */}
      <PromoBanner
        badge="SUMMER SPLASH 2026"
        title="AQUATIC GEAR & CASHBACK VOUCHER"
        subtitle="Receive an instant $15 cashback voucher when purchasing any Speedo competition goggles, racing swimsuits, or anti-fog equipment."
        dateRange="Valid: Aug 15 - Sep 30, 2026 • Limited Stock Available"
        ctaText="EXPLORE SPEEDO"
        href="/collections/all"
        bgGradient="linear-gradient(135deg, #0052CC 0%, #001B6B 100%)"
        imageUrl="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80"
      />

      {/* 5. New Collections (Vertical Brand Spotlight Cards) */}
      <section className={styles.collectionsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="heading-section" style={{ marginBottom: 0 }}>
              New Collections
            </h2>
            <Link href="/collections/all" className={styles.viewAllLink}>
              <span>View all collections</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.collectionsGrid}>
            {newCollections.map((col, idx) => (
              <BrandCollectionCard key={idx} {...col} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Featured Collections (4 Square Grid with athlete overlays) */}
      <section className={styles.featuredGridSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className="heading-section" style={{ marginBottom: 0 }}>
              Featured Collections
            </h2>
          </div>

          <div className={styles.featuredFourGrid}>
            {featuredCollections.map((feat, idx) => (
              <FeaturedCollectionCard key={idx} {...feat} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Top Brands Grid */}
      <section className={styles.brandsSection}>
        <div className="container">
          <h2 className="heading-section">Top Featured Brands</h2>
          <div className={styles.brandsGrid}>
            {brands.map((brand, idx) => (
              <div key={idx} className={styles.brandBox}>
                <span className={styles.brandName}>{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Wide Campaign Banner 2 (Football Club Kits) */}
      <PromoBanner
        badge="SEASON 26/27 DROPS"
        title="OFFICIAL CLUB KITS & CUSTOM PRINTING"
        subtitle="Get your favorite club jersey with authentic player name and number printing. Premier League, La Liga, Serie A & Champions League editions."
        dateRange="Free Authentic League Badge with every purchase"
        ctaText="CUSTOMIZE YOUR JERSEY"
        href="/collections/all"
        reverse={true}
        bgGradient="linear-gradient(135deg, #0C1C30 0%, #153258 100%)"
        imageUrl="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80"
      />

      {/* 9. Favorite Sports (6 Athlete Lifestyle Cards) */}
      <section className={styles.sportsSection}>
        <div className="container">
          <h2 className="heading-section">Favorite Sports</h2>
          <div className={styles.sportsGrid}>
            {favoriteSports.map((sport, idx) => (
              <SportCard key={idx} {...sport} />
            ))}
          </div>
        </div>
      </section>

      {/* 10. Sport & Lifestyle Journal / News */}
      <section className={styles.journalSection}>
        <div className="container">
          <div className={styles.journalHeader}>
            <h2 className="heading-section" style={{ marginBottom: "1rem" }}>
              Sport & Performance Journal
            </h2>

            {/* Filter tabs */}
            <div className={styles.filterPills}>
              {["All", "Training", "Running", "Football", "Swimming"].map(
                (filter) => (
                  <button
                    key={filter}
                    className={`${styles.filterPill} ${
                      journalFilter === filter ? styles.activePill : ""
                    }`}
                    onClick={() => setJournalFilter(filter)}
                  >
                    {filter === "All" ? "All Stories" : filter}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className={styles.articlesGrid}>
            {filteredArticles.map((article, idx) => (
              <ArticleCard key={idx} {...article} />
            ))}
          </div>
        </div>
      </section>

      {/* 11. Trust / Value Guarantee Features */}
      <section className={styles.trustSection}>
        <div className={`container ${styles.trustGrid}`}>
          <div className={styles.trustItem}>
            <ShieldCheck size={32} className={styles.trustIcon} />
            <div>
              <h4>100% Authentic Guaranteed</h4>
              <p>Direct authorized partner of world leading sport brands</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <RotateCcw size={32} className={styles.trustIcon} />
            <div>
              <h4>30-Day Hassle-Free Returns</h4>
              <p>Easy size exchange and return policy on all unworn items</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <CreditCard size={32} className={styles.trustIcon} />
            <div>
              <h4>Secure & Flexible Payments</h4>
              <p>Encrypted checkout with cards, PayPal, and Apple Pay</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <Headphones size={32} className={styles.trustIcon} />
            <div>
              <h4>24/7 Athletic Support</h4>
              <p>Gear specialists ready to help you pick the right fit</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
