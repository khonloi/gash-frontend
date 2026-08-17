"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb/Breadcrumb";
import { FilterSidebar, FilterState } from "@/components/ui/FilterSidebar/FilterSidebar";
import { CollectionControlBar } from "@/components/ui/CollectionControlBar/CollectionControlBar";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import styles from "./page.module.css";

import { MOCK_YOGA_PRODUCTS, FILTER_CATEGORIES } from "@/lib/mockData";

// Helper to extract params safely (Next.js 14/15 compatibility)
// We cast params as any to handle both Object and Promise
export default function CollectionPage({ params }: { params: any }) {
  const [slug, setSlug] = useState<string>("Collection");
  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const [sortValue, setSortValue] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
  const filteredProducts = MOCK_YOGA_PRODUCTS.filter((product) => {
    // Check Gender
    if (activeFilters.gender?.length > 0) {
      if (!activeFilters.gender.includes(product.gender)) return false;
    }
    // Check Brand
    if (activeFilters.brand?.length > 0) {
      if (!activeFilters.brand.includes(product.brand.toLowerCase().replace(" ", "-"))) return false;
    }
    // Check Category
    if (activeFilters.category?.length > 0) {
      if (!activeFilters.category.includes(product.category)) return false;
    }
    // Check Size
    if (activeFilters.size?.length > 0) {
      if (!activeFilters.size.includes(product.size)) return false;
    }
    // Check Color
    if (activeFilters.color?.length > 0) {
      if (!activeFilters.color.includes(product.color)) return false;
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
              categories={FILTER_CATEGORIES}
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
              <div className={styles.noResults}>
                <h3>No products found</h3>
                <p>Try adjusting your filters to see more results.</p>
                <button 
                  className={styles.clearBtn}
                  onClick={() => setActiveFilters({})}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className={`${styles.productGrid} ${viewMode === 'list' ? styles.listMode : ''}`}>
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    brand={product.brand}
                    title={product.title}
                    originalPrice={product.originalPrice}
                    salePrice={product.salePrice}
                    discountPercent={product.discountPercent}
                    imageUrl={product.imageUrl}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
