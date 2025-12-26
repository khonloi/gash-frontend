// Home.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpward } from "@mui/icons-material";
import Api from "../common/SummaryAPI";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY
} from "../constants/constants";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import ProductButton from "../components/ProductButton";

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

const carouselMessages = [
  "Welcome to GASH! Discover the latest trends.",
  "Enjoy exclusive deals and recommendations.",
  "Shop by category and find your perfect fit.",
  "Fast delivery and easy returns on all orders.",
  "Sign up for an account to save your favorites!"
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Carousel auto-cycling
  const AUTO_CYCLE_DELAY = 5000;
  const [isManuallyNavigated, setIsManuallyNavigated] = useState(false);
  useEffect(() => {
    if (isManuallyNavigated) {
      const pause = setTimeout(() => setIsManuallyNavigated(false), AUTO_CYCLE_DELAY);
      return () => clearTimeout(pause);
    }
    const timer = setTimeout(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselMessages.length);
    }, AUTO_CYCLE_DELAY);
    return () => clearTimeout(timer);
  }, [carouselIndex, isManuallyNavigated]);

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
            .map((product) => product.categoryId?.cat_name)
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

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  const categorySliderRef = useRef(null);
  const [categoryStartIndex, setCategoryStartIndex] = useState(0);
  const CATEGORIES_PER_PAGE = 6; // Số categories hiển thị mỗi lần
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Randomize once after products/categories are loaded
  useEffect(() => {
    if (products.length > 0) {
      const forYou = getRandomItems(products, 5);
      setForYouProducts(forYou);
      setRecommendedProducts(getRandomItems(products, 5, forYou.map(p => p._id)));
    }
  }, [products]);

  useEffect(() => {
    if (categories.length > 0) {
      setRandomCategories(getRandomItems(categories, 16));
      setCategoryStartIndex(0); // Reset to first page when categories change
    }
  }, [categories]);

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

  const handleViewAll = () => {
    navigate("/products");
  };

  const handleCategoryClick = (category) => {
    if (!category) return;
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  // Category slider navigation for mobile - Circular/Continuous
  const handleCategoryPrev = () => {
    if (categorySliderRef.current) {
      const cardWidth = 144; // 9em ≈ 144px (assuming 1em = 16px)
      const gap = 20; // gap-5 = 1.25rem = 20px
      const scrollAmount = cardWidth + gap;
      const scrollLeft = categorySliderRef.current.scrollLeft;

      if (scrollLeft <= 0) {
        // Quay về cuối danh sách
        const maxScroll = categorySliderRef.current.scrollWidth - categorySliderRef.current.clientWidth;
        categorySliderRef.current.scrollTo({
          left: maxScroll,
          behavior: 'smooth'
        });
      } else {
        const newPosition = Math.max(0, scrollLeft - scrollAmount);
        categorySliderRef.current.scrollTo({
          left: newPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleCategoryNext = () => {
    if (categorySliderRef.current) {
      const cardWidth = 144;
      const gap = 20;
      const scrollAmount = cardWidth + gap;
      const scrollLeft = categorySliderRef.current.scrollLeft;
      const maxScroll = categorySliderRef.current.scrollWidth - categorySliderRef.current.clientWidth;

      if (scrollLeft >= maxScroll - 1) {
        // Quay về đầu danh sách
        categorySliderRef.current.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        const newPosition = Math.min(maxScroll, scrollLeft + scrollAmount);
        categorySliderRef.current.scrollTo({
          left: newPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  // Desktop category navigation - Circular/Continuous
  const handleDesktopCategoryPrev = () => {
    setCategoryStartIndex((prev) => {
      if (prev <= 0) {
        // Quay về cuối danh sách
        const lastPageStart = Math.max(0, randomCategories.length - CATEGORIES_PER_PAGE);
        return lastPageStart < 0 ? 0 : lastPageStart;
      }
      return prev - CATEGORIES_PER_PAGE;
    });
  };

  const handleDesktopCategoryNext = () => {
    setCategoryStartIndex((prev) => {
      const nextIndex = prev + CATEGORIES_PER_PAGE;
      const maxIndex = Math.max(0, randomCategories.length - CATEGORIES_PER_PAGE);

      if (nextIndex >= randomCategories.length) {
        // Quay về đầu danh sách
        return 0;
      }
      return Math.min(nextIndex, maxIndex);
    });
  };

  // Get visible categories for desktop - Circular wrap
  const getVisibleCategories = () => {
    if (randomCategories.length === 0) return [];

    const endIndex = categoryStartIndex + CATEGORIES_PER_PAGE;

    if (endIndex <= randomCategories.length) {
      // Normal case: no wrapping needed
      return randomCategories.slice(categoryStartIndex, endIndex);
    } else {
      // Wrap around: take from start + remaining from end
      const fromStart = randomCategories.slice(categoryStartIndex);
      const remaining = CATEGORIES_PER_PAGE - fromStart.length;
      const fromEnd = randomCategories.slice(0, remaining);
      return [...fromStart, ...fromEnd];
    }
  };

  const visibleCategories = getVisibleCategories();
  // Always show buttons if there are more categories than displayed
  const canPrevDesktop = randomCategories.length > CATEGORIES_PER_PAGE;
  const canNextDesktop = randomCategories.length > CATEGORIES_PER_PAGE;

  // Update scroll position on scroll (for potential future use)
  const handleCategoryScroll = () => {
    // Scroll position tracking removed as not needed for circular navigation
  };

  // Carousel controls (currently auto-cycling only)
  // const handlePrevCarousel = () => {
  //   setCarouselIndex((prev) => (prev === 0 ? carouselMessages.length - 1 : prev - 1));
  //   setIsManuallyNavigated(true);
  // };
  // const handleNextCarousel = () => {
  //   setCarouselIndex((prev) => (prev === carouselMessages.length - 1 ? 0 : prev + 1));
  //   setIsManuallyNavigated(true);
  // };

  return (
    <div>
      {/* Carousel Section - full viewport width */}
      <div className="w-full overflow-x-hidden">
        <div className="relative w-full min-h-[220px] sm:min-h-[300px] md:min-h-[360px] h-[40vw] sm:h-[38vw] md:h-[36vw] max-h-[320px] sm:max-h-[380px] md:max-h-[420px] flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-50 overflow-hidden box-border shadow-[0_4px_20px_rgba(234,179,8,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
          <div className="relative w-full max-w-[900px] text-center text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-800 letter-spacing tracking-wide leading-relaxed px-4 sm:px-8 md:px-12 lg:px-16 select-none box-border m-0 overflow-hidden drop-shadow-sm">
            {carouselMessages[carouselIndex]}
          </div>
        </div>
      </div>
      {/* Main Home Content */}
      <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-4 sm:my-5 md:my-6 p-4 sm:p-5 md:p-6 lg:p-7 text-gray-900">
        {error && (
          <div className="text-center text-sm sm:text-base text-red-700 bg-gradient-to-br from-red-50 via-red-50/80 to-orange-50 border-2 border-red-200 rounded-3xl p-5 sm:p-6 md:p-7 mb-4 sm:mb-5 w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 shadow-[0_8px_30px_rgba(239,68,68,0.2)]" role="alert" tabIndex={0} aria-live="polite">
            <span className="text-2xl sm:text-3xl" aria-hidden="true">😊</span>
            <span className="font-medium">{error}</span>
            <ProductButton
              onClick={fetchProducts}
              variant="secondary"
              size="sm"
              disabled={loading}
              aria-label="Retry loading products"
              className="mt-2 sm:mt-0 rounded-full px-4 py-2 text-sm"
            >
              Try Again
            </ProductButton>
          </div>
        )}

        {/* Category Section */}
        {!error && (
          <section className="w-full mt-0 bg-gradient-to-br from-white via-yellow-50/30 to-white rounded-3xl p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgba(234,179,8,0.15)] border border-yellow-100/50">
            <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-2xl font-bold text-yellow-600">Categories</h2>
            </div>
            {loading ? (
              <>
                {/* Category skeleton - Mobile */}
                <div className="lg:hidden">
                  <div className="flex overflow-x-auto gap-2 sm:gap-3 md:gap-4 scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[...Array(8)].map((_, index) => (
                      <div
                        key={index}
                        className="w-[7em] flex-shrink-0 border-2 border-gray-200 rounded-2xl overflow-hidden flex flex-col bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                      >
                        <div className="flex items-center justify-center bg-gray-50 px-2 py-3 min-h-[3em]">
                          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Category skeleton - Desktop */}
                <div className="hidden lg:grid lg:grid-cols-8 gap-3 lg:gap-4">
                  {[...Array(8)].map((_, index) => (
                    <div
                      key={index}
                      className="w-[7em] border-2 border-gray-200 rounded-2xl overflow-hidden flex flex-col bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                    >
                      <div className="flex items-center justify-center bg-gray-50 px-2 py-3 min-h-[3em]">
                        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Mobile: Horizontal slider with navigation */}
                <div className="lg:hidden relative">
                  <div
                    ref={categorySliderRef}
                    onScroll={handleCategoryScroll}
                    className="flex overflow-x-auto gap-2 sm:gap-3 md:gap-4 scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    role="list"
                    aria-label={`${randomCategories.length} categories`}
                  >
                    {randomCategories.map((category) => {
                      return (
                        <div
                          key={category}
                          className="w-[7em] flex-shrink-0 border-2 border-yellow-200/60 rounded-2xl overflow-hidden flex flex-col cursor-pointer bg-white/90 backdrop-blur-sm shadow-[0_4px_15px_rgba(234,179,8,0.1)] hover:bg-gradient-to-br hover:from-yellow-100 hover:via-yellow-50 hover:to-white hover:border-yellow-400 hover:shadow-[0_12px_40px_rgba(234,179,8,0.25)] hover:-translate-y-1 focus:shadow-[0_12px_40px_rgba(234,179,8,0.25)] focus:outline-none transition-all duration-300 ease-out group"
                          tabIndex={0}
                          role="listitem"
                          aria-label={`View products in ${category}`}
                          onClick={() => handleCategoryClick(category)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") handleCategoryClick(category);
                          }}
                        >
                          {/* Category name */}
                          <div className="flex items-center justify-center bg-gradient-to-b from-white to-yellow-50/30 group-hover:from-yellow-100 group-hover:to-yellow-50 px-3 py-3 min-h-[3em] transition-all duration-300">
                            <span className="font-semibold text-xs text-center line-clamp-2 text-gray-700 group-hover:text-yellow-800 transition-colors duration-300">
                              {category}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Navigation buttons for mobile - Always visible */}
                  {randomCategories.length > 0 && (
                    <>
                      <button
                        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white/90 backdrop-blur-md border-2 border-yellow-200/60 rounded-full shadow-[0_4px_15px_rgba(234,179,8,0.2)] cursor-pointer hover:bg-gradient-to-br hover:from-yellow-400 hover:to-yellow-500 hover:border-yellow-500 hover:shadow-[0_8px_25px_rgba(234,179,8,0.4)] hover:scale-110 focus:outline-none transition-all duration-300 group"
                        onClick={handleCategoryPrev}
                        aria-label="Previous categories"
                      >
                        <i className="lni lni-chevron-left text-lg sm:text-xl text-yellow-600 group-hover:text-white transition-colors font-semibold"></i>
                      </button>
                      <button
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white/90 backdrop-blur-md border-2 border-yellow-200/60 rounded-full shadow-[0_4px_15px_rgba(234,179,8,0.2)] cursor-pointer hover:bg-gradient-to-br hover:from-yellow-400 hover:to-yellow-500 hover:border-yellow-500 hover:shadow-[0_8px_25px_rgba(234,179,8,0.4)] hover:scale-110 focus:outline-none transition-all duration-300 group"
                        onClick={handleCategoryNext}
                        aria-label="Next categories"
                      >
                        <i className="lni lni-chevron-right text-lg sm:text-xl text-yellow-600 group-hover:text-white transition-colors font-semibold"></i>
                      </button>
                    </>
                  )}
                </div>
                {/* Desktop: Grid layout with navigation */}
                <div className="hidden lg:block relative">
                  <div
                    className="grid lg:grid-cols-6 gap-3 lg:gap-4"
                    role="list"
                    aria-label={`${randomCategories.length} categories`}
                  >
                    {visibleCategories.map((category) => {
                      return (
                        <div
                          key={category}
                          className="w-[7em] border-2 border-yellow-200/60 rounded-2xl overflow-hidden flex flex-col cursor-pointer bg-white/90 backdrop-blur-sm shadow-[0_4px_15px_rgba(234,179,8,0.1)] hover:bg-gradient-to-br hover:from-yellow-100 hover:via-yellow-50 hover:to-white hover:border-yellow-400 hover:shadow-[0_12px_40px_rgba(234,179,8,0.25)] hover:-translate-y-1 focus:shadow-[0_12px_40px_rgba(234,179,8,0.25)] focus:outline-none transition-all duration-300 ease-out group"
                          tabIndex={0}
                          role="listitem"
                          aria-label={`View products in ${category}`}
                          onClick={() => handleCategoryClick(category)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") handleCategoryClick(category);
                          }}
                        >
                          {/* Category name */}
                          <div className="flex items-center justify-center bg-gradient-to-b from-white to-yellow-50/30 group-hover:from-yellow-100 group-hover:to-yellow-50 px-3 py-3 min-h-[3em] transition-all duration-300">
                            <span className="font-semibold text-sm text-center line-clamp-2 text-gray-700 group-hover:text-yellow-800 transition-colors duration-300">
                              {category}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Desktop Navigation buttons */}
                  {canPrevDesktop && (
                    <button
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-md border-2 border-yellow-200/60 rounded-full shadow-[0_4px_15px_rgba(234,179,8,0.2)] hover:bg-gradient-to-br hover:from-yellow-400 hover:to-yellow-500 hover:border-yellow-500 hover:shadow-[0_8px_25px_rgba(234,179,8,0.4)] hover:scale-110 focus:outline-none transition-all duration-300 z-10 group"
                      onClick={handleDesktopCategoryPrev}
                      aria-label="Previous categories"
                    >
                      <i className="lni lni-chevron-left text-xl text-yellow-600 group-hover:text-white transition-colors font-semibold"></i>
                    </button>
                  )}
                  {canNextDesktop && (
                    <button
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur-md border-2 border-yellow-200/60 rounded-full shadow-[0_4px_15px_rgba(234,179,8,0.2)] hover:bg-gradient-to-br hover:from-yellow-400 hover:to-yellow-500 hover:border-yellow-500 hover:shadow-[0_8px_25px_rgba(234,179,8,0.4)] hover:scale-110 focus:outline-none transition-all duration-300 z-10 group"
                      onClick={handleDesktopCategoryNext}
                      aria-label="Next categories"
                    >
                      <i className="lni lni-chevron-right text-xl text-yellow-600 group-hover:text-white transition-colors font-semibold"></i>
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* For You Section */}
        {!error && (
          <section className="w-full mt-5 sm:mt-6 md:mt-8 bg-gradient-to-br from-white via-yellow-50/20 to-white rounded-3xl p-5 sm:p-6 md:p-7 shadow-[0_8px_30px_rgba(234,179,8,0.15)] border border-yellow-100/50">
            <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-xl sm:text-2xl md:text-2xl font-bold text-yellow-600">For You</h2>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
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

        {/* Recommendations Section */}
        {!error && (
          <section className="w-full mt-5 sm:mt-6 md:mt-8 bg-gradient-to-br from-white via-yellow-50/20 to-white rounded-3xl p-5 sm:p-6 md:p-7 shadow-[0_8px_30px_rgba(234,179,8,0.15)] border border-yellow-100/50">
            <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-xl sm:text-2xl md:text-2xl font-bold text-yellow-600">Recommendations</h2>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5"
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
            {!loading && (
              <div className="flex justify-center mt-6 sm:mt-7 md:mt-8">
                <ProductButton
                  variant="primary"
                  size="lg"
                  onClick={handleViewAll}
                  className="min-w-[140px] sm:min-w-[160px] md:min-w-[170px] px-5 py-2.5 text-sm sm:text-base font-semibold rounded-full shadow-[0_4px_15px_rgba(234,179,8,0.25)] hover:shadow-[0_8px_25px_rgba(234,179,8,0.35)] transition-all duration-300 hover:scale-105 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 border border-yellow-400/20"
                >
                  View All
                </ProductButton>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-white rounded-full shadow-[0_8px_25px_rgba(234,179,8,0.4)] hover:shadow-[0_12px_35px_rgba(234,179,8,0.5)] transition-all duration-300 hover:scale-110 focus:outline-none group border-2 border-white/20"
          aria-label="Scroll to top"
        >
          <ArrowUpward className="group-hover:-translate-y-1 transition-transform duration-300" fontSize="large" />
        </button>
      )}
    </div>
  );
};

export default Home;