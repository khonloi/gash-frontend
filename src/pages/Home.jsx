// Home.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY
} from "../constants/constants";
import ProductCard, { ProductCardSkeleton } from "../features/products/components/ProductCard";
import Button from "../components/ui/Button";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import gashHeroProducts from "../assets/image/gash_hero_products.png";
import gashDiscountProducts from "../assets/image/gash_discount_products.png";
import gashAccessoriesProducts from "../assets/image/gash_accessories_products.png";

const fetchWithRetry = async (apiCall, retries = API_RETRY_COUNT, delay = API_RETRY_DELAY) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await apiCall();
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

const carouselSlides = [
  {
    subtitle: "New Arrival",
    title: "Urban streetwear refresh",
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Carousel auto-cycling
  const AUTO_CYCLE_DELAY = 5000;
  const [isManuallyNavigated, setIsManuallyNavigated] = useState(false);
  useEffect(() => {
    if (isPaused) return;
    if (isManuallyNavigated) {
      const pause = setTimeout(() => setIsManuallyNavigated(false), AUTO_CYCLE_DELAY);
      return () => clearTimeout(pause);
    }
    const timer = setTimeout(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselSlides.length);
    }, AUTO_CYCLE_DELAY);
    return () => clearTimeout(timer);
  }, [carouselIndex, isManuallyNavigated, isPaused]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithRetry(() => Api.newProducts.getAll());
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

      // Extract unique categories from products, filter out deleted categories (isDeleted: false)
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

  // State for randomized sections
  const [forYouProducts, setForYouProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [randomCategories, setRandomCategories] = useState([]);
  const [randomCategorySections, setRandomCategorySections] = useState([]);
  const categorySliderRef = useRef(null);
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Randomize once after products/categories are loaded
  useEffect(() => {
    if (products.length > 0) {
      const forYou = getRandomItems(products, 5);
      setForYouProducts(forYou);
      setRecommendedProducts(getRandomItems(products, 5, forYou.map(p => p._id)));
    }
  }, [products]);

  useEffect(() => {
    if (categories.length > 0 && products.length > 0) {
      setRandomCategories(categories);

      // Pick 2 random categories for specific home sections
      const shuffledCategories = [...categories].sort(() => 0.5 - Math.random());
      const selectedCategories = shuffledCategories.slice(0, 2);

      const sections = selectedCategories.map(catName => {
        const catProducts = products
          .filter(p => p.categoryId?.categoryName === catName)
          .slice(0, 5);
        return { categoryName: catName, products: catProducts };
      });
      setRandomCategorySections(sections);
    }
  }, [categories, products]);

  const handleProductClick = useCallback(
    (id) => {
      if (!id) {
        setError("Invalid product selected");
        return;
      }
      navigate(`/product/${id}`);
    },
    [navigate]
  );

  const handleKeyDown = useCallback(
    (e, id) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleProductClick(id);
      }
    },
    [handleProductClick]
  );

  const handleCategoryClick = (category) => {
    if (!category) return;
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  // Category slider navigation
  const handleCategoryPrev = () => {
    if (categorySliderRef.current) {
      const cardWidth = 160;
      const gap = 20;
      const scrollAmount = (cardWidth + gap) * 2;
      const newPosition = Math.max(0, categoryScrollPosition - scrollAmount);
      categorySliderRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setCategoryScrollPosition(newPosition);
    }
  };

  const handleCategoryNext = () => {
    if (categorySliderRef.current) {
      const cardWidth = 160;
      const gap = 20;
      const scrollAmount = (cardWidth + gap) * 2;
      const maxScroll = categorySliderRef.current.scrollWidth - categorySliderRef.current.clientWidth;
      const newPosition = Math.min(maxScroll, categoryScrollPosition + scrollAmount);
      categorySliderRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setCategoryScrollPosition(newPosition);
    }
  };

  const handleCategoryScroll = () => {
    if (categorySliderRef.current) {
      const scrollLeft = categorySliderRef.current.scrollLeft;
      const scrollWidth = categorySliderRef.current.scrollWidth;
      const clientWidth = categorySliderRef.current.clientWidth;
      setCategoryScrollPosition(scrollLeft);
      setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    if (categorySliderRef.current && randomCategories.length > 0) {
      const checkScroll = () => {
        if (categorySliderRef.current) {
          const scrollWidth = categorySliderRef.current.scrollWidth;
          const clientWidth = categorySliderRef.current.clientWidth;
          setCanScrollNext(scrollWidth > clientWidth);
        }
      };
      const timer = setTimeout(checkScroll, 100);
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [randomCategories]);

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev === 0 ? carouselSlides.length - 1 : prev - 1));
    setIsManuallyNavigated(true);
  };
  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev === carouselSlides.length - 1 ? 0 : prev + 1));
    setIsManuallyNavigated(true);
  };

  const slide = carouselSlides[carouselIndex];
  const textClass = `z-10 w-full md:w-1/2 px-6 py-8 sm:px-10 md:px-12 lg:px-16 text-left flex flex-col items-start justify-center animate-[fadeIn_0.3s_ease-out] ${slide.alignRight ? "md:ml-auto" : ""
    }`;
  const imgContainerClass = `absolute bottom-0 top-0 w-1/2 h-full hidden md:block select-none pointer-events-none z-0 ${slide.alignRight ? "left-0" : "right-0"
    }`;
  const parentClass = `relative w-full rounded-xl border-2 border-gray-300 overflow-hidden flex items-center min-h-[350px] md:min-h-[450px] lg:min-h-[500px] transition-colors duration-500 ${slide.bgClass
    }`;

  return (
    <div className="page-container page-container-centered !mt-0">
      {/* 1. Hero Carousel Section */}
      <div className="w-full mb-6 sm:mb-8">
        <div className={parentClass}>
          {/* Controls (Top Right) */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200/50">
            <button
              onClick={handlePrevCarousel}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-700 flex items-center justify-center"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon fontSize="small" />
            </button>
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-700 flex items-center justify-center"
              aria-label={isPaused ? "Play slide" : "Pause slide"}
            >
              {isPaused ? (
                <PlayArrowIcon fontSize="small" />
              ) : (
                <PauseIcon fontSize="small" />
              )}
            </button>
            <button
              onClick={handleNextCarousel}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-700 flex items-center justify-center"
              aria-label="Next slide"
            >
              <ChevronRightIcon fontSize="small" />
            </button>
          </div>

          {/* Left Text Content */}
          <div className={textClass}>
            <span className="text-xs sm:text-sm md:text-base font-semibold text-blue-900 mb-1 sm:mb-2 uppercase tracking-wider">
              {slide.subtitle}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-[#0f2942] leading-tight mb-2 sm:mb-3">
              {slide.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 max-w-sm md:max-w-md">
              {slide.description}
            </p>
            <Button
              onClick={() => navigate(slide.link)}
              variant="secondary"
              size="md"
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-full shadow-sm transition-all"
            >
              {slide.buttonText}
            </Button>
          </div>

          {/* Floating Product Image (Right section cover) */}
          <div className={imgContainerClass}>
            <img
              src={slide.image}
              alt="Trending fashion item"
              className="w-full h-full object-cover transition-transform duration-505 hover:scale-105"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap" role="alert" tabIndex={0} aria-live="polite">
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
        <section className="w-full mt-0 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">Category</h2>
          {loading ? (
            <div className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-5 scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[...Array(7)].map((_, index) => (
                <div
                  key={index}
                  className="w-[10em] flex-shrink-0 border border-gray-300 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-center bg-white px-2 py-3 min-h-[3em]">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div
                ref={categorySliderRef}
                onScroll={handleCategoryScroll}
                className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-5 scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                role="list"
                aria-label={`${randomCategories.length} categories`}
              >
                {randomCategories.map((category) => (
                  <div
                    key={category}
                    className="w-[10em] flex-shrink-0 border-2 border-gray-300 rounded-xl overflow-hidden flex flex-col cursor-pointer hover:shadow-lg focus:shadow-lg focus:outline-none transition-all duration-300 ease-in-out bg-white"
                    tabIndex={0}
                    role="listitem"
                    aria-label={`View products in ${category}`}
                    onClick={() => handleCategoryClick(category)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleCategoryClick(category);
                    }}
                  >
                    <div className="flex items-center justify-center bg-white px-2 py-3 min-h-[3em]">
                      <span className="font-semibold text-sm sm:text-base text-center line-clamp-2 text-gray-900">
                        {category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {categoryScrollPosition > 0 && (
                <button
                  className="absolute -left-4 top-[calc(50%-4px)] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 focus:outline-none transition-colors"
                  onClick={handleCategoryPrev}
                  aria-label="Previous categories"
                >
                  <ChevronLeftIcon className="text-gray-900" />
                </button>
              )}
              {canScrollNext && (
                <button
                  className="absolute -right-4 top-[calc(50%-4px)] -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 focus:outline-none transition-colors"
                  onClick={handleCategoryNext}
                  aria-label="Next categories"
                >
                  <ChevronRightIcon className="text-gray-900" />
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* 3. For You / Spotlight Section */}
      {!error && (
        <section className="w-full mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">Products For You</h2>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
            role="grid"
            aria-label={loading ? "Loading products" : `${forYouProducts.length} personalized products`}
          >
            {loading ? (
              [...Array(5)].map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            ) : (
              forYouProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  handleProductClick={handleProductClick}
                  handleKeyDown={handleKeyDown}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* 4. Grid Promotional Section (Image 2 style) */}
      {!error && !loading && randomCategorySections.length > 0 && (
        <div className="w-full mt-8 sm:mt-10 mb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            {/* Tile 1: Left-most Gift Cards Card (spans 5 cols on lg) */}
            <div className="lg:col-span-5 bg-[#c3daf9] border-2 border-gray-300 rounded-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] transition-all duration-300 ease-in-out hover:shadow-lg">
              <div className="z-10 flex flex-col items-start text-left max-w-xs">
                <span className="text-xs font-semibold text-blue-955 uppercase tracking-widest">
                  GASH Gift Cards
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold text-[#0d2847] mt-2 mb-6 leading-tight">
                  Give the gift of premium style
                </h3>
                <Button
                  onClick={() => navigate("/products")}
                  variant="primary"
                  size="sm"
                  className="bg-[#0f2942] hover:bg-[#1b4369] text-white px-5 py-2 rounded-full font-semibold transition-all shadow-sm"
                >
                  Shop gift cards
                </Button>
              </div>

              {/* Styled e-Gift Card Previews with inline SVG */}
              <div className="absolute -right-4 -bottom-4 w-52 h-44 pointer-events-none select-none">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                    <linearGradient id="envGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#f3f4f6" />
                    </linearGradient>
                    <filter id="svgShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
                    </filter>
                  </defs>

                  {/* Envelope Back/Body */}
                  <g transform="translate(10, 50)" filter="url(#svgShadow)">
                    <path d="M0,40 L0,110 Q0,120 10,120 L170,120 Q180,120 180,110 L180,40 L90,85 Z" fill="url(#envGrad)" stroke="#e5e7eb" strokeWidth="1" />
                  </g>

                  {/* Gift Card sliding out */}
                  <g transform="translate(30, 25) rotate(-8)" filter="url(#svgShadow)">
                    <rect x="0" y="0" width="130" height="80" rx="8" fill="url(#cardGrad)" />
                    {/* Chip */}
                    <rect x="15" y="15" width="18" height="13" rx="2.5" fill="url(#goldGrad)" />
                    {/* GASH logo */}
                    <text x="115" y="25" fill="#ffffff" fontSize="9" fontWeight="600" textAnchor="end" letterSpacing="0.1em" opacity="0.9">GASH</text>
                    {/* Card number */}
                    <text x="15" y="55" fill="#e2e8f0" fontSize="8" fontFamily="monospace" letterSpacing="0.15em">•••• •••• •••• 9876</text>
                    {/* Card text */}
                    <text x="15" y="68" fill="#fbbf24" fontSize="7" fontWeight="600" letterSpacing="0.05em">PREMIUM GIFT CARD</text>
                  </g>

                  {/* Envelope Front Flap overlaps */}
                  <g transform="translate(10, 50)" filter="url(#svgShadow)">
                    <path d="M0,120 L90,75 L180,120 Z" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.5" />
                  </g>

                  {/* Gold Ribbon / Bow */}
                  <g transform="translate(85, 125)" filter="url(#svgShadow)">
                    {/* Ribbon bands */}
                    <path d="M-85,-20 L95,-20" stroke="url(#goldGrad)" strokeWidth="12" />
                    {/* Bow loops */}
                    <path d="M0,0 C-20,-20 -30,10 0,0 C20,-20 30,10 0,0" fill="url(#goldGrad)" />
                    <path d="M0,0 C-10,-25 -25,-15 -5,-5" fill="#fef08a" opacity="0.6" />
                    {/* Bow center */}
                    <circle cx="0" cy="-2" r="6" fill="url(#goldGrad)" />
                    {/* Ribbon tails */}
                    <path d="M-2,-2 L-15,20 L-5,22 L0,5 Z" fill="url(#goldGrad)" />
                    <path d="M2,-2 L15,20 L5,22 L0,5 Z" fill="url(#goldGrad)" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Tile 2, 3, 4: Center Column (spans 4 cols on lg) */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              {/* Center Top: Same-day delivery (Tile 2) */}
              <div className="bg-[#f2f4f7] border-2 border-gray-300 rounded-xl p-6 flex justify-between items-center overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
                <div className="flex flex-col items-start text-left max-w-[65%]">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Express Delivery
                  </span>
                  <h4 className="text-lg font-semibold text-[#0d2847] mt-1 mb-2">
                    Free express delivery on orders over $75
                  </h4>
                  <button
                    onClick={() => navigate("/products")}
                    className="text-xs font-semibold text-blue-700 underline hover:text-blue-900"
                  >
                    Shop collections
                  </button>
                </div>
                <div className="w-20 h-16 flex items-center justify-center select-none pointer-events-none">
                  <svg viewBox="0 0 100 80" className="w-full h-full">
                    {/* Speed lines */}
                    <path d="M10,25 L28,25" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                    <path d="M5,38 L22,38" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                    <path d="M12,50 L25,50" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                    
                    {/* Van body */}
                    <path d="M32,18 H70 L85,35 V60 H32 Z" fill="#3b82f6" />
                    {/* Cabin window */}
                    <path d="M68,22 H78 L83,32 H68 Z" fill="#eff6ff" />
                    {/* Van details / stripes */}
                    <path d="M32,40 H60 V48 H32 Z" fill="#1d4ed8" opacity="0.8" />
                    {/* Wheels */}
                    <circle cx="44" cy="60" r="10" fill="#1e293b" />
                    <circle cx="44" cy="60" r="4" fill="#f1f5f9" />
                    <circle cx="72" cy="60" r="10" fill="#1e293b" />
                    <circle cx="72" cy="60" r="4" fill="#f1f5f9" />
                  </svg>
                </div>
              </div>

              {/* Center Bottom: 2 Cards side-by-side (Tiles 3 & 4) */}
              <div className="grid grid-cols-2 gap-4 flex-1">

                {/* Tile 3: GASH Club */}
                <div className="bg-[#eaeff5] border-2 border-gray-300 rounded-xl p-5 flex flex-col justify-between overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
                  <div className="flex flex-col items-start text-left">
                    <h4 className="text-sm sm:text-base font-semibold text-[#0d2847] leading-snug">
                      Explore seasonal outerwear styles
                    </h4>
                    <button
                      onClick={() => navigate("/products")}
                      className="text-xs font-semibold text-blue-700 underline hover:text-blue-900 mt-2"
                    >
                      Shop outerwear
                    </button>
                  </div>
                  <div className="flex justify-end mt-2 select-none pointer-events-none">
                    <svg viewBox="0 0 100 80" className="w-16 h-14">
                      {/* Rack stand */}
                      <line x1="10" y1="75" x2="90" y2="75" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                      <line x1="25" y1="75" x2="25" y2="15" stroke="#475569" strokeWidth="2.5" />
                      <line x1="75" y1="75" x2="75" y2="15" stroke="#475569" strokeWidth="2.5" />
                      <line x1="20" y1="15" x2="80" y2="15" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

                      {/* Jacket Left */}
                      <g transform="translate(32, 15)">
                        <path d="M8,-5 Q12,-5 10,0 Q8,5 10,8" fill="none" stroke="#64748b" strokeWidth="1.5" />
                        <path d="M-6,8 H26 L22,52 H-2 Z" fill="#1e3a8a" />
                        <path d="M-6,8 L-12,25 L-6,28 L-3,15" fill="#1e3a8a" />
                        <path d="M26,8 L32,25 L26,28 L23,15" fill="#1e3a8a" />
                        {/* collar details */}
                        <path d="M2,8 L10,18 L18,8" fill="none" stroke="#3b82f6" strokeWidth="2" />
                      </g>

                      {/* Jacket Right */}
                      <g transform="translate(52, 15)">
                        <path d="M8,-5 Q12,-5 10,0 Q8,5 10,8" fill="none" stroke="#64748b" strokeWidth="1.5" />
                        <path d="M-4,8 H24 L20,55 H0 Z" fill="#0284c7" />
                        <path d="M-4,8 L-9,24 L-4,27 L-1,14" fill="#0284c7" />
                        <path d="M24,8 L29,24 L24,27 L21,14" fill="#0284c7" />
                        {/* zipper */}
                        <line x1="10" y1="8" x2="10" y2="55" stroke="#e0f2fe" strokeWidth="1.5" />
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Tile 4: Style assistant */}
                <div className="bg-[#d2efff] border-2 border-gray-300 rounded-xl p-5 flex flex-col justify-between overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
                  <div className="flex flex-col items-start text-left">
                    <h4 className="text-sm sm:text-base font-semibold text-[#0d2847] leading-snug">
                      30-day effortless returns & exchanges
                    </h4>
                    <button
                      onClick={() => navigate("/products")}
                      className="text-xs font-semibold text-blue-700 underline hover:text-blue-900 mt-2"
                    >
                      Read returns policy
                    </button>
                  </div>
                  <div className="flex justify-end mt-2 select-none pointer-events-none">
                    <svg viewBox="0 0 100 80" className="w-16 h-14">
                      {/* Box bottom/back shadow */}
                      <ellipse cx="50" cy="65" rx="25" ry="6" fill="#cbd5e1" opacity="0.6" />

                      {/* Isometric Box */}
                      <g transform="translate(15, 15)">
                        {/* Left face */}
                        <path d="M15,35 L35,45 L35,20 L15,10 Z" fill="#0284c7" />
                        {/* Right face */}
                        <path d="M35,45 L55,35 L55,10 L35,20 Z" fill="#0ea5e9" />
                        {/* Top face */}
                        <path d="M35,20 L55,10 L35,0 L15,10 Z" fill="#38bdf8" />
                        
                        {/* Tape line */}
                        <path d="M35,20 L35,45" stroke="#0369a1" strokeWidth="2.5" />
                        <path d="M35,20 L25,15 M35,20 L45,15" stroke="#0369a1" strokeWidth="2.5" />
                      </g>

                      {/* Return Arrow wrapping around box */}
                      <path d="M72,25 C82,32 78,52 62,54 C54,55 42,52 35,45" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                      <path d="M40,52 L32,45 L40,38" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

              </div>
            </div>

            {/* Tile 5: Rightmost Tall Card (spans 3 cols on lg) */}
            <div className="lg:col-span-3 bg-white border-2 border-gray-300 rounded-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] transition-all duration-300 ease-in-out hover:shadow-lg">
              <div className="z-10 flex flex-col items-start text-left">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Loyalty Program
                </span>
                <h3 className="text-xl font-semibold text-[#0d2847] mt-2 mb-2">
                  Earn points & redeem exclusive discount vouchers
                </h3>
                <button
                  onClick={() => navigate("/vouchers")}
                  className="text-xs font-semibold text-blue-700 underline hover:text-blue-900"
                >
                  Join rewards
                </button>
              </div>

              {/* Credit Card Mockup with vector inline SVG */}
              <div className="relative mt-8 mb-4 select-none pointer-events-none">
                {/* Backdrop glowing effect */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-blue-100 rounded-full opacity-60 filter blur-xl pointer-events-none" />

                <div className="w-48 h-32 mx-auto transition-all duration-300 hover:rotate-1 hover:scale-105">
                  <svg viewBox="0 0 160 100" className="w-full h-full drop-shadow-xl">
                    <defs>
                      <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0a192f" />
                        <stop offset="60%" stopColor="#0f2b48" />
                        <stop offset="100%" stopColor="#1a365d" />
                      </linearGradient>
                      <linearGradient id="goldAcc" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#b45309" />
                      </linearGradient>
                      <linearGradient id="goldGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fef08a" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>

                    {/* Card Base */}
                    <rect x="0" y="0" width="160" height="100" rx="10" fill="url(#cardBg)" stroke="#1e293b" strokeWidth="0.5" />
                    
                    {/* Decorative Gold lines / Wave pattern */}
                    <path d="M-10,80 Q30,60 80,85 T170,70 L170,110 L-10,110 Z" fill="url(#goldAcc)" opacity="0.15" />
                    <path d="M-10,85 Q40,65 90,95 T170,75 L170,110 L-10,110 Z" fill="url(#goldAcc)" opacity="0.25" />

                    {/* Brand logo */}
                    <text x="12" y="22" fill="url(#goldGlow)" fontSize="10" fontWeight="600" letterSpacing="0.1em">GASH</text>
                    
                    {/* Contactless symbol */}
                    <path d="M140,15 A5,5 0 0,1 140,25 M143,12 A9,9 0 0,1 143,28 M146,9 A13,13 0 0,1 146,31" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

                    {/* Gold Chip */}
                    <rect x="12" y="32" width="20" height="14" rx="2.5" fill="url(#goldAcc)" />
                    <line x1="22" y1="32" x2="22" y2="46" stroke="#78350f" strokeWidth="0.5" />
                    <line x1="12" y1="39" x2="32" y2="39" stroke="#78350f" strokeWidth="0.5" />

                    {/* Card Number */}
                    <text x="12" y="66" fill="#cbd5e1" fontSize="9" fontFamily="monospace" letterSpacing="0.15em">•••• •••• •••• 5678</text>

                    {/* Card Holder & Member Tier */}
                    <text x="12" y="85" fill="#94a3b8" fontSize="6" fontWeight="600" letterSpacing="0.05em">VALUED CUSTOMER</text>
                    <text x="148" y="85" fill="url(#goldGlow)" fontSize="7" fontWeight="600" letterSpacing="0.05em" textAnchor="end">GOLD MEMBER</text>
                  </svg>
                </div>
              </div>

              <span className="text-[10px] font-semibold text-gray-400 tracking-wider text-center block uppercase mt-2">
                OnePay Member Rewards
              </span>
            </div>

          </div>
        </div>
      )}

      {/* 5. Dynamic Category Sections */}
      {!error && !loading && randomCategorySections.map((section, idx) => (
        <section key={idx} className="w-full mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
            <h2 className="text-left text-lg sm:text-xl md:text-xl font-semibold">
              Trending in {section.categoryName}
            </h2>
            <button
              onClick={() => handleCategoryClick(section.categoryName)}
              className="text-amber-600 text-xs sm:text-sm font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              Explore More
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center">
            {section.products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                handleProductClick={handleProductClick}
                handleKeyDown={handleKeyDown}
              />
            ))}
            {section.products.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm sm:text-base text-gray-500 italic">
                No products available in this category yet.
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Dad's Day Gift Guide Section (similar to GASH info section layout) */}
      {!error && !loading && (
        <div className="w-full mt-8 sm:mt-10 mb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">

            {/* Tile 1: Left-most Large Card (spans 5 cols on lg) */}
            <div className="lg:col-span-5 bg-[#d0e1f9] border-2 border-gray-300 rounded-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] transition-all duration-300 ease-in-out hover:shadow-lg">
              <div className="z-10 flex flex-col items-start text-left max-w-xs">
                <span className="text-xs font-semibold text-blue-900 uppercase tracking-widest">
                  Nike, LEGO®, Owala & more
                </span>
                <h3 className="text-2xl sm:text-3xl font-semibold text-[#0a2540] mt-2 mb-6 leading-tight">
                  Dad's Day Top 100+ gifts
                </h3>
                <Button
                  onClick={() => navigate("/products")}
                  variant="secondary"
                  size="sm"
                  className="bg-white hover:bg-gray-50 text-[#0a2540] px-5 py-2 rounded-full font-semibold transition-all shadow-sm"
                >
                  Shop now
                </Button>
              </div>

              {/* Visual content: vector product preview */}
              <div className="absolute right-0 bottom-2 w-1/2 h-[60%] hidden md:block pointer-events-none select-none z-0">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Background glow / circles */}
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" strokeDasharray="6 6" />
                  
                  {/* Owala Bottle */}
                  <g transform="translate(25, 40)">
                    <rect x="10" y="40" width="26" height="80" rx="8" fill="#2d3748" />
                    <rect x="12" y="25" width="22" height="15" rx="3" fill="#e2e8f0" />
                    <path d="M12,25 Q23,10 34,25" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle cx="23" cy="32" r="3" fill="#dd6b20" />
                    <rect x="17" y="15" width="12" height="10" rx="2" fill="#718096" />
                  </g>

                  {/* Nike Sneaker */}
                  <g transform="translate(55, 85)">
                    <path d="M10,60 L20,40 Q35,28 65,32 L100,50 L110,65 L105,75 L85,75 Q40,78 20,70 Z" fill="#ffffff" stroke="#cbd5e0" strokeWidth="1.5" />
                    <path d="M10,60 L15,70 Q40,75 85,77 L105,75 L110,75 L108,79 L85,81 Q40,79 15,74 Z" fill="#dd6b20" opacity="0.9" />
                    <path d="M40,48 Q60,45 85,55 Q65,60 50,58 Z" fill="#1a365d" />
                    <line x1="45" y1="36" x2="52" y2="44" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" />
                    <line x1="53" y1="38" x2="60" y2="46" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" />
                    <line x1="61" y1="40" x2="68" y2="48" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {/* Toy Bricks (Lego) */}
                  <g transform="translate(110, 30)">
                    <rect x="10" y="20" width="45" height="25" rx="3" fill="#e53e3e" />
                    <rect x="15" y="15" width="8" height="5" rx="1" fill="#e53e3e" />
                    <rect x="28.5" y="15" width="8" height="5" rx="1" fill="#e53e3e" />
                    <rect x="42" y="15" width="8" height="5" rx="1" fill="#e53e3e" />
                  </g>
                </svg>
              </div>

              <div className="absolute left-6 sm:left-8 bottom-6 sm:bottom-8 z-10 bg-blue-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Top 100+
              </div>
            </div>

            {/* Tile 2, 3, 4: Center Column (spans 4 cols on lg) */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              {/* Center Top: Game day gear (Tile 2) */}
              <div className="bg-[#dceaf9] border-2 border-gray-300 rounded-xl p-6 flex justify-between items-center overflow-hidden min-h-[160px] relative transition-all duration-300 ease-in-out hover:shadow-lg">
                <div className="flex flex-col items-start text-left max-w-[55%] z-10">
                  <span className="text-xs font-semibold text-blue-900/60 uppercase tracking-wider">
                    Team jerseys & more
                  </span>
                  <h4 className="text-lg font-semibold text-[#0a2540] mt-1 mb-2">
                    Game day gear for Dad
                  </h4>
                  <button
                    onClick={() => navigate("/products")}
                    className="text-xs font-semibold text-blue-700 underline hover:text-blue-900"
                  >
                    Shop now
                  </button>
                </div>
                {/* Visual content: vector team jerseys preview */}
                <div className="absolute right-2 bottom-0 w-[45%] h-[95%] hidden md:block pointer-events-none select-none z-0">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Baseball cap (bottom left) */}
                    <g transform="translate(15, 110)">
                      <path d="M10,40 Q25,10 50,40 Z" fill="#1a365d" />
                      <circle cx="30" cy="25" r="1.5" fill="#e2e8f0" />
                      <path d="M35,38 Q60,35 65,48 Q45,46 25,44 Z" fill="#1a365d" opacity="0.95" />
                      <text x="25" y="35" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#fff" opacity="0.9">N</text>
                    </g>

                    {/* Baseball (far left) */}
                    <g transform="translate(10, 80)">
                      <circle cx="20" cy="20" r="10" fill="#fff" stroke="#cbd5e0" strokeWidth="1" />
                      <path d="M13,13 Q20,20 13,27" fill="none" stroke="#e53e3e" strokeWidth="1" strokeDasharray="1 1" />
                      <path d="M27,13 Q20,20 27,27" fill="none" stroke="#e53e3e" strokeWidth="1" strokeDasharray="1 1" />
                    </g>

                    {/* Grey Jersey */}
                    <g transform="translate(85, 15)">
                      <path d="M15,20 L5,35 L20,45 L35,28 Z" fill="#e2e8f0" />
                      <path d="M65,20 L75,35 L60,45 L45,28 Z" fill="#e2e8f0" />
                      <line x1="5" y1="35" x2="20" y2="45" stroke="#1a365d" strokeWidth="1.5" />
                      <line x1="75" y1="35" x2="60" y2="45" stroke="#1a365d" strokeWidth="1.5" />
                      <path d="M25,20 L55,20 L60,85 L20,85 Z" fill="#e2e8f0" />
                      <line x1="40" y1="20" x2="40" y2="85" stroke="#cbd5e0" strokeWidth="2" />
                      <circle cx="40" cy="35" r="2" fill="#2d3748" />
                      <circle cx="40" cy="50" r="2" fill="#2d3748" />
                      <circle cx="40" cy="65" r="2" fill="#2d3748" />
                      <line x1="30" y1="20" x2="26" y2="85" stroke="#cbd5e0" strokeWidth="0.5" />
                      <line x1="50" y1="20" x2="54" y2="85" stroke="#cbd5e0" strokeWidth="0.5" />
                    </g>

                    {/* Navy Blue Jersey */}
                    <g transform="translate(55, 45)">
                      <path d="M15,20 L3,32 L15,42 L28,26 Z" fill="#1a365d" />
                      <path d="M60,20 L72,32 L60,42 L47,26 Z" fill="#1a365d" />
                      <line x1="3" y1="32" x2="15" y2="42" stroke="#fff" strokeWidth="1.5" />
                      <line x1="72" y1="32" x2="60" y2="42" stroke="#fff" strokeWidth="1.5" />
                      <path d="M20,20 L55,20 L58,80 L17,80 Z" fill="#1a365d" />
                      <path d="M37.5,20 L37.5,80" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="37.5" cy="32" r="1.5" fill="#fff" />
                      <circle cx="37.5" cy="45" r="1.5" fill="#fff" />
                      <circle cx="37.5" cy="58" r="1.5" fill="#fff" />
                      <text x="43" y="40" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#fff" opacity="0.9">NY</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Center Bottom: 2 Cards side-by-side (Tiles 3 & 4) */}
              <div className="grid grid-cols-2 gap-4 flex-1">

                {/* Tile 3: Grooming Gifts */}
                <div className="bg-[#e2ebd5] border-2 border-gray-300 rounded-xl p-5 flex flex-col justify-between overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-semibold text-[#2d4a22] uppercase tracking-wider">
                      Grooming gifts for Dad
                    </span>
                    <button
                      onClick={() => navigate("/products")}
                      className="text-xs font-semibold text-[#2d4a22] underline hover:text-green-900 mt-2"
                    >
                      Shop now
                    </button>
                  </div>
                  {/* CSS Perfume bottle visual */}
                  <div className="relative w-12 h-16 mx-auto mt-2 flex items-end justify-center select-none pointer-events-none">
                    <div className="absolute bottom-[46px] w-4 h-4 bg-[#2d3748] rounded-t-sm border border-gray-700/20" />
                    <div className="absolute bottom-[40px] w-6 h-1.5 bg-[#2d4a22]/40" />
                    <div className="w-10 h-[42px] bg-gradient-to-br from-amber-100/70 to-amber-600/80 rounded border-2 border-amber-800/40 flex items-center justify-center shadow-sm">
                      <span className="text-[6px] font-mono font-semibold text-amber-950/80 tracking-widest uppercase">GASH</span>
                    </div>
                  </div>
                </div>

                {/* Tile 4: Splash / Summer */}
                <div className="bg-[#daf0f6] border-2 border-gray-300 rounded-xl p-5 flex flex-col justify-between overflow-hidden min-h-[160px] transition-all duration-300 ease-in-out hover:shadow-lg">
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-semibold text-[#0e3c46] uppercase tracking-wider">
                      Ready to make a splash
                    </span>
                    <button
                      onClick={() => navigate("/products")}
                      className="text-xs font-semibold text-[#0e3c46] underline hover:text-[#0a272e] mt-2"
                    >
                      Shop now
                    </button>
                  </div>
                  {/* CSS Sunglasses visual */}
                  <div className="relative w-16 h-12 mx-auto mt-4 flex items-center justify-center select-none pointer-events-none">
                    <div className="flex gap-1 items-center">
                      <div className="w-7 h-5 bg-gradient-to-br from-[#111] to-[#333] rounded-b-lg rounded-t-sm border border-[#222] shadow-sm relative">
                        <div className="absolute top-0.5 left-1 w-4 h-0.5 bg-white/20 rounded-full rotate-[-15deg]" />
                      </div>
                      <div className="w-2 h-0.5 bg-[#222] rounded-full" />
                      <div className="w-7 h-5 bg-gradient-to-br from-[#111] to-[#333] rounded-b-lg rounded-t-sm border border-[#222] shadow-sm relative">
                        <div className="absolute top-0.5 left-1 w-4 h-0.5 bg-white/20 rounded-full rotate-[-15deg]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Tile 5: Rightmost Tall Card (spans 3 cols on lg) */}
            <div className="lg:col-span-3 bg-[#1b4332] border-2 border-gray-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[350px] transition-all duration-300 ease-in-out hover:shadow-lg">
              <div className="z-10 flex flex-col items-start text-left text-white">
                <span className="text-xs font-semibold text-green-200 uppercase tracking-wider">
                  Grilling musts in 1 click
                </span>
                <h3 className="text-xl font-semibold text-white mt-2 mb-2 leading-tight">
                  A cookout for 8, under $5 per person*
                </h3>
                <button
                  onClick={() => navigate("/products")}
                  className="text-xs font-semibold text-green-300 underline hover:text-green-100"
                >
                  Shop now
                </button>
              </div>

              {/* CSS Barbecue grill visual */}
              <div className="relative w-24 h-24 mx-auto mt-6 flex flex-col items-center justify-end select-none pointer-events-none">
                {/* Grill Cover */}
                <div className="w-16 h-8 bg-[#e53e3e] rounded-t-full border border-red-700 relative">
                  <div className="absolute top-0.5 left-[28px] w-2 h-1.5 bg-gray-800 rounded-sm" />
                </div>
                {/* Grill Body */}
                <div className="w-16 h-8 bg-gray-900 rounded-b-full border-t border-gray-700 flex flex-col justify-start relative shadow-lg">
                  <div className="w-full h-0.5 bg-gray-600" />
                  <div className="flex gap-1 justify-center mt-1.5">
                    <div className="w-1 h-1 bg-red-500 rounded-full" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  </div>
                </div>
                {/* Grill Legs */}
                <div className="flex gap-4 justify-between w-10 h-8 mt-[-1px]">
                  <div className="w-0.5 h-full bg-gray-400 rotate-[-15deg]" />
                  <div className="w-0.5 h-full bg-gray-400 rotate-[15deg]" />
                </div>
              </div>

              <span className="text-[8px] font-semibold text-green-300/60 tracking-wider text-center block uppercase mt-2">
                *Excludes tax. Terms apply.
              </span>
            </div>

          </div>
        </div>
      )}

      {/* 6. Recommendations Section */}
      {!error && (
        <section className="w-full mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
          <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">Recommended for You</h2>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-center justify-items-center"
            role="grid"
            aria-label={loading ? "Loading products" : `${recommendedProducts.length} recommended products`}
          >
            {loading ? (
              [...Array(5)].map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            ) : (
              recommendedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  handleProductClick={handleProductClick}
                  handleKeyDown={handleKeyDown}
                />
              ))
            )}
          </div>
        </section>
      )}
      {/* Closing page-container */}
    </div>
  );
};

export default Home;
