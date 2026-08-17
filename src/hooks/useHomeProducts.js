import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Api from '../common/SummaryAPI';
import { fetchWithRetry } from '../utils/fetchWithRetry';

const getRandomItems = (arr, count, excludeIds = []) => {
  if (!Array.isArray(arr) || arr.length <= count) return arr;
  const filtered = excludeIds.length > 0 ? arr.filter(item => !excludeIds.includes(item._id || item)) : arr;
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const useHomeProducts = () => {
  const { data: productsData, isLoading: loading, error: queryError, refetch: fetchProducts } = useQuery({
    queryKey: ['homeProducts'],
    queryFn: async () => {
      const response = await fetchWithRetry(() => Api.products.getAll());
      const data = response?.data || response || [];
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No products available at this time');
      }
      
      // Filter active products with variants
      return data.filter(
        (product) =>
          product.productStatus === 'active' && product.productVariantIds?.length > 0
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const error = queryError?.response?.data?.message || queryError?.message || (queryError ? 'Failed to fetch products' : null);
  const products = useMemo(() => productsData || [], [productsData]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .filter((product) => product.categoryId && !product.categoryId.isDeleted)
          .map((product) => product.categoryId?.categoryName)
          .filter(Boolean)
      ),
    ];
  }, [products]);

  const [forYouProducts, setForYouProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [randomCategorySections, setRandomCategorySections] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const forYou = getRandomItems(products, 5);
      setForYouProducts(forYou);
      setRecommendedProducts(getRandomItems(products, 5, forYou.map((p) => p._id)));
    }
  }, [products]);

  useEffect(() => {
    if (categories.length > 0 && products.length > 0) {
      const shuffledCategories = [...categories].sort(() => 0.5 - Math.random());
      const selectedCategories = shuffledCategories.slice(0, 2);

      const sections = selectedCategories.map((catName) => {
        const matching = products.filter((p) => p.categoryId?.categoryName === catName);
        return {
          categoryName: catName,
          products: getRandomItems(matching, 5),
        };
      });
      setRandomCategorySections(sections);
    }
  }, [categories, products]);

  return {
    products,
    loading,
    error,
    categories,
    forYouProducts,
    recommendedProducts,
    randomCategorySections,
    fetchProducts,
  };
};
