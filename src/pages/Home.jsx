import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useHomeProducts } from "../hooks/useHomeProducts";
import useDocumentTitle from "../hooks/useDocumentTitle";
import Button from "../components/ui/Button";
import HeroCarousel from "../features/home/components/HeroCarousel";
import CategorySlider from "../features/home/components/CategorySlider";
import PromoGridSection from "../features/home/components/PromoGridSection";
import GiftGuideSection from "../features/home/components/GiftGuideSection";
import HomeProductSection from "../features/home/components/HomeProductSection";
import gashHeroProducts from "../assets/image/gash_hero_products.png";
import gashDiscountProducts from "../assets/image/gash_discount_products.png";
import gashAccessoriesProducts from "../assets/image/gash_accessories_products.png";

const carouselSlides = [
  {
    subtitle: "New Release",
    title: "New season drops",
    description: "Explore the latest season arrivals and street-inspired fashion curated for you.",
    buttonText: "Shop collection",
    link: "/products",
    bgClass: "bg-[#b0d5e8]",
    image: gashHeroProducts,
    alignRight: false
  },
  {
    subtitle: "Limited Time",
    title: "The Astra collection",
    description: "Heavy-weight hoodies, minimalist graphic tees, and daily essentials designed to stand out.",
    buttonText: "Browse hoodies",
    link: "/products",
    bgClass: "bg-[#dfcf91]",
    image: gashDiscountProducts,
    alignRight: true
  },
  {
    subtitle: "Style Upgrade",
    title: "Complete your look",
    description: "Elevate your daily rotation with premium leather boots, structured backpacks, and classic chains.",
    buttonText: "Shop accessories",
    link: "/products",
    bgClass: "bg-[#f2ddda]",
    image: gashAccessoriesProducts,
    alignRight: false
  },
  {
    subtitle: "Active Rotation",
    title: "Apex sneakers & gear",
    description: "Engineered for durability and clean lines. Find premium footwear, watches, and streetwear accessories.",
    buttonText: "Shop footwear",
    link: "/products",
    bgClass: "bg-[#b0d5e8]",
    image: gashHeroProducts,
    alignRight: true
  },
  {
    subtitle: "Summer Essentials",
    title: "Pastel activewear",
    description: "Lightweight fabrics and premium comfort for the warm season. Explore our signature activewear line.",
    buttonText: "Shop now",
    link: "/products",
    bgClass: "bg-[#dfcf91]",
    image: gashDiscountProducts,
    alignRight: false
  }
];

const Home = () => {
  useDocumentTitle("Home — Streetwear & Curated Apparel", "Discover premium streetwear and curated minimalist fashion at GASH.");
  const navigate = useNavigate();
  const {
    loading,
    error,
    categories,
    forYouProducts,
    recommendedProducts,
    randomCategorySections,
    fetchProducts,
  } = useHomeProducts();

  const handleCategoryClick = useCallback((category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  }, [navigate]);

  const handleProductClick = useCallback((id) => {
    if (!id) return;
    navigate(`/product/${id}`);
  }, [navigate]);

  const handleKeyDown = useCallback((e, id) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleProductClick(id);
    }
  }, [handleProductClick]);

  return (
    <div className="page-container">
      {/* 1. Hero Carousel */}
      <HeroCarousel slides={carouselSlides} navigate={navigate} />

      {/* Hero Promo Banner */}
      <div className="w-full mt-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/50 rounded-3xl p-6 sm:p-8 md:p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-xl overflow-hidden relative group">
        {/* Background decorative glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-start text-left max-w-xl z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 uppercase tracking-wider mb-3">
            ★ Exclusive Selection
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
            Curated pieces for everyday style
          </h1>
          <p className="text-sm sm:text-base text-gray-300 mb-6 max-w-md leading-relaxed">
            Discover modern classics designed with intentional details, premium fabrics, and timeless streetwear cuts.
          </p>
          <Button
            onClick={() => navigate("/products")}
            variant="gradient"
            size="md"
            className="font-bold shadow-lg"
          >
            Explore Collection →
          </Button>
        </div>

        <div className="mt-6 md:mt-0 flex gap-4 z-10">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 backdrop-blur-md bg-white/10 card-lift">
            <img
              src={gashHeroProducts}
              alt="Curated style"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 backdrop-blur-md bg-white/10 card-lift">
            <img
              src={gashDiscountProducts}
              alt="Trending fashion item"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Error state banner */}
      {error && (
        <div className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mt-6 w-full flex items-center justify-center gap-2.5 flex-wrap" role="alert" tabIndex={0} aria-live="polite">
          <span className="text-lg" aria-hidden="true">⚠</span>
          {error}
          <Button
            onClick={fetchProducts}
            variant="secondary"
            size="sm"
            disabled={loading}
            aria-label="Retry loading products"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. Categories Navigation */}
      {!error && (
        <CategorySlider
          categories={categories}
          loading={loading}
          onCategoryClick={handleCategoryClick}
        />
      )}

      {/* 3. Products For You Shelf */}
      {!error && (
        <HomeProductSection
          title="Products For You"
          subtitle="Hand-picked styles recommended for your taste"
          products={forYouProducts}
          loading={loading}
          handleProductClick={handleProductClick}
          handleKeyDown={handleKeyDown}
          onViewAll={() => navigate("/products")}
        />
      )}

      {/* 4. Promotional Grid Section */}
      {!error && !loading && <PromoGridSection navigate={navigate} />}

      {/* 5. Dynamic Trending Category Sections */}
      {!error && !loading && randomCategorySections.map((section, idx) => (
        <HomeProductSection
          key={idx}
          title={`Trending in ${section.categoryName}`}
          products={section.products}
          loading={false}
          handleProductClick={handleProductClick}
          handleKeyDown={handleKeyDown}
          onViewAll={() => handleCategoryClick(section.categoryName)}
        />
      ))}

      {/* 6. Dad's Day / Seasonal Gift Guide Section */}
      {!error && !loading && <GiftGuideSection navigate={navigate} />}

      {/* 7. Recommendations Section */}
      {!error && (
        <HomeProductSection
          title="Recommended for You"
          subtitle="More trending items you might love"
          products={recommendedProducts}
          loading={loading}
          handleProductClick={handleProductClick}
          handleKeyDown={handleKeyDown}
          onViewAll={() => navigate("/products")}
        />
      )}
    </div>
  );
};

export default Home;
