import React, { useState, useEffect, useCallback, useRef } from "react";
import Api from "../common/SummaryAPI";
import ProductGridLayout from "../components/layout/ProductGridLayout";
import {
  API_RETRY_COUNT,
  API_RETRY_DELAY,
} from "../constants/constants";

// API functions
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

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasFetchedProductsRef = useRef(false);
  const hasFetchedVariantsRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    if (hasFetchedProductsRef.current) return;
    hasFetchedProductsRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithRetry(() => Api.newProducts.getAll());
      const productsData = response?.data || response || [];

      if (!Array.isArray(productsData) || productsData.length === 0) {
        setError("No products available at this time");
        setProducts([]);
        return;
      }
      setProducts(productsData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch products");
      hasFetchedProductsRef.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVariants = useCallback(async () => {
    if (hasFetchedVariantsRef.current) return;
    hasFetchedVariantsRef.current = true;
    try {
      const response = await fetchWithRetry(() => Api.newVariants.getAll());
      const variantsData = response?.data || response || [];

      if (!Array.isArray(variantsData)) {
        console.warn("Invalid variants data received");
        hasFetchedVariantsRef.current = false;
        return;
      }
      setVariants(variantsData);
    } catch (err) {
      console.warn("Failed to fetch variants:", err);
      hasFetchedVariantsRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchVariants();
  }, [fetchProducts, fetchVariants]);

  const handleRetry = useCallback(() => {
    hasFetchedProductsRef.current = false;
    hasFetchedVariantsRef.current = false;
    fetchProducts();
    fetchVariants();
  }, [fetchProducts, fetchVariants]);

  return (
    <ProductGridLayout
      title="Product Listings"
      rawProducts={products}
      variants={variants}
      loading={loading}
      error={error}
      onRetry={handleRetry}
      syncToUrl={true}
      showSearch={false}
    />
  );
};

export default ProductList;
