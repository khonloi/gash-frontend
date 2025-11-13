// Home.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY
} from "../constants/constants";
import ProductCard from "../components/ProductCard";

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

  // Shuffle helpers
  const getRandomItems = (arr, count, excludeIds = []) => {
    if (!Array.isArray(arr) || arr.length <= count) return arr;
    const filtered = excludeIds.length > 0 ? arr.filter(item => !excludeIds.includes(item._id || item)) : arr;
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Helper function to get main image URL from product
  const getMainImageUrl = (product) => {
    if (!product.productImageIds || product.productImageIds.length === 0) {
      return "/placeholder-image.png";
    }
    const mainImage = product.productImageIds.find(img => img.isMain);
    return mainImage?.imageUrl || product.productImageIds[0]?.imageUrl || "/placeholder-image.png";
  };

  // Helper function to get a random product from a category
  const getRandomProductForCategory = (categoryName) => {
    const categoryProducts = products.filter(
      (product) => product.categoryId?.cat_name === categoryName
    );
    if (categoryProducts.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * categoryProducts.length);
    return categoryProducts[randomIndex];
  };

  // State for randomized sections
  const [forYouProducts, setForYouProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [randomCategories, setRandomCategories] = useState([]);
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
    if (categories.length > 0) {
      setRandomCategories(getRandomItems(categories, 16));
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

  // Category slider navigation
  const handleCategoryPrev = () => {
    if (categorySliderRef.current) {
      const cardWidth = 144; // 9em ≈ 144px (assuming 1em = 16px)
      const gap = 20; // gap-5 = 1.25rem = 20px
      const scrollAmount = cardWidth + gap;
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
      const cardWidth = 144;
      const gap = 20;
      const scrollAmount = cardWidth + gap;
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
    <>
      {/* Carousel Section - full viewport width */}
      <div className="w-full overflow-x-hidden">
        <div className="relative w-full min-h-[340px] h-[36vw] max-h-[400px] flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-50 overflow-hidden box-border">
          <button
            className="absolute left-8 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-2xl"
            onClick={handlePrevCarousel}
            aria-label="Previous announcement"
          >
            <i className="lni lni-chevron-left"></i>
          </button>
          <div className="w-full max-w-[900px] text-center text-4xl font-bold text-gray-900 letter-spacing tracking-wide leading-tight px-16 select-none box-border m-0 overflow-hidden md:text-2xl">
            {carouselMessages[carouselIndex]}
          </div>
          <button
            className="absolute right-8 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-2xl"
            onClick={handleNextCarousel}
            aria-label="Next announcement"
          >
            <i className="lni lni-chevron-right"></i>
          </button>
        </div>
      </div>
      {/* Main Home Content */}
      <div className="flex flex-col items-center w-full max-w-7xl mx-auto my-5 p-4 bg-white text-gray-900">
        {error && (
          <div className="text-center text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-xl p-8 mb-4 w-full flex items-center justify-center gap-2.5 flex-wrap" role="alert" tabIndex={0} aria-live="polite">
            <span className="text-lg" aria-hidden="true">⚠</span>
            {error}
            <button
              onClick={fetchProducts}
              className="px-3 py-1.5 bg-transparent border-2 border-gray-300 text-blue-600 text-sm rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-600 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2 disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              disabled={loading}
              aria-label="Retry loading products"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center text-sm text-gray-500 border-2 border-gray-300 rounded-xl p-8 mb-4 w-full flex items-center justify-center gap-2 flex-wrap" role="status" aria-live="polite">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            Loading recommendations...
          </div>
        )}

        {/* Category Section */}
        {!loading && !error && randomCategories.length > 0 && (
          <section className="w-full mt-0">
            <h2 className="text-left mb-6 text-xl font-semibold">Categories</h2>
            {/* Mobile: Horizontal slider with navigation */}
            <div className="md:hidden relative">
              <div
                ref={categorySliderRef}
                onScroll={handleCategoryScroll}
                className="flex overflow-x-auto gap-5 scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                role="list"
                aria-label={`${randomCategories.length} categories`}
              >
                {randomCategories.map((category) => {
                  const categoryProduct = getRandomProductForCategory(category);
                  const categoryImageUrl = categoryProduct ? getMainImageUrl(categoryProduct) : "/placeholder-image.png";
                  
                  return (
                    <div
                      key={category}
                      className="w-[9em] flex-shrink-0 border-2 border-gray-300 rounded-xl overflow-hidden flex flex-col cursor-pointer hover:shadow-md focus:shadow-md focus:outline-none"
                      tabIndex={0}
                      role="listitem"
                      aria-label={`View products in ${category}`}
                      onClick={() => handleCategoryClick(category)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") handleCategoryClick(category);
                      }}
                    >
                      {/* Square image thumbnail */}
                      <div className="w-[9em] h-[9em] overflow-hidden bg-gray-50">
                        <img
                          src={categoryImageUrl}
                          alt={`${category} category`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.png";
                            e.target.alt = `Image not available for ${category}`;
                          }}
                        />
                      </div>
                      {/* Category name */}
                      <div className="flex items-center justify-center bg-white px-2 py-2 min-h-[3em]">
                        <span className="font-semibold text-sm text-center line-clamp-2">
                          {category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Navigation buttons for mobile */}
              {categoryScrollPosition > 0 && (
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full shadow-md cursor-pointer hover:bg-gray-50 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
                  onClick={handleCategoryPrev}
                  aria-label="Previous categories"
                >
                  <i className="lni lni-chevron-left text-xl"></i>
                </button>
              )}
              {canScrollNext && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full shadow-md cursor-pointer hover:bg-gray-50 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
                  onClick={handleCategoryNext}
                  aria-label="Next categories"
                >
                  <i className="lni lni-chevron-right text-xl"></i>
                </button>
              )}
            </div>
            {/* Desktop: Grid layout */}
            <div
              className="hidden md:grid md:grid-cols-8 gap-5"
              role="list"
              aria-label={`${randomCategories.length} categories`}
            >
              {randomCategories.map((category) => {
                const categoryProduct = getRandomProductForCategory(category);
                const categoryImageUrl = categoryProduct ? getMainImageUrl(categoryProduct) : "/placeholder-image.png";
                
                return (
                  <div
                    key={category}
                    className="w-[9em] border-2 border-gray-300 rounded-xl overflow-hidden flex flex-col cursor-pointer hover:shadow-md focus:shadow-md focus:outline-none"
                    tabIndex={0}
                    role="listitem"
                    aria-label={`View products in ${category}`}
                    onClick={() => handleCategoryClick(category)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleCategoryClick(category);
                    }}
                  >
                    {/* Square image thumbnail */}
                    <div className="w-[9em] h-[9em] overflow-hidden bg-gray-50">
                      <img
                        src={categoryImageUrl}
                        alt={`${category} category`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                          e.target.alt = `Image not available for ${category}`;
                        }}
                      />
                    </div>
                    {/* Category name */}
                    <div className="flex items-center justify-center bg-white px-2 py-2 min-h-[3em]">
                      <span className="font-semibold text-sm text-center line-clamp-2">
                        {category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* For You Section */}
        {!loading && !error && forYouProducts.length > 0 && (
          <section className="w-full mt-10">
            <h2 className="text-left mb-6 text-xl font-semibold">For You</h2>
            <div
              className="grid grid-cols-2 gap-5 md:grid-cols-5"
              role="grid"
              aria-label={`${forYouProducts.length} personalized products`}
            >
              {forYouProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  handleProductClick={handleProductClick}
                  handleKeyDown={handleKeyDown}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recommendations Section */}
        {!loading && !error && recommendedProducts.length > 0 && (
          <section className="w-full mt-10">
            <h2 className="text-left mb-6 text-xl font-semibold">Recommendations</h2>
            <div
              className="grid grid-cols-2 gap-5 md:grid-cols-5"
              role="grid"
              aria-label={`${recommendedProducts.length} recommended products`}
            >
              {recommendedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  handleProductClick={handleProductClick}
                  handleKeyDown={handleKeyDown}
                />
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <button
                className="min-w-[180px] text-base bg-amber-400 text-gray-900 py-2 px-4 rounded-lg hover:bg-amber-500 focus:outline focus:outline-2 focus:outline-blue-600 focus:outline-offset-2"
                onClick={handleViewAll}
              >
                View All
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default Home;