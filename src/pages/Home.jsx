// Home.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY
} from "../constants/constants";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import ProductButton from "../components/ProductButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

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
      setRandomCategories(categories); // Now using full list and slider handles visibility

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

  const handleViewAll = () => {
    navigate("/products");
  };

  const handleCategoryClick = (category) => {
    if (!category) return;
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  // Category slider navigation
  const handleCategoryPrev = () => {
    if (categorySliderRef.current) {
      const cardWidth = 160; // Increased width for 7 items
      const gap = 20;
      const scrollAmount = (cardWidth + gap) * 1;
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
      const scrollAmount = (cardWidth + gap) * 1;
      const maxScroll = categorySliderRef.current.scrollWidth - categorySliderRef.current.clientWidth;
      const newPosition = Math.min(maxScroll, categoryScrollPosition + scrollAmount);
      categorySliderRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setCategoryScrollPosition(newPosition);
    }
  };

  // Update scroll position on scroll
  const handleCategoryScroll = () => {
    if (categorySliderRef.current) {
      const scrollLeft = categorySliderRef.current.scrollLeft;
      const scrollWidth = categorySliderRef.current.scrollWidth;
      const clientWidth = categorySliderRef.current.clientWidth;
      setCategoryScrollPosition(scrollLeft);
      setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Check scroll position on mount and when categories change
  useEffect(() => {
    if (categorySliderRef.current && randomCategories.length > 0) {
      const checkScroll = () => {
        if (categorySliderRef.current) {
          const scrollWidth = categorySliderRef.current.scrollWidth;
          const clientWidth = categorySliderRef.current.clientWidth;
          setCanScrollNext(scrollWidth > clientWidth);
        }
      };
      // Check after a short delay to ensure DOM is updated
      const timer = setTimeout(checkScroll, 100);
      // Also check on window resize
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [randomCategories]);

  // Carousel controls
  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev === 0 ? carouselMessages.length - 1 : prev - 1));
    setIsManuallyNavigated(true);
  };
  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev === carouselMessages.length - 1 ? 0 : prev + 1));
    setIsManuallyNavigated(true);
  };

  return (
    <div>
      {/* Carousel Section - full viewport width */}
      <div className="w-full overflow-x-hidden">
        <div className="relative w-full min-h-[200px] sm:min-h-[280px] md:min-h-[340px] h-[40vw] sm:h-[38vw] md:h-[36vw] lg:h-[calc(100vh-128px)] max-h-[300px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-none flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-50 overflow-hidden box-border">
          <button
            className="absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-xl sm:text-2xl"
            onClick={handlePrevCarousel}
            aria-label="Previous announcement"
          >
            <i className="lni lni-chevron-left"></i>
          </button>
          <div className="w-full max-w-[900px] text-center text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 letter-spacing tracking-wide leading-tight px-4 sm:px-8 md:px-12 lg:px-16 select-none box-border m-0 overflow-hidden">
            {carouselMessages[carouselIndex]}
          </div>
          <button
            className="absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-xl sm:text-2xl"
            onClick={handleNextCarousel}
            aria-label="Next announcement"
          >
            <i className="lni lni-chevron-right"></i>
          </button>
        </div>
      </div>
      {/* Main Home Content */}
      <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-3 sm:my-4 md:my-5 p-3 sm:p-4 md:p-5 lg:p-6 text-gray-900">
        {error && (
          <div className="text-center text-xs sm:text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 w-full flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap" role="alert" tabIndex={0} aria-live="polite">
            <span className="text-lg" aria-hidden="true">⚠</span>
            {error}
            <ProductButton
              onClick={fetchProducts}
              variant="secondary"
              size="sm"
              disabled={loading}
              aria-label="Retry loading products"
            >
              Retry
            </ProductButton>
          </div>
        )}

        {/* Category Section */}
        {!error && (
          <section className="w-full mt-0 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
            <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">Categories</h2>
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
                  {randomCategories.map((category) => {
                    return (
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
                          <span className="font-semibold text-sm sm:text-base text-center line-clamp-2">
                            {category}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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

        {/* For You Section */}
        {!error && (
          <section className="w-full mt-6 sm:mt-8 md:mt-10 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
            <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">For You</h2>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-between"
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
          <section className="w-full mt-6 sm:mt-8 md:mt-10 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
            <h2 className="text-left mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-xl font-semibold">Recommendations</h2>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-between"
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
            {/* {!loading && (
              <div className="flex justify-center mt-6 sm:mt-7 md:mt-8">
                <ProductButton
                  variant="primary"
                  size="lg"
                  onClick={handleViewAll}
                  className="min-w-[140px] sm:min-w-[160px] md:min-w-[180px]"
                >
                  View All
                </ProductButton>
              </div>
            )} */}
          </section>
        )}

        {/* Dynamic Category Sections */}
        {!error && !loading && randomCategorySections.length > 0 && (
          <div className="w-full mt-8 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative w-full min-h-[160px] sm:min-h-[220px] md:min-h-[260px] flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-50 py-12 px-6">
              <div className="text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-wide leading-tight max-w-4xl select-none">
                Explore our curated categories and find your signature style.
              </div>
            </div>
          </div>
        )}

        {!error && !loading && randomCategorySections.map((section, idx) => (
          <section key={idx} className="w-full mt-6 sm:mt-8 md:mt-10 bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-left text-lg sm:text-xl md:text-xl font-semibold">
                {section.categoryName}
              </h2>
              <button
                onClick={() => handleCategoryClick(section.categoryName)}
                className="text-amber-600 text-sm font-medium hover:underline"
              >
                Explore More
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 justify-between">
              {section.products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  handleProductClick={handleProductClick}
                  handleKeyDown={handleKeyDown}
                />
              ))}
              {section.products.length === 0 && (
                <div className="col-span-full py-10 text-center text-gray-500 italic">
                  No products available in this category yet.
                </div>
              )}
            </div>
          </section>
        ))}

        {!error && !loading && randomCategorySections.length > 0 && (
          <div className="w-full mt-8 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative w-full min-h-[160px] sm:min-h-[220px] md:min-h-[260px] flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-50 py-12 px-6">
              <div className="text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-wide leading-tight max-w-4xl select-none">
                Elevate your wardrobe with GASH's exclusive seasonal picks.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;