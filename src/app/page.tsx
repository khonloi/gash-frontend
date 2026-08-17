"use client";

import React, { useState } from "react";
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
import styles from "./page.module.css";

export default function Home() {
  const [journalFilter, setJournalFilter] = useState("All");

  // 1. Categories data
  const categories = [
    {
      title: "Lifestyle & Streetwear",
      href: "#",
      imageUrl:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80",
      icon: <Sparkles size={18} />,
    },
    {
      title: "Running",
      href: "#",
      imageUrl:
        "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=400&q=80",
      icon: <Activity size={18} />,
    },
    {
      title: "Training & Gym",
      href: "#",
      imageUrl:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
      icon: <Dumbbell size={18} />,
    },
    {
      title: "Outdoor & Hiking",
      href: "#",
      imageUrl:
        "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=400&q=80",
      icon: <Mountain size={18} />,
    },
    {
      title: "Swimming",
      href: "#",
      imageUrl:
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=400&q=80",
      icon: <Waves size={18} />,
    },
    {
      title: "Golf & Tennis",
      href: "#",
      imageUrl:
        "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=400&q=80",
      icon: <Trophy size={18} />,
    },
  ];

  // 2. Featured Hot Products (10 items = 2 complete rows of 5 on PC)
  const hotProducts = [
    {
      id: "1",
      brand: "ADIDAS",
      title: "Men's Ultraboost 5 Light Running Shoes Core Black",
      originalPrice: 190,
      salePrice: 133,
      discountPercent: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "2",
      brand: "NIKE",
      title: "Men's Air Zoom Pegasus 41 Volt Green Performance",
      originalPrice: 140,
      salePrice: 108,
      discountPercent: 23,
      imageUrl:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "3",
      brand: "UNDER ARMOUR",
      title: "Men's UA Tech 2.0 Short Sleeve Training Tee",
      originalPrice: 35,
      salePrice: 24.5,
      discountPercent: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "4",
      brand: "PUMA",
      title: "Women's Velocity Nitro 3 Fade Sunset Running Shoes",
      originalPrice: 135,
      salePrice: 94.5,
      discountPercent: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "5",
      brand: "ASICS",
      title: "Men's Gel-Kayano 31 Platinum Edition Road Running",
      originalPrice: 165,
      salePrice: 140,
      discountPercent: 15,
      imageUrl:
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "6",
      brand: "NEW BALANCE",
      title: "Unisex 574 Core Evergreen Classic Sneakers",
      originalPrice: 90,
      salePrice: 67.5,
      discountPercent: 25,
      imageUrl:
        "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "7",
      brand: "SPEEDO",
      title: "Fastskin Hyper Elite Anti-Glare Racing Goggles",
      originalPrice: 65,
      salePrice: 52,
      discountPercent: 20,
      imageUrl:
        "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "8",
      brand: "COLUMBIA",
      title: "Men's Watertight II Waterproof Packable Rain Jacket",
      originalPrice: 100,
      salePrice: 75,
      discountPercent: 25,
      imageUrl:
        "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "9",
      brand: "NIKE",
      title: "Brasilia 9.5 Training Backpack Medium 24L",
      originalPrice: 48,
      salePrice: 38.4,
      discountPercent: 20,
      imageUrl:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80",
    },
    {
      id: "10",
      brand: "ADIDAS",
      title: "Aeroready Lightweight Running Performance Cap",
      originalPrice: 25,
      salePrice: 20,
      discountPercent: 20,
      imageUrl:
        "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=500&q=80",
    },
  ];

  // 3. New Collections (Vertical Brand Spotlight Cards)
  const newCollections = [
    {
      brand: "ASICS",
      title: "BLAZEBLAST RUN",
      badgeText: "NEW IN",
      imageUrl:
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80",
      href: "#",
    },
    {
      brand: "COLUMBIA",
      title: "TRAIL RUN KONOS",
      imageUrl:
        "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=500&q=80",
      href: "#",
    },
    {
      brand: "UNDER ARMOUR",
      title: "HEARTBEAT TRAINER",
      badgeText: "BESTSELLER",
      imageUrl:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
      href: "#",
    },
    {
      brand: "ADIDAS",
      title: "CLUB JERSEYS 26/27",
      imageUrl:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80",
      href: "#",
    },
    {
      brand: "HOKA",
      title: "MARATHON SPEED FLY",
      badgeText: "HOT DROP",
      imageUrl:
        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=500&q=80",
      href: "#",
    },
  ];

  // 4. Featured Collections (4 Square Grid with athletic photo overlays)
  const featuredCollections = [
    {
      category: "TENNIS",
      title: "NEW COURT ARRIVALS",
      subtitle: "Engineered grip, stability & breathability",
      brandsText: "NIKE • ADIDAS • ASICS",
      imageUrl:
        "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80",
      href: "#",
    },
    {
      category: "LIFESTYLE",
      title: "STREETWEAR CULTURE",
      subtitle: "Everyday urban fashion meets athletic comfort",
      brandsText: "PUMA • CROCS • COLUMBIA",
      imageUrl:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
      href: "#",
    },
    {
      category: "TRAINING",
      title: "METCON & GYM ESSENTIALS",
      subtitle: "High-intensity durability & sweat-wicking gear",
      brandsText: "UNDER ARMOUR • NIKE PRO",
      imageUrl:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
      href: "#",
    },
    {
      category: "RUNNING",
      title: "MARATHON & TRACK PRO",
      subtitle: "Ultra-cushioned carbon plate race day shoes",
      brandsText: "HOKA • SAUCONY • NIKE ZOOM",
      imageUrl:
        "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80",
      href: "#",
    },
  ];

  // 5. Favorite Sports (6 Athlete Lifestyle Cards)
  const favoriteSports = [
    {
      title: "RUNNING",
      imageUrl:
        "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
    {
      title: "STREETWEAR",
      imageUrl:
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
    {
      title: "TRAINING & GYM",
      imageUrl:
        "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
    {
      title: "OUTDOOR & TRAIL",
      imageUrl:
        "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
    {
      title: "FOOTBALL",
      imageUrl:
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
    {
      title: "SWIMMING",
      imageUrl:
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
  ];

  // 6. Sport & Lifestyle Journal Articles
  const journalArticles = [
    {
      title: "Nike Free Metcon 7: The Hybrid Cross-Training King Tested",
      category: "TRAINING",
      date: "Aug 14, 2026",
      readTime: "5 min read",
      imageUrl:
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
    {
      title: "Asics Novablast 6 Review: Max Cushioning Energy Return",
      category: "RUNNING",
      date: "Aug 12, 2026",
      readTime: "4 min read",
      imageUrl:
        "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
    {
      title: "The Ultimate 26/27 Football Kit Collection & Authentic Badges",
      category: "FOOTBALL",
      date: "Aug 10, 2026",
      readTime: "6 min read",
      imageUrl:
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
    {
      title: "Speedo Fastskin Guide: Choosing the Right Competition Goggles",
      category: "SWIMMING",
      date: "Aug 08, 2026",
      readTime: "3 min read",
      imageUrl:
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=80",
      href: "#",
    },
  ];

  const filteredArticles =
    journalFilter === "All"
      ? journalArticles
      : journalArticles.filter(
          (art) => art.category.toUpperCase() === journalFilter.toUpperCase()
        );

  const brands = [
    "HOKA",
    "PUMA",
    "NIKE",
    "COLUMBIA",
    "UNDER ARMOUR",
    "ASICS",
    "ADIDAS",
    "TEVA",
    "SPEEDO",
    "ON RUNNING",
    "CROCS",
    "+30 MORE BRANDS",
  ];

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
            <a href="#" className={styles.viewAllLink}>
              <span>View all products</span>
              <ArrowRight size={16} />
            </a>
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
        href="#"
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
            <a href="#" className={styles.viewAllLink}>
              <span>View all collections</span>
              <ArrowRight size={16} />
            </a>
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
        href="#"
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
                )
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
