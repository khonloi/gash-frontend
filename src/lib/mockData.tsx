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
