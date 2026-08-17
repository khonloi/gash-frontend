"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb/Breadcrumb";
import { FilterSidebar, FilterState } from "@/components/ui/FilterSidebar/FilterSidebar";
import { CollectionControlBar } from "@/components/ui/CollectionControlBar/CollectionControlBar";
import { ProductCard } from "@/components/ui/ProductCard/ProductCard";
import styles from "./page.module.css";

// 1. Mock Data for Yoga Collection
const MOCK_YOGA_PRODUCTS = [
  {
    id: "y1",
    brand: "NIKE",
    title: "Women's Nike Yoga Dri-FIT Luxe Crop Top",
    originalPrice: 65,
    salePrice: 52,
    discountPercent: 20,
    category: "tops",
    color: "black",
    size: "m",
    gender: "women",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y2",
    brand: "LULULEMON",
    title: "Align™ High-Rise Pant 25\"",
    originalPrice: 98,
    salePrice: 98,
    category: "bottoms",
    color: "pink",
    size: "s",
    gender: "women",
    imageUrl: "https://images.unsplash.com/photo-1552196563-55259259a54f?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y3",
    brand: "ADIDAS",
    title: "Yoga Studio Wrapped Long Sleeve Top",
    originalPrice: 55,
    salePrice: 38.5,
    discountPercent: 30,
    category: "tops",
    color: "blue",
    size: "l",
    gender: "women",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y4",
    brand: "UNDER ARMOUR",
    title: "Women's UA Meridian Leggings",
    originalPrice: 70,
    salePrice: 55,
    discountPercent: 21,
    category: "bottoms",
    color: "black",
    size: "m",
    gender: "women",
    imageUrl: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y5",
    brand: "PUMA",
    title: "Studio Foundation Wash Rib Bra",
    originalPrice: 40,
    salePrice: 28,
    discountPercent: 30,
    category: "bras",
    color: "grey",
    size: "s",
    gender: "women",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y6",
    brand: "MANDUKA",
    title: "PRO Yoga Mat 6mm",
    originalPrice: 138,
    salePrice: 138,
    category: "accessories",
    color: "black",
    size: "one-size",
    gender: "unisex",
    imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y7",
    brand: "NIKE",
    title: "Men's Yoga Dri-FIT Shorts",
    originalPrice: 55,
    salePrice: 44,
    discountPercent: 20,
    category: "bottoms",
    color: "grey",
    size: "l",
    gender: "men",
    imageUrl: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y8",
    brand: "LULULEMON",
    title: "The Reversible Mat 5mm",
    originalPrice: 88,
    salePrice: 70,
    discountPercent: 20,
    category: "accessories",
    color: "blue",
    size: "one-size",
    gender: "unisex",
    imageUrl: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y9",
    brand: "ALO YOGA",
    title: "Warrior Mat",
    originalPrice: 120,
    salePrice: 120,
    category: "accessories",
    color: "pink",
    size: "one-size",
    gender: "unisex",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y10",
    brand: "ALO YOGA",
    title: "Airlift Intrigue Bra",
    originalPrice: 64,
    salePrice: 64,
    category: "bras",
    color: "black",
    size: "m",
    gender: "women",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y11",
    brand: "ADIDAS",
    title: "Men's Yoga Base Tee",
    originalPrice: 35,
    salePrice: 24.5,
    discountPercent: 30,
    category: "tops",
    color: "white",
    size: "m",
    gender: "men",
    imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "y12",
    brand: "NIKE",
    title: "Yoga Foam Block",
    originalPrice: 20,
    salePrice: 15,
    discountPercent: 25,
    category: "accessories",
    color: "grey",
    size: "one-size",
    gender: "unisex",
    imageUrl: "https://images.unsplash.com/photo-1593368857313-81a1795b54fa?auto=format&fit=crop&w=500&q=80",
  },
];

const FILTER_CATEGORIES = [
  {
    id: "gender",
    title: "Gender",
    type: "checkbox" as const,
    options: [
      { id: "women", label: "Women's" },
      { id: "men", label: "Men's" },
      { id: "unisex", label: "Unisex" },
    ],
  },
  {
    id: "brand",
    title: "Brand",
    type: "checkbox" as const,
    options: [
      { id: "nike", label: "NIKE" },
      { id: "adidas", label: "ADIDAS" },
      { id: "lululemon", label: "LULULEMON" },
      { id: "alo-yoga", label: "ALO YOGA" },
      { id: "manduka", label: "MANDUKA" },
      { id: "puma", label: "PUMA" },
      { id: "under-armour", label: "UNDER ARMOUR" },
    ],
  },
  {
    id: "category",
    title: "Product Type",
    type: "checkbox" as const,
    options: [
      { id: "tops", label: "Tops & T-Shirts" },
      { id: "bottoms", label: "Pants & Tights" },
      { id: "bras", label: "Sports Bras" },
      { id: "accessories", label: "Mats & Accessories" },
    ],
  },
  {
    id: "size",
    title: "Size",
    type: "checkbox" as const,
    options: [
      { id: "s", label: "Small (S)" },
      { id: "m", label: "Medium (M)" },
      { id: "l", label: "Large (L)" },
      { id: "one-size", label: "One Size" },
    ],
  },
  {
    id: "color",
    title: "Color",
    type: "color" as const,
    options: [
      { id: "black", label: "Black", colorCode: "#000000" },
      { id: "white", label: "White", colorCode: "#ffffff" },
      { id: "grey", label: "Grey", colorCode: "#808080" },
      { id: "blue", label: "Blue", colorCode: "#0000ff" },
      { id: "pink", label: "Pink", colorCode: "#ffc0cb" },
    ],
  },
];

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
