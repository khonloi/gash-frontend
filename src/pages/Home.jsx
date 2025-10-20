import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY
} from "../constants/constants";

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

// Helper function to get minimum price from product variants
const getMinPrice = (product) => {
  if (!product.productVariantIds || product.productVariantIds.length === 0) {
    return 0;
  }
  const prices = product.productVariantIds
    .filter(v => v.variantStatus !== 'discontinued' && v.variantPrice > 0)
    .map(v => v.variantPrice);
  return prices.length > 0 ? Math.min(...prices) : 0;
};

// Helper function to get main image URL
const getMainImageUrl = (product) => {
  if (!product.productImageIds || product.productImageIds.length === 0) {
    return "/placeholder-image.png";
  }
  const mainImage = product.productImageIds.find(img => img.isMain);
  return mainImage?.imageUrl || product.productImageIds[0]?.imageUrl || "/placeholder-image.png";
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
      
      // Extract unique categories from products
      const uniqueCategories = [
        ...new Set(activeProducts.map((product) => product.categoryId?.cat_name).filter(Boolean)),
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
      setRandomCategories(getRandomItems(categories, 5));
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

  const formatPrice = (price) => {
    if (typeof price !== "number" || isNaN(price)) return "N/A";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

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
            <div
              className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5"
              role="list"
              aria-label={`${randomCategories.length} categories`}
            >
              {randomCategories.map((category) => (
                <div
                  key={category}
                  className="border-2 border-gray-300 rounded-xl p-4 flex items-center justify-center min-h-[30px] font-semibold text-lg cursor-pointer hover:shadow-md focus:shadow-md focus:outline-none"
                  tabIndex={0}
                  role="listitem"
                  aria-label={`View products in ${category}`}
                  onClick={() => handleCategoryClick(category)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleCategoryClick(category);
                  }}
                >
                  {category}
                </div>
              ))}
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
              {forYouProducts.map((product) => {
                const minPrice = getMinPrice(product);
                const imageUrl = getMainImageUrl(product);
                return (
                  <article
                    key={product._id}
                    className="border-2 border-gray-300 rounded-xl p-4 hover:shadow-md focus:shadow-md focus:outline-none cursor-pointer"
                    onClick={() => handleProductClick(product._id)}
                    onKeyDown={(e) => handleKeyDown(e, product._id)}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`View ${product.productName || "product"} details`}
                  >
                    <div className="mb-3">
                      <img
                        src={imageUrl}
                        alt={product.productName || "Product image"}
                        loading="lazy"
                        className="w-full max-h-[180px] object-contain rounded"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                          e.target.alt = `Image not available for ${product.productName || "product"}`;
                        }}
                      />
                    </div>
                    <div>
                      <h2
                        title={product.productName}
                        className="text-black line-clamp-2 min-h-[2.6em] leading-tight"
                      >
                        {product.productName || "Unnamed Product"}
                      </h2>
                      <p
                        className="text-red-600 text-lg font-semibold mt-2"
                        aria-label={`Price: ${formatPrice(minPrice)}`}
                      >
                        {formatPrice(minPrice)}
                      </p>
                    </div>
                  </article>
                );
              })}
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
              {recommendedProducts.map((product) => {
                const minPrice = getMinPrice(product);
                const imageUrl = getMainImageUrl(product);
                return (
                  <article
                    key={product._id}
                    className="border-2 border-gray-300 rounded-xl p-4 hover:shadow-md focus:shadow-md focus:outline-none cursor-pointer"
                    onClick={() => handleProductClick(product._id)}
                    onKeyDown={(e) => handleKeyDown(e, product._id)}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`View ${product.productName || "product"} details`}
                  >
                    <div className="mb-3">
                      <img
                        src={imageUrl}
                        alt={product.productName || "Product image"}
                        loading="lazy"
                        className="w-full max-h-[180px] object-contain rounded"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                          e.target.alt = `Image not available for ${product.productName || "product"}`;
                        }}
                      />
                    </div>
                    <div>
                      <h2
                        title={product.productName}
                        className="text-black line-clamp-2 min-h-[2.6em] leading-tight"
                      >
                        {product.productName || "Unnamed Product"}
                      </h2>
                      <p
                        className="text-red-600 text-lg font-semibold mt-2"
                        aria-label={`Price: ${formatPrice(minPrice)}`}
                      >
                        {formatPrice(minPrice)}
                      </p>
                    </div>
                  </article>
                );
              })}
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