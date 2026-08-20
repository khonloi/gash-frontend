import React from "react";
import {
  Sparkles,
  Activity,
  Dumbbell,
  Mountain,
  Waves,
  Trophy,
} from "lucide-react";

// ----------------------------------------------------------------------
// HOMEPAGE MOCK DATA
// ----------------------------------------------------------------------

export const categories = [
  {
    title: "Lifestyle & Streetwear",
    href: "/collections/all",
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80",
    icon: <Sparkles size={18} />,
  },
  {
    title: "Running",
    href: "/collections/all",
    imageUrl:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=400&q=80",
    icon: <Activity size={18} />,
  },
  {
    title: "Training & Gym",
    href: "/collections/all",
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
    icon: <Dumbbell size={18} />,
  },
  {
    title: "Outdoor & Hiking",
    href: "/collections/all",
    imageUrl:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=400&q=80",
    icon: <Mountain size={18} />,
  },
  {
    title: "Swimming",
    href: "/collections/all",
    imageUrl:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=400&q=80",
    icon: <Waves size={18} />,
  },
  {
    title: "Golf & Tennis",
    href: "/collections/all",
    imageUrl:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=400&q=80",
    icon: <Trophy size={18} />,
  },
];

export const hotProducts = [
  {
    id: "1",
    brand: "ADIDAS",
    title: "Men's Ultraboost 5 Light Running Shoes Core Black",
    originalPrice: 190,
    salePrice: 133,
    discountPercent: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "2",
    brand: "NIKE",
    title: "Men's Air Zoom Pegasus 41 Volt Green Performance",
    originalPrice: 140,
    salePrice: 108,
    discountPercent: 23,
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "3",
    brand: "UNDER ARMOUR",
    title: "Men's UA Tech 2.0 Short Sleeve Training Tee",
    originalPrice: 35,
    salePrice: 24.5,
    discountPercent: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "4",
    brand: "PUMA",
    title: "Women's Velocity Nitro 3 Fade Sunset Running Shoes",
    originalPrice: 135,
    salePrice: 94.5,
    discountPercent: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "5",
    brand: "ASICS",
    title: "Men's Gel-Kayano 31 Platinum Edition Road Running",
    originalPrice: 165,
    salePrice: 140,
    discountPercent: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "6",
    brand: "NEW BALANCE",
    title: "Unisex 574 Core Evergreen Classic Sneakers",
    originalPrice: 90,
    salePrice: 67.5,
    discountPercent: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "7",
    brand: "SPEEDO",
    title: "Fastskin Hyper Elite Anti-Glare Racing Goggles",
    originalPrice: 65,
    salePrice: 52,
    discountPercent: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "8",
    brand: "COLUMBIA",
    title: "Men's Watertight II Waterproof Packable Rain Jacket",
    originalPrice: 100,
    salePrice: 75,
    discountPercent: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "9",
    brand: "NIKE",
    title: "Brasilia 9.5 Training Backpack Medium 24L",
    originalPrice: 48,
    salePrice: 38.4,
    discountPercent: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "10",
    brand: "ADIDAS",
    title: "Aeroready Lightweight Running Performance Cap",
    originalPrice: 25,
    salePrice: 20,
    discountPercent: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=500&q=80",
  },
];

export const newCollections = [
  {
    brand: "ASICS",
    title: "BLAZEBLAST RUN",
    badgeText: "NEW IN",
    imageUrl:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80",
    href: "/collections/all",
  },
  {
    brand: "COLUMBIA",
    title: "TRAIL RUN KONOS",
    imageUrl:
      "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=500&q=80",
    href: "/collections/all",
  },
  {
    brand: "UNDER ARMOUR",
    title: "HEARTBEAT TRAINER",
    badgeText: "BESTSELLER",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
    href: "/collections/all",
  },
  {
    brand: "ADIDAS",
    title: "CLUB JERSEYS 26/27",
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80",
    href: "/collections/all",
  },
  {
    brand: "HOKA",
    title: "MARATHON SPEED FLY",
    badgeText: "HOT DROP",
    imageUrl:
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=500&q=80",
    href: "/collections/all",
  },
];

export const featuredCollections = [
  {
    category: "TENNIS",
    title: "NEW COURT ARRIVALS",
    subtitle: "Engineered grip, stability & breathability",
    brandsText: "NIKE • ADIDAS • ASICS",
    imageUrl:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80",
    href: "/collections/all",
  },
  {
    category: "LIFESTYLE",
    title: "STREETWEAR CULTURE",
    subtitle: "Everyday urban fashion meets athletic comfort",
    brandsText: "PUMA • CROCS • COLUMBIA",
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    href: "/collections/all",
  },
  {
    category: "TRAINING",
    title: "METCON & GYM ESSENTIALS",
    subtitle: "High-intensity durability & sweat-wicking gear",
    brandsText: "UNDER ARMOUR • NIKE PRO",
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    href: "/collections/all",
  },
  {
    category: "RUNNING",
    title: "MARATHON & TRACK PRO",
    subtitle: "Ultra-cushioned carbon plate race day shoes",
    brandsText: "HOKA • SAUCONY • NIKE ZOOM",
    imageUrl:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80",
    href: "/collections/all",
  },
];

export const favoriteSports = [
  {
    title: "RUNNING",
    imageUrl:
      "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
  {
    title: "STREETWEAR",
    imageUrl:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
  {
    title: "TRAINING & GYM",
    imageUrl:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
  {
    title: "OUTDOOR & TRAIL",
    imageUrl:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
  {
    title: "FOOTBALL",
    imageUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
  {
    title: "SWIMMING",
    imageUrl:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
];

export const journalArticles = [
  {
    title: "Nike Free Metcon 7: The Hybrid Cross-Training King Tested",
    category: "TRAINING",
    date: "Aug 14, 2026",
    readTime: "5 min read",
    imageUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
  {
    title: "Asics Novablast 6 Review: Max Cushioning Energy Return",
    category: "RUNNING",
    date: "Aug 12, 2026",
    readTime: "4 min read",
    imageUrl:
      "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
  {
    title: "The Ultimate 26/27 Football Kit Collection & Authentic Badges",
    category: "FOOTBALL",
    date: "Aug 10, 2026",
    readTime: "6 min read",
    imageUrl:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
  {
    title: "Speedo Fastskin Guide: Choosing the Right Competition Goggles",
    category: "SWIMMING",
    date: "Aug 08, 2026",
    readTime: "3 min read",
    imageUrl:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=600&q=80",
    href: "/collections/all",
  },
];

export const brands = [
  "HOKA",
  "PUMA",
  "NIKE",
  "COLUMBIA",
  "UNDER ARMOUR",
  "ASICS",
  "ADIDAS",
  "TEVA",
  "SPEEDO",
  "ON RUNNING",
  "CROCS",
  "+30 MORE BRANDS",
];


// ----------------------------------------------------------------------
// COLLECTIONS MOCK DATA
// ----------------------------------------------------------------------

export const MOCK_YOGA_PRODUCTS = [
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

export const FILTER_CATEGORIES = [
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

// ----------------------------------------------------------------------
// PRODUCT DETAIL MOCK DATA
// ----------------------------------------------------------------------

export const mockProductDetail = {
  id: "c1",
  sku: "2136221125-sea-salt",
  brand: "COLUMBIA",
  title: "Women's Columbia Benton Springs™ Relaxed Full Zip - Beige",
  category: "JACKETS",
  price: 79.99,
  originalPrice: 79.99,
  isNew: true,
  images: [
    "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544441892-794166f1e310?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544441892-794166f1e312?auto=format&fit=crop&w=800&q=80",
  ],
  colors: [
    {
      id: "sea-salt",
      name: "BEIGE (SEA SALT)",
      imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: "dusty-pink",
      name: "PINK (DUSTY PINK)",
      imageUrl: "https://images.unsplash.com/photo-1544441892-794166f1e310?auto=format&fit=crop&w=150&q=80",
    },
  ],
  sizes: [
    { id: "xs", label: "US/XS", inStock: true },
    { id: "s", label: "US/S", inStock: true },
    { id: "m", label: "US/M", inStock: true },
    { id: "l", label: "US/L", inStock: false },
    { id: "xl", label: "US/XL", inStock: true },
  ],
  fit: "Loose",
  description: [
    "The classic Columbia Benton Springs fleece jacket has been upgraded with a looser, more comfortable fit.",
    "Soft fleece material provides perfect warmth for chilly days.",
    "Two side pockets with secure zippers.",
    "Note: US fit is larger than standard Asian sizing. Please size down if you prefer a slim fit.",
  ],
  specs: {
    "Sports": "Outdoor / Lifestyle",
    "Collar Type": "Stand collar",
    "Fit Type": "Loose Fit",
    "Material": "100% polyester MTR filament fleece 250g",
  }
};

export const mockRelatedProducts = [
  {
    id: "r1",
    brand: "COLUMBIA",
    title: "Women's Columbia Arcadia II Rain Jacket",
    originalPrice: 88.00,
    salePrice: 70.40,
    discountPercent: 20,
    imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "r2",
    brand: "THE NORTH FACE",
    title: "Women's The North Face Resolve 2",
    originalPrice: 95.00,
    salePrice: 95.00,
    imageUrl: "https://images.unsplash.com/photo-1544441892-794166f1e310?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "r3",
    brand: "COLUMBIA",
    title: "Women's Columbia Fire Side II Fleece",
    originalPrice: 75.00,
    salePrice: 56.25,
    discountPercent: 25,
    imageUrl: "https://images.unsplash.com/photo-1544441892-794166f1e312?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "r4",
    brand: "PATAGONIA",
    title: "Women's Patagonia Better Sweater",
    originalPrice: 139.00,
    salePrice: 139.00,
    imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "r5",
    brand: "NIKE",
    title: "Women's Sportswear Therma-FIT Repel Jacket",
    originalPrice: 110.00,
    salePrice: 88.00,
    discountPercent: 20,
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80",
  },
];
