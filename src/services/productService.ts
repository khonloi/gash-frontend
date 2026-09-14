import { Product, ProductVariant, FrontendProduct } from "../types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Maps the backend Product model to the FrontendProduct model
 */
export function mapProductToFrontend(product: Product): FrontendProduct {
  // Extract images from product.images or variant featuredImage
  let images: string[] = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    images = product.images;
  } else if (Array.isArray(product.variants)) {
    images = product.variants
      .map((v: ProductVariant) => v.featuredImage?.src || v.imageUrl)
      .filter((src): src is string => Boolean(src));
  }

  // Pick default image
  const defaultImage = images.length > 0 ? images[0] : "";

  // Calculate pricing based on the first variant (or lowest price variant)
  const defaultVariant = product.variants?.[0];
  const salePrice = defaultVariant?.price ?? 0;
  const originalPrice = (defaultVariant?.compareAtPrice && defaultVariant.compareAtPrice > 0)
    ? defaultVariant.compareAtPrice 
    : salePrice;

  // Calculate discount percentage
  let discountPercent = null;
  if (originalPrice > salePrice) {
    discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }

  // Extract sizes and colors from variants' option1, option2, option3
  const sizesSet = new Set<string>();
  const colorsSet = new Set<string>();

  product.variants?.forEach((v: ProductVariant) => {
    if (v.option1) {
      colorsSet.add(v.option1);
    }
    if (v.option2) {
      sizesSet.add(v.option2);
    }
    if (v.option3) {
      sizesSet.add(v.option3);
    }
  });

  const sizes = Array.from(sizesSet);
  const colors = Array.from(colorsSet);

  // Extract category and gender from tags / productType
  const category = product.productType || "All";
  let gender = "Unisex";
  
  const tags: string[] = Array.isArray(product.tags) ? product.tags : [];
  const lowerTags = tags.map((t: string) => t.toLowerCase());
  
  if (lowerTags.includes("nam") || lowerTags.includes("men")) {
    gender = "Men";
  } else if (lowerTags.includes("nữ") || lowerTags.includes("women")) {
    gender = "Women";
  } else if (lowerTags.includes("trẻ em") || lowerTags.includes("kids")) {
    gender = "Kids";
  }

  // Build structured key-value specifications
  const structuredSpecs: Record<string, string> = {
    "Brand": product.vendor || "JOCKSPORTS",
    "Product Type": product.productType || "Sportswear",
    "Category": category,
    "Gender": gender,
    "SKU / Style Code": defaultVariant?.sku || product.id,
  };

  if (colors.length > 0) {
    structuredSpecs["Colorway"] = colors.join(", ");
  }
  if (sizes.length > 0) {
    structuredSpecs["Available Sizes"] = sizes.join(", ");
  }

  // Extract additional technical specs from bodyHtml bullet points if available
  if (typeof product.bodyHtml === "string") {
    const liMatches = Array.from(product.bodyHtml.matchAll(/<li>(.*?)<\/li>/gi));
    liMatches.forEach((match: RegExpMatchArray, idx: number) => {
      const text = match[1].replace(/<[^>]*>/g, '').trim();
      if (text.includes(':')) {
        const [k, ...rest] = text.split(':');
        const keyTrimmed = k.trim();
        const valTrimmed = rest.join(':').trim();
        if (keyTrimmed && valTrimmed && !structuredSpecs[keyTrimmed]) {
          structuredSpecs[keyTrimmed] = valTrimmed;
        }
      } else if (text.length > 0 && idx < 5) {
        structuredSpecs[`Feature ${idx + 1}`] = text;
      }
    });
  }

  structuredSpecs["Authenticity"] = "100% Genuine & Authentic Partner";
  structuredSpecs["Exchange Policy"] = "30-Day Hassle-Free Exchange Policy";

  return {
    id: product.id,
    handle: product.handle || product.id,
    brand: product.vendor || "JOCKSPORTS",
    title: product.title,
    price: salePrice,
    salePrice: salePrice,
    originalPrice: originalPrice,
    discountPercent: discountPercent,
    imageUrl: defaultImage,
    category: category,
    gender: gender,
    size: sizes.length > 0 ? sizes[0] : "",
    sizes: sizes,
    color: colors.length > 0 ? colors[0] : "",
    colors: colors,
    sku: defaultVariant?.sku || "",
    description: product.bodyHtml || "",
    specs: structuredSpecs,
    images: images,
    isNew: false
  };
}

export async function fetchProducts(): Promise<FrontendProduct[]> {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    const data: Product[] = await res.json();
    return data.map(mapProductToFrontend);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function fetchProductByHandle(handleOrId: string): Promise<FrontendProduct | null> {
  try {
    // Try by handle first
    let res = await fetch(`${API_URL}/products/handle/${encodeURIComponent(handleOrId)}`);
    if (!res.ok) {
      // If not found by handle, fallback to try by ID
      res = await fetch(`${API_URL}/products/${encodeURIComponent(handleOrId)}`);
    }
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch product");
    }
    const data: Product = await res.json();
    return mapProductToFrontend(data);
  } catch (error) {
    console.error(`Error fetching product ${handleOrId}:`, error);
    return null;
  }
}
