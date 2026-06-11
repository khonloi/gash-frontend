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

              {/* Styled e-Gift Card Previews in pure CSS */}
              <div className="absolute -right-6 -bottom-6 w-52 h-44 pointer-events-none select-none">
                {/* Card 1 */}
                <div className="absolute right-12 bottom-12 w-40 h-24 bg-gradient-to-br from-[#111827] to-[#1f2937] text-white rounded-xl p-3 shadow-lg border border-gray-800 flex flex-col justify-between rotate-[-12deg] z-10 transition-transform duration-300 hover:rotate-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-semibold text-amber-500 tracking-wider">GASH</span>
                    <div className="w-4 h-3 bg-amber-500/20 border border-amber-500/30 rounded-sm" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono tracking-widest">**** 9876</span>
                    <div className="text-[8px] text-gray-500 uppercase mt-0.5">Gift Card</div>
                  </div>
                </div>
                {/* Card 2 */}
                <div className="absolute right-4 bottom-4 w-40 h-24 bg-white text-gray-900 rounded-xl p-3 shadow-md border border-gray-200 flex flex-col justify-between rotate-[4deg]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-semibold text-blue-900 tracking-wider">GASH</span>
                    <span className="text-xs font-semibold text-amber-500">$50</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono tracking-widest">**** 5432</span>
                    <div className="text-[8px] text-gray-400 uppercase mt-0.5">e-Gift Voucher</div>
                  </div>
                </div>
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
                <div className="p-3 bg-blue-100/50 rounded-2xl">
                  <LocalShippingOutlinedIcon className="text-blue-700" style={{ fontSize: 48 }} />
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
                  <div className="flex justify-end mt-2">
                    <CheckroomOutlinedIcon className="text-blue-800 opacity-80" style={{ fontSize: 36 }} />
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
                  <div className="flex justify-end mt-2">
                    <AssignmentReturnOutlinedIcon className="text-sky-700 opacity-80" style={{ fontSize: 36 }} />
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

              {/* Credit Card Mockup */}
              <div className="relative mt-8 mb-4">
                {/* Backdrop glowing effect */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-blue-100 rounded-full opacity-60 filter blur-xl pointer-events-none" />

                <div className="relative w-44 h-28 bg-gradient-to-br from-[#0c1a30] to-[#1a385c] rounded-2xl border border-blue-900/30 p-4 flex flex-col justify-between shadow-xl mx-auto transition-all duration-300 hover:rotate-1 hover:scale-105">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-semibold text-amber-400 tracking-wider">GASH</span>
                    <div className="w-5 h-4 bg-amber-500/20 border border-amber-500/30 rounded" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-300 font-mono tracking-widest">**** **** 5678</span>
                    <div className="text-[8px] text-gray-400 uppercase mt-0.5 font-semibold">Gold Member</div>
                  </div>
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
