import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../common/SummaryAPI";
import "../styles/Home.css";
import "../styles/ProductDetail.css"; // For button styling
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
      <div className="home-carousel-outer">
        <div className="home-carousel">
          <button
            className="home-carousel-arrow home-carousel-arrow-left"
            onClick={handlePrevCarousel}
            aria-label="Previous announcement"
          >
            <i className="lni lni-chevron-left home-carousel-arrow-icon"></i>
          </button>
          <div className="home-carousel-message">
            {carouselMessages[carouselIndex]}
          </div>
          <button
            className="home-carousel-arrow home-carousel-arrow-right"
            onClick={handleNextCarousel}
            aria-label="Next announcement"
          >
            <i className="lni lni-chevron-right home-carousel-arrow-icon"></i>
          </button>
        </div>
      </div>
      {/* Main Home Content */}
      <div className="product-list-container home-main-content">
        {error && (
          <div className="product-list-error" role="alert" tabIndex={0} aria-live="polite">
            <span className="product-list-error-icon" aria-hidden="true">⚠</span>
            {error}
            <button
              onClick={fetchProducts}
              className="product-list-retry-button"
              disabled={loading}
              aria-label="Retry loading products"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="product-list-loading" role="status" aria-live="polite">
            <div className="product-list-loading-spinner" aria-hidden="true"></div>
            Loading recommendations...
          </div>
        )}

        {/* Category Section */}
        {!loading && !error && randomCategories.length > 0 && (
          <section className="home-section home-categories-section">
            <h2 className="home-section-title">Categories</h2>
            <div
              className="product-list-product-grid home-categories-grid"
              role="list"
              aria-label={`${randomCategories.length} categories`}
            >
              {randomCategories.map((category) => (
                <div
                  key={category}
                  className="product-list-product-card home-category-card"
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
          <section className="home-section home-for-you-section">
            <h2 className="home-section-title">For You</h2>
            <div
              className="product-list-product-grid home-for-you-grid"
              role="grid"
              aria-label={`${forYouProducts.length} personalized products`}
            >
              {forYouProducts.map((product) => {
                const minPrice = getMinPrice(product);
                const imageUrl = getMainImageUrl(product);
                return (
                  <article
                    key={product._id}
                    className="product-list-product-card home-for-you-card"
                    onClick={() => handleProductClick(product._id)}
                    onKeyDown={(e) => handleKeyDown(e, product._id)}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`View ${product.productName || "product"} details`}
                  >
                    <div className="product-list-image-container">
                      <img
                        src={imageUrl}
                        alt={product.productName || "Product image"}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                          e.target.alt = `Image not available for ${product.productName || "product"}`;
                        }}
                      />
                    </div>
                    <div className="product-list-content">
                      <h2 title={product.productName}>{product.productName || "Unnamed Product"}</h2>
                      <p
                        className="product-list-price"
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
          <section className="home-section home-recommendations-section">
            <h2 className="home-section-title">Recommendations</h2>
            <div
              className="product-list-product-grid home-recommendations-grid"
              role="grid"
              aria-label={`${recommendedProducts.length} recommended products`}
            >
              {recommendedProducts.map((product) => {
                const minPrice = getMinPrice(product);
                const imageUrl = getMainImageUrl(product);
                return (
                  <article
                    key={product._id}
                    className="product-list-product-card home-recommendation-card"
                    onClick={() => handleProductClick(product._id)}
                    onKeyDown={(e) => handleKeyDown(e, product._id)}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`View ${product.productName || "product"} details`}
                  >
                    <div className="product-list-image-container">
                      <img
                        src={imageUrl}
                        alt={product.productName || "Product image"}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                          e.target.alt = `Image not available for ${product.productName || "product"}`;
                        }}
                      />
                    </div>
                    <div className="product-list-content">
                      <h2 title={product.productName}>{product.productName || "Unnamed Product"}</h2>
                      <p
                        className="product-list-price"
                        aria-label={`Price: ${formatPrice(minPrice)}`}
                      >
                        {formatPrice(minPrice)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="home-view-all-container">
              <button
                className="product-detail-add-to-favorites home-view-all-btn"
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