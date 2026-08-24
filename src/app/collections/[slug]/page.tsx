"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Breadcrumb,
  FilterSidebar,
  CollectionControlBar,
  ProductCard,
  Pagination,
  EmptyState,
  Button,
} from "@/components/ui";
import { FilterState, FilterCategory } from "@/components/ui/FilterSidebar/FilterSidebar";
import styles from "./page.module.css";

import { FrontendProduct } from "@/types/product";
import { fetchProducts } from "@/services/productService";

const ITEMS_PER_PAGE = 30;

// Helper to extract params safely (Next.js 14/15 compatibility)
// We cast params as any to handle both Object and Promise
export default function CollectionPage({ params }: { params: any }) {
  const [slug, setSlug] = useState<string>("Collection");
  const [products, setProducts] = useState<FrontendProduct[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const [sortValue, setSortValue] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset to page 1 when slug, active filters, or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [slug, activeFilters, sortValue]);

  useEffect(() => {
    // Handle both Promise and Object params
    const resolveParams = async () => {
      const p = await params;
      if (p?.slug) {
        // Capitalize first letter
        setSlug(p.slug.charAt(0).toUpperCase() + p.slug.slice(1));
      }
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    const loadProducts = async () => {
      const allProducts = await fetchProducts();
      setProducts(allProducts);
    };
    loadProducts();
  }, []);

  // Pre-filter products based on collection slug
  const collectionProducts = useMemo(() => {
    if (!slug || slug.toLowerCase() === 'all' || slug.toLowerCase() === 'collection') {
      return products;
    }
    const s = slug.toLowerCase();
    return products.filter(p => 
      p.category.toLowerCase().includes(s) ||
      p.gender.toLowerCase() === s ||
      p.brand.toLowerCase().replace(" ", "-") === s
    );
  }, [products, slug]);

  // Dynamically generate filter categories based on the current collection's products
  const dynamicFilterCategories = useMemo<FilterCategory[]>(() => {
    const brands = Array.from(new Set(collectionProducts.map(p => p.brand))).filter(Boolean);
    const categories = Array.from(new Set(collectionProducts.map(p => p.category))).filter(Boolean);
    const genders = Array.from(new Set(collectionProducts.map(p => p.gender))).filter(Boolean);
    const sizes = Array.from(new Set(collectionProducts.flatMap(p => p.sizes))).filter(Boolean);
    const colors = Array.from(new Set(collectionProducts.flatMap(p => p.colors))).filter(Boolean);

    return [
      {
        id: "gender",
        title: "Gender",
        type: "checkbox",
        options: genders.map(g => ({ id: g, label: g }))
      },
      {
        id: "brand",
        title: "Brand",
        type: "checkbox",
        options: brands.map(b => ({ id: b, label: b }))
      },
      {
        id: "category",
        title: "Product Type",
        type: "checkbox",
        options: categories.map(c => ({ id: c, label: c }))
      },
      {
        id: "size",
        title: "Size",
        type: "checkbox",
        options: sizes.map(s => ({ id: s, label: s }))
      },
      {
        id: "color",
        title: "Color",
        type: "checkbox", // Use checkbox for colors to avoid hex code requirement for Vietnamese names
        options: colors.map(c => ({ id: c, label: c }))
      }
    ];
  }, [collectionProducts]);

  const handleFilterChange = (categoryId: string, optionId: string) => {
    setActiveFilters((prev) => {
      const currentCategoryFilters = prev[categoryId] || [];
      const isSelected = currentCategoryFilters.includes(optionId);
      
      let newFilters;
      if (isSelected) {
        newFilters = currentCategoryFilters.filter((id) => id !== optionId);
      } else {
        newFilters = [...currentCategoryFilters, optionId];
      }
      
      return {
        ...prev,
        [categoryId]: newFilters,
      };
    });
  };

  // Filter products based on active filters
  const filteredProducts = collectionProducts.filter((product) => {
    // Check Gender
    if (activeFilters.gender?.length > 0) {
      if (!activeFilters.gender.includes(product.gender)) return false;
    }
    // Check Brand
    if (activeFilters.brand?.length > 0) {
      if (!activeFilters.brand.includes(product.brand)) return false;
    }
    // Check Category
    if (activeFilters.category?.length > 0) {
      if (!activeFilters.category.includes(product.category)) return false;
    }
    // Check Size
    if (activeFilters.size?.length > 0) {
      if (!activeFilters.size.some(size => product.sizes.includes(size))) return false;
    }
    // Check Color
    if (activeFilters.color?.length > 0) {
      if (!activeFilters.color.some(color => product.colors.includes(color))) return false;
    }
    
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortValue) {
      case "price_asc":
        return a.salePrice - b.salePrice;
      case "price_desc":
        return b.salePrice - a.salePrice;
      case "newest":
        // For mock, just return original order
        return 0;
      case "best_selling":
        // Mock best selling
        return (b.discountPercent || 0) - (a.discountPercent || 0);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 280, behavior: "smooth" });
    }
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Collections", href: "#" },
    { label: slug },
  ];

  return (
    <main className={styles.pageContainer}>
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Collection Hero */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>{slug}</h1>
          <p className={styles.heroDescription}>
            Discover our curated {slug.toLowerCase()} collection. Everything you need to focus, breathe, and flow comfortably. 
            From highly supportive mats to breathable activewear.
          </p>
        </div>

        <div className={styles.contentLayout}>
          <div className={styles.sidebarWrapper}>
            <FilterSidebar
              categories={dynamicFilterCategories}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div className={styles.mainContent}>
            <CollectionControlBar
              totalCount={sortedProducts.length}
              sortValue={sortValue}
              onSortChange={setSortValue}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {sortedProducts.length === 0 ? (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters to see more results."
                action={
                  <Button
                    variant="outline"
                    onClick={() => setActiveFilters({})}
                  >
                    Clear all filters
                  </Button>
                }
              />
            ) : (
              <>
                <div className={`${styles.productGrid} ${viewMode === 'list' ? styles.listMode : ''}`}>
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      handle={product.handle}
                      brand={product.brand}
                      title={product.title}
                      originalPrice={product.originalPrice}
                      salePrice={product.salePrice}
                      discountPercent={product.discountPercent ?? undefined}
                      imageUrl={product.imageUrl}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={sortedProducts.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
