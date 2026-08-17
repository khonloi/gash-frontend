"use client";

import React from "react";
import { HeroCarousel } from "@/components/ui/HeroCarousel/HeroCarousel";
import { CategoryCircle } from "@/components/ui/CategoryCircle/CategoryCircle";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import {
  Sparkles,
  Activity,
  Dumbbell,
  Mountain,
  Waves,
  Trophy,
  Flame,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Headphones,
  Sparkle,
} from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  // Categories data matching athletic circular style
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

  // Featured Hot Products (10 items = 2 complete rows of 5 on PC)
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

  const brands = [
    "NIKE",
    "ADIDAS",
    "UNDER ARMOUR",
    "PUMA",
    "NEW BALANCE",
    "ASICS",
    "SPEEDO",
    "COLUMBIA",
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

      {/* 4. Top Brands Bar */}
      <section className={styles.brandsSection}>
        <div className="container">
          <h2 className="heading-section">Top Brands</h2>
          <div className={styles.brandsGrid}>
            {brands.map((brand, idx) => (
              <div key={idx} className={styles.brandBox}>
                <span className={styles.brandName}>{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Trust / Footer Highlight Features */}
      <section className={styles.trustSection}>
        <div className={`container ${styles.trustGrid}`}>
          <div className={styles.trustItem}>
            <ShieldCheck size={32} className={styles.trustIcon} />
            <div>
              <h4>100% Authentic Products</h4>
              <p>Guaranteed genuine gear from world-class brands</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <CreditCard size={32} className={styles.trustIcon} />
            <div>
              <h4>Flexible Payments</h4>
              <p>Secure checkout with credit cards, PayPal, and Apple Pay</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <Headphones size={32} className={styles.trustIcon} />
            <div>
              <h4>24/7 Dedicated Support</h4>
              <p>Expert sportswear assistance whenever you need it</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
