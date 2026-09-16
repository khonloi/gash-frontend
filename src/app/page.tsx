import React, { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import {
  HeroCarousel,
  CategoryCircle,
  ProductCard,
  PromoBanner,
  SportCard,
  SectionHeading,
} from "@/components/ui";
import { fetchProducts, fetchProductStats } from "@/services/productService";
import {
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Headphones,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  categories,
  favoriteSports,
  brands,
} from "@/lib/mockData";
import styles from "./page.module.css";

const JournalSection = dynamic(
  () =>
    import("@/components/home/JournalSection").then(
      (mod) => mod.JournalSection
    ),
  {
    loading: () => (
      <div
        style={{
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="skeleton" style={{ width: "100%", height: "400px" }} />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "JOCKSPORT | Official Athletic & Performance Sportswear",
  description:
    "Explore authentic sportswear, high-performance running shoes, and premium training gear from top global athletic brands at JOCKSPORT.",
  openGraph: {
    title: "JOCKSPORT | Official Athletic & Performance Sportswear",
    description:
      "Explore authentic sportswear, high-performance running shoes, and premium training gear from top global athletic brands at JOCKSPORT.",
    type: "website",
  },
};

function CategorySectionSkeleton() {
  return (
    <section className={styles.categorySection}>
      <div className="container">
        <SectionHeading>Shop by Category</SectionHeading>
        <div className={styles.categoryGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className="skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: '80px', height: '20px' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function DynamicCategorySection() {
  const stats = await fetchProductStats();
  const dynamicCategories = stats.map((s) => ({
    title: (s.category as string) || "Other",
    href: `/collections/${(s.category as string)?.toLowerCase().replace(/\s+/g, '-') || 'all'}`,
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80",
    icon: <Sparkles size={18} />,
  }));

  return (
    <section className={styles.categorySection}>
      <div className="container">
        <SectionHeading>Shop by Category</SectionHeading>
        <div className={styles.categoryGrid}>
          {(dynamicCategories.length > 0 ? dynamicCategories : categories).map((cat) => (
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

function ProductShelfSkeleton({ title, className }: { title: string, className: string }) {
  return (
    <section className={className}>
      <div className="container">
        <SectionHeading>{title}</SectionHeading>
        <div className={styles.productsGrid}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="skeleton" style={{ width: '100%', aspectRatio: '4/5', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '60%', height: '16px', marginTop: '0.5rem' }} />
              <div className="skeleton" style={{ width: '40%', height: '16px' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function DynamicProductsSection({ 
  type, 
  title, 
  className 
}: { 
  type: 'featured' | 'new' | 'collections', 
  title: string,
  className: string
}) {
  const allProducts = await fetchProducts();
  
  let products = [];
  if (type === 'featured') {
    products = allProducts.slice(0, 10);
  } else if (type === 'new') {
    products = allProducts.slice(10, 20).length >= 10 ? allProducts.slice(10, 20) : allProducts.slice(0, 10);
  } else {
    products = allProducts.slice(20, 30).length >= 10 ? allProducts.slice(20, 30) : allProducts.slice(0, 10);
  }

  const viewAllAction = (
    <Link href="/collections/all" className={styles.viewAllLink}>
      <span>View all products</span>
      <ArrowRight size={16} />
    </Link>
  );

  return (
    <section className={className}>
      <div className="container">
        <SectionHeading action={viewAllAction}>
          {title}
        </SectionHeading>

        <div className={styles.productsGrid}>
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              {...prod}
              discountPercent={prod.discountPercent ?? undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandsSectionSkeleton() {
  return (
    <section className={styles.brandsSection}>
      <div className="container">
        <SectionHeading>Top Featured Brands</SectionHeading>
        <div className={styles.brandsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.brandBox}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function DynamicBrandsSection() {
  const allProducts = await fetchProducts();
  const dynamicBrands = Array.from(new Set(allProducts.map(p => p.brand))).filter(Boolean).slice(0, 11);
  if (dynamicBrands.length > 0 && dynamicBrands.length < 12) {
    dynamicBrands.push('+ MORE BRANDS');
  }

  return (
    <section className={styles.brandsSection}>
      <div className="container">
        <SectionHeading>Top Featured Brands</SectionHeading>
        <div className={styles.brandsGrid}>
          {(dynamicBrands.length > 0 ? dynamicBrands : brands).map((brand: string) => (
            <div key={brand} className={styles.brandBox}>
              <span className={styles.brandName}>{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className={styles.main}>
      {/* 1. Hero Section Carousel */}
      <HeroCarousel />

      {/* 2. Categories Section */}
      <Suspense fallback={<CategorySectionSkeleton />}>
        <DynamicCategorySection />
      </Suspense>

      {/* 3. Featured Deals / Hot Products (2 rows x 5 columns = 10 products) */}
      <Suspense fallback={<ProductShelfSkeleton title="Featured Deals" className={styles.productsSection} />}>
        <DynamicProductsSection type="featured" title="Featured Deals" className={styles.productsSection} />
      </Suspense>

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

      {/* 5. New Collections (2 rows x 5 columns = 10 products) */}
      <Suspense fallback={<ProductShelfSkeleton title="New Collections" className={styles.collectionsSection} />}>
        <DynamicProductsSection type="new" title="New Collections" className={styles.collectionsSection} />
      </Suspense>

      {/* 6. Featured Collections (2 rows x 5 columns = 10 products) */}
      <Suspense fallback={<ProductShelfSkeleton title="Featured Collections" className={styles.featuredGridSection} />}>
        <DynamicProductsSection type="collections" title="Featured Collections" className={styles.featuredGridSection} />
      </Suspense>

      {/* 7. Top Brands Grid */}
      <Suspense fallback={<BrandsSectionSkeleton />}>
        <DynamicBrandsSection />
      </Suspense>

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
          <SectionHeading>Favorite Sports</SectionHeading>
          <div className={styles.sportsGrid}>
            {favoriteSports.map((sport) => (
              <SportCard key={sport.title} {...sport} />
            ))}
          </div>
        </div>
      </section>

      {/* 10. Sport & Lifestyle Journal / News (Interactive Client Island) */}
      <JournalSection />

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
