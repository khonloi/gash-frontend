import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import useDocumentTitle from "../hooks/useDocumentTitle";
import Button from "../components/ui/Button";
import HeroCarousel from "../features/home/components/HeroCarousel";
import CategorySlider from "../features/home/components/CategorySlider";
import PromoGridSection from "../features/home/components/PromoGridSection";
import GiftGuideSection from "../features/home/components/GiftGuideSection";
import HomeProductSection from "../features/home/components/HomeProductSection";
import { fetchWithRetry } from "../utils/fetchWithRetry";

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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithRetry(() => Api.products.getAll());
      const productsData = response?.data || response || [];

      if (!Array.isArray(productsData) || productsData.length === 0) {
        setError("No products available at this time");
        setProducts([]);
        setCategories([]);
        return;
      }

      // Filter active products with variants
      const activeProducts = productsData.filter(
        (product) => product.productStatus === "active" &&
          product.productVariantIds?.length > 0
      );

      setProducts(activeProducts);

      // Extract unique categories from products, filter out deleted categories
      const uniqueCategories = [
        ...new Set(
          activeProducts
            .filter((product) => product.categoryId && !product.categoryId.isDeleted)
            .map((product) => product.categoryId?.categoryName)
            .filter(Boolean)
        ),
      ];
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Shuffle helpers
  const getRandomItems = (arr, count, excludeIds = []) => {
    if (!Array.isArray(arr) || arr.length <= count) return arr;
    const filtered = excludeIds.length > 0 ? arr.filter(item => !excludeIds.includes(item._id || item)) : arr;
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const [forYouProducts, setForYouProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [randomCategorySections, setRandomCategorySections] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const forYou = getRandomItems(products, 5);
      setForYouProducts(forYou);
      setRecommendedProducts(getRandomItems(products, 5, forYou.map(p => p._id)));
    }
  }, [products]);

  useEffect(() => {
    if (categories.length > 0 && products.length > 0) {
      const shuffledCategories = [...categories].sort(() => 0.5 - Math.random());
      const selectedCategories = shuffledCategories.slice(0, 2);

      const sections = selectedCategories.map(catName => {
        const matching = products.filter(p => p.categoryId?.categoryName === catName);
        return {
          categoryName: catName,
          products: getRandomItems(matching, 5)
        };
      });
      setRandomCategorySections(sections);
    }
  }, [categories, products]);

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
      <div className="w-full mt-6 bg-[#002f6c] border-2 border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-sm overflow-hidden relative">
        <div className="flex flex-col items-start text-left max-w-xl z-10">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            Exclusive Selection
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 leading-tight">
            Curated pieces for everyday style
          </h1>
          <p className="text-xs sm:text-sm text-gray-200 mb-4 max-w-md">
            Discover modern classics designed with intentional details, premium fabrics, and timeless cuts.
          </p>
          <Button
            onClick={() => navigate("/products")}
            variant="primary"
            size="sm"
            className="px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
          >
            Explore now
          </Button>
        </div>

        <div className="mt-4 md:mt-0 flex gap-3 z-10">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-md border-2 border-white/20">
            <img
              src={gashHeroProducts}
              alt="Curated style"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-md border-2 border-white/20">
            <img
              src={gashDiscountProducts}
              alt="Trending fashion item"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
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
